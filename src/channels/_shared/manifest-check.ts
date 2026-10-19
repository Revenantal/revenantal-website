import type { ChannelAudio, DisplayProfile } from "../../data/types";
import type { ChannelManifest } from "./types";

const KINDS = new Set(["directory", "game", "toy", "broadcast", "credits"]);
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Sets, not comparisons: manifests are checked at runtime, beyond what the types promise.
const TRANSITIONS = new Set<unknown>(["static", "cut"]);
const LOOP_KINDS = new Set<unknown>(["music", "ambient"]);
const LOOP_STARTS = new Set<unknown>(["on-active", "manual"]);

const isUnit = (value: unknown) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 1;

function profileProblems(display: DisplayProfile): string[] {
  const problems: string[] = [];
  if (
    display.scan !== undefined &&
    display.scan !== false &&
    !isUnit(display.scan)
  )
    problems.push("display.scan must be false or 0..1");
  if (
    display.glow !== undefined &&
    display.glow !== false &&
    !isUnit(display.glow)
  )
    problems.push("display.glow must be false or 0..1");
  if (display.flicker !== undefined && typeof display.flicker !== "boolean")
    problems.push("display.flicker must be a boolean");
  if (display.bloom !== undefined && typeof display.bloom !== "boolean")
    problems.push("display.bloom must be a boolean");
  if (display.transition !== undefined && !TRANSITIONS.has(display.transition))
    problems.push('display.transition must be "static" or "cut"');
  return problems;
}

function audioProblems(audio: ChannelAudio): string[] {
  const problems: string[] = [];
  const assets = [
    ...Object.entries(audio.sounds ?? {}).map(([id, asset]) => ({ id, asset })),
    ...Object.entries(audio.loops ?? {}).map(([id, asset]) => ({ id, asset })),
  ];
  for (const { id, asset } of assets) {
    if (!asset.src.startsWith("/assets/"))
      problems.push(`audio "${id}" must be a same-origin /assets/ file`);
    if (asset.gain !== undefined && !isUnit(asset.gain))
      problems.push(`audio "${id}" gain must be 0..1`);
  }
  for (const [id, loop] of Object.entries(audio.loops ?? {})) {
    if (!LOOP_KINDS.has(loop.kind))
      problems.push(`loop "${id}" kind must be "music" or "ambient"`);
    if (loop.start !== undefined && !LOOP_STARTS.has(loop.start))
      problems.push(`loop "${id}" start must be "on-active" or "manual"`);
  }
  return problems;
}

/**
 * Lists what is wrong with a channel manifest: its ID, kind, colours, safe flag, display
 * profile and declared audio. The registry rejects a manifest with any problem.
 *
 * @param manifest - The manifest to check.
 * @returns Readable problems; empty when the manifest is valid.
 */
export function manifestProblems(manifest: ChannelManifest): string[] {
  const problems: string[] = [];
  if (!ID.test(manifest.id))
    problems.push(`invalid channel ID "${manifest.id}"`);
  if (!manifest.name.trim()) problems.push("name must not be empty");
  if (!KINDS.has(manifest.kind))
    problems.push(`unknown kind "${manifest.kind}"`);
  if (!manifest.bg.trim()) problems.push("bg must be a colour");
  if (!manifest.glow.trim()) problems.push("glow must be a colour");
  if (typeof manifest.safe !== "boolean")
    problems.push("safe must be a boolean");
  if (typeof manifest.load !== "function")
    problems.push("load must be a function");
  if (manifest.display) problems.push(...profileProblems(manifest.display));
  if (manifest.audio) problems.push(...audioProblems(manifest.audio));
  return problems;
}
