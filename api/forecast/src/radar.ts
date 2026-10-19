import { z } from "zod";
import type { RadarFrames } from "../../../src/data/types.ts";
import { createLru } from "./lru.ts";
import { createCoalescer } from "./upstream.ts";
import type { Upstream } from "./upstream.ts";

const MANIFEST_URL = new URL(
  "https://api.rainviewer.com/public/weather-maps.json",
);
const TILE_HOST = "https://tilecache.rainviewer.com";
const MANIFEST_BYTES = 256 * 1024;
const TILE_BYTES = 1024 * 1024;
const MAX_FRAMES = 3;
const MAX_ZOOM = 7;
// Fixed server-side: 256 px tiles, colour scheme 2, smoothed, snow shown.
const TILE_STYLE = "256/{z}/{x}/{y}/2/1_1.png";
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const manifestSchema = z.object({
  host: z.literal(TILE_HOST),
  radar: z.object({
    past: z.array(
      z.object({
        time: z.number().int().positive(),
        path: z.string().regex(/^\/v2\/radar\/[A-Za-z0-9]{1,64}$/),
      }),
    ),
  }),
});

type Frame = { id: string; time: number; path: string };

/** A validated tile request. */
export type TileRequest = { frame: string; z: number; x: number; y: number };

/**
 * Parses /api/radar/tiles/<frame>/<z>/<x>/<y>.png. Zoom must be an integer from 0 to 7 and
 * the tile inside the 2^z grid.
 *
 * @param path - The request path.
 * @returns The tile, or null when the path is invalid.
 */
export function parseTilePath(path: string): TileRequest | null {
  const match =
    /^\/api\/radar\/tiles\/(\d{1,12})\/(\d{1,2})\/(\d{1,3})\/(\d{1,3})\.png$/.exec(
      path,
    );
  if (!match) return null;
  const [, frame = "", zText = "", xText = "", yText = ""] = match;
  const z = Number(zText);
  const x = Number(xText);
  const y = Number(yText);
  const size = 2 ** z;
  if (z > MAX_ZOOM || x >= size || y >= size) return null;
  return { frame, z, x, y };
}

/**
 * Whether bytes start with the PNG signature.
 *
 * @param bytes - Tile bytes.
 * @returns True for a PNG.
 */
export function isPng(bytes: Uint8Array): boolean {
  return PNG_SIGNATURE.every((value, index) => bytes[index] === value);
}

/**
 * Validates the RainViewer manifest and keeps the newest past frames.
 *
 * @param body - Raw manifest bytes.
 * @returns Up to three frames, oldest first, or null when invalid.
 */
export function parseManifest(body: Uint8Array): Frame[] | null {
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return null;
  }
  const parsed = manifestSchema.safeParse(json);
  if (!parsed.success) return null;
  return parsed.data.radar.past
    .slice()
    .sort((left, right) => left.time - right.time)
    .slice(-MAX_FRAMES)
    .map(({ time, path }) => ({ id: String(time), time, path }));
}

/** Radar frames and tiles, fetched server-side only. */
export type RadarSource = {
  frames: () => Promise<RadarFrames | null>;
  tile: (request: TileRequest) => Promise<Uint8Array | null>;
};

/**
 * Creates the radar source: the global manifest cached for five minutes, and tiles for
 * frames in that manifest cached for ten minutes (at most 2,000 tiles and 64 MiB). Tiles
 * for frames not in the current manifest are refused.
 *
 * @param upstream - The shared upstream client.
 * @param now - Clock.
 * @returns The radar source.
 */
export function createRadarSource(
  upstream: Upstream,
  now: () => number = Date.now,
): RadarSource {
  let manifest: { frames: Frame[]; expires: number } | null = null;
  const tiles = createLru<string, Uint8Array>({
    maxEntries: 2000,
    maxBytes: 64 * 1024 * 1024,
    ttlMs: 10 * 60_000,
    size: (value) => value.byteLength,
    now,
  });
  const coalesce = createCoalescer();

  const currentFrames = async (): Promise<Frame[] | null> => {
    if (manifest && manifest.expires > now()) return manifest.frames;
    return coalesce("manifest", async () => {
      try {
        const frames = parseManifest(
          await upstream.get(MANIFEST_URL, MANIFEST_BYTES),
        );
        if (!frames) return null;
        manifest = { frames, expires: now() + 5 * 60_000 };
        return frames;
      } catch {
        return null;
      }
    });
  };

  return {
    async frames() {
      const frames = await currentFrames();
      if (!frames) return null;
      return {
        frames: frames.map(({ id, time }) => ({
          id,
          time: new Date(time * 1000).toISOString(),
        })),
      };
    },
    async tile({ frame, z, x, y }) {
      const frames = await currentFrames();
      const match = frames?.find((candidate) => candidate.id === frame);
      if (!match) return null;
      const key = `${frame}/${String(z)}/${String(x)}/${String(y)}`;
      const cached = tiles.get(key);
      if (cached) return cached;
      return coalesce(`tile:${key}`, async () => {
        const url = new URL(
          `${TILE_HOST}${match.path}/${TILE_STYLE.replace("{z}", String(z))
            .replace("{x}", String(x))
            .replace("{y}", String(y))}`,
        );
        try {
          const bytes = await upstream.get(url, TILE_BYTES);
          if (!isPng(bytes)) return null;
          tiles.set(key, bytes);
          return bytes;
        } catch {
          return null;
        }
      });
    },
  };
}
