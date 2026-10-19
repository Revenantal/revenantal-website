import { useEffect, useMemo, useState } from "preact/hooks";
import { TILE, fetchFrames, project, tileLayout } from "./weather";
import styles from "./TvGuide.module.css";

const ZOOM = 5;
const FRAME_MS = 700;
const IN_FLIGHT = 2;

/** The bundled Natural Earth layers: flat [lon, lat, …] lists in hundredths of a degree. */
export type BaseMap = {
  land: number[][];
  lakes: number[][];
  borders: number[][];
  states: number[][];
};
let mapMemory: BaseMap | null = null;

const isShapes = (value: unknown): value is number[][] =>
  Array.isArray(value) && value.every((shape) => Array.isArray(shape));

/**
 * Loads the bundled base map once per visit.
 *
 * @param signal - Aborts on tune-away.
 * @returns The layers, or null.
 */
async function loadBaseMap(signal: AbortSignal): Promise<BaseMap | null> {
  if (mapMemory) return mapMemory;
  try {
    const response = await fetch("/assets/tv-guide/base-map.json", { signal });
    if (!response.ok) return null;
    const body = (await response.json()) as Partial<
      Record<keyof BaseMap, unknown>
    >;
    const { land, lakes, borders, states } = body;
    if (
      !isShapes(land) ||
      !isShapes(lakes) ||
      !isShapes(borders) ||
      !isShapes(states)
    )
      return null;
    mapMemory = { land, lakes, borders, states };
    return mapMemory;
  } catch {
    return null;
  }
}

/**
 * Builds SVG path data for shapes inside the view: closed rings or open lines.
 *
 * @param shapes - Flat [lon, lat, …] lists × 100.
 * @param closed - Close each shape (rings) or leave it open (lines).
 * @param originX - View origin in world pixels.
 * @param originY - View origin in world pixels.
 * @param width - View width.
 * @param height - View height.
 * @returns The path data.
 */
export function shapePath(
  shapes: number[][],
  closed: boolean,
  originX: number,
  originY: number,
  width: number,
  height: number,
): string {
  const parts: string[] = [];
  for (const shape of shapes) {
    const points: string[] = [];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let index = 0; index + 1 < shape.length; index += 2) {
      const [x, y] = project(
        (shape[index] ?? 0) / 100,
        (shape[index + 1] ?? 0) / 100,
        ZOOM,
      );
      const left = x - originX;
      const top = y - originY;
      minX = Math.min(minX, left);
      maxX = Math.max(maxX, left);
      minY = Math.min(minY, top);
      maxY = Math.max(maxY, top);
      points.push(`${left.toFixed(1)} ${top.toFixed(1)}`);
    }
    if (maxX < 0 || minX > width || maxY < 0 || minY > height) continue;
    parts.push(`M${points.join("L")}${closed ? "Z" : ""}`);
  }
  return parts.join("");
}

/**
 * Runs tasks with at most `limit` in flight.
 *
 * @param tasks - Work to run.
 * @param limit - Most at once.
 */
async function pool(tasks: (() => Promise<void>)[], limit: number) {
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const task = tasks[next];
      next += 1;
      if (task) await task();
    }
  };
  await Promise.all(Array.from({ length: limit }, worker));
}

/**
 * The radar view: land, lakes, coastlines and borders from the bundled Natural Earth map, recent radar
 * frames over it (same-origin, at most two requests at a time, cancelled on tune-away) and a
 * marker on the city. Missing coverage or failed tiles say "Radar unavailable"; they are
 * never shown as clear skies.
 *
 * @param props - City, size and motion state.
 * @param props.latitude - City latitude.
 * @param props.longitude - City longitude.
 * @param props.city - City name for the marker.
 * @param props.width - View width.
 * @param props.height - View height.
 * @param props.cityX - Marker position from the left.
 * @param props.cityY - Marker position from the top.
 * @param props.active - Whether the channel is tuned in and visible.
 * @param props.reducedMotion - Show only the newest frame.
 * @param props.onFrameTime - Reports the shown frame's time.
 * @returns The radar view.
 */
export function RadarMap({
  latitude,
  longitude,
  city,
  width,
  height,
  cityX,
  cityY,
  active,
  reducedMotion,
  onFrameTime,
}: {
  latitude: number;
  longitude: number;
  city: string;
  width: number;
  height: number;
  cityX: number;
  cityY: number;
  active: boolean;
  reducedMotion: boolean;
  onFrameTime: (time: Date | null) => void;
}) {
  const layout = useMemo(
    () =>
      tileLayout({ latitude, longitude }, ZOOM, {
        width,
        height,
        cityX,
        cityY,
      }),
    [latitude, longitude, width, height, cityX, cityY],
  );
  const [baseMap, setBaseMap] = useState<BaseMap | null>(mapMemory);
  const [frames, setFrames] = useState<
    { id: string; urls: (string | null)[] }[]
  >([]);
  const [radar, setRadar] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  const [shown, setShown] = useState(0);

  // The bundled map, once per visit.
  useEffect(() => {
    if (!active || baseMap) return;
    const controller = new AbortController();
    void loadBaseMap(controller.signal).then((loaded) => {
      if (!controller.signal.aborted) setBaseMap(loaded);
    });
    return () => {
      controller.abort();
    };
  }, [active, baseMap]);

  // Radar frames: fetched while active, released on tune-away.
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    // Read through a function: the flag changes while awaiting.
    const stopped = () => controller.signal.aborted;
    const urls: string[] = [];
    void (async () => {
      const ids = await fetchFrames(controller.signal);
      if (controller.signal.aborted) return;
      if (!ids) {
        setRadar("unavailable");
        return;
      }
      const loaded = ids.map((id) => ({
        id,
        urls: layout.tiles.map(() => null as string | null),
      }));
      // Newest frame first, so something useful appears soonest.
      const tasks = [...loaded].reverse().flatMap((frame) =>
        layout.tiles.map((tile, index) => async () => {
          if (controller.signal.aborted) return;
          try {
            const response = await fetch(
              `/api/radar/tiles/${frame.id}/${String(tile.z)}/${String(tile.x)}/${String(tile.y)}.png`,
              { signal: controller.signal, credentials: "same-origin" },
            );
            if (response.status !== 200) return;
            const url = URL.createObjectURL(await response.blob());
            urls.push(url);
            frame.urls[index] = url;
          } catch {
            // A failed tile leaves its square empty and is reported below.
          }
        }),
      );
      await pool(tasks, IN_FLIGHT);
      if (stopped()) return;
      const complete = loaded.filter((frame) => frame.urls.every(Boolean));
      setFrames(complete);
      setShown(Math.max(complete.length - 1, 0));
      setRadar(complete.length > 0 ? "ready" : "unavailable");
    })();
    return () => {
      controller.abort();
      for (const url of urls) URL.revokeObjectURL(url);
      setFrames([]);
      setRadar("loading");
    };
  }, [active, layout]);

  // Loop the frames like a TV radar sweep, only while active and with full motion.
  useEffect(() => {
    if (!active || reducedMotion || frames.length < 2) return;
    const timer = window.setInterval(() => {
      setShown((index) => (index + 1) % frames.length);
    }, FRAME_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [active, reducedMotion, frames.length]);

  const frame = frames[reducedMotion ? frames.length - 1 : shown];
  useEffect(() => {
    onFrameTime(frame ? new Date(Number(frame.id) * 1000) : null);
  }, [frame, onFrameTime]);

  const draw = (shapes: number[][], closed: boolean) =>
    shapePath(shapes, closed, layout.originX, layout.originY, width, height);
  return (
    <div className={styles.radar} aria-hidden="true">
      <svg
        className={styles.land}
        viewBox={`0 0 ${String(width)} ${String(height)}`}
      >
        {baseMap ? (
          <>
            <path className={styles["map-land"]} d={draw(baseMap.land, true)} />
            <path
              className={styles["map-lakes"]}
              d={draw(baseMap.lakes, true)}
            />
            <path
              className={styles["map-states"]}
              d={draw(baseMap.states, false)}
            />
            <path
              className={styles["map-borders"]}
              d={draw(baseMap.borders, false)}
            />
          </>
        ) : null}
      </svg>
      {frame
        ? layout.tiles.map((tile, index) => (
            <img
              key={`${frame.id}-${String(index)}`}
              className={styles.tile}
              src={frame.urls[index] ?? ""}
              alt=""
              style={{
                left: `${String(tile.left)}px`,
                top: `${String(tile.top)}px`,
                width: `${String(TILE)}px`,
                height: `${String(TILE)}px`,
              }}
            />
          ))
        : null}
      <span
        className={styles.marker}
        style={{ left: `${String(cityX)}px`, top: `${String(cityY)}px` }}
      >
        <span className={styles.ping} />
        <span className={styles.dot} />
        <span className={`${styles.shadow ?? ""} ${styles["city-name"] ?? ""}`}>
          {city}
        </span>
      </span>
      {radar === "unavailable" ? (
        <span className={`${styles.shadow ?? ""} ${styles["radar-off"] ?? ""}`}>
          Radar unavailable
        </span>
      ) : null}
    </div>
  );
}
