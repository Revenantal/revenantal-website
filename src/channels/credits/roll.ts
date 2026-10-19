import type { Credit } from "../../data/types";

/** Roll speed in channel pixels per second. */
export const SPEED = 36;
/** The picture's height: the credits start just below it and roll up into view. */
export const START = 570;
/** How long the static between loops lasts. */
export const STATIC_MS = 1000;
/** The longest frame step counted, so a stalled or hidden tab never jumps ahead. */
export const MAX_STEP_MS = 100;

/** Credits sharing one department, in content order. */
export type CreditGroup = { department: string; credits: Credit[] };

/**
 * Groups credits by department, in the order departments first appear. Entries keep their
 * content order. (List mode and CREDITS.md use the same rule from `src/data/credits.ts`;
 * channels may only import data types.)
 *
 * @param credits - The shared credit entries.
 * @returns One group per department.
 */
export function groupCredits(credits: readonly Credit[]): CreditGroup[] {
  const groups = new Map<string, Credit[]>();
  for (const credit of credits) {
    const group = groups.get(credit.department);
    if (group) group.push(credit);
    else groups.set(credit.department, [credit]);
  }
  return [...groups].map(([department, entries]) => ({
    department,
    credits: entries,
  }));
}

/**
 * Moves the roll on by one frame.
 *
 * @param offset - Distance rolled so far, in pixels.
 * @param elapsedMs - Time since the last frame.
 * @returns The new distance.
 */
export function advance(offset: number, elapsedMs: number): number {
  return (
    offset + (SPEED * Math.max(0, Math.min(elapsedMs, MAX_STEP_MS))) / 1000
  );
}

/**
 * Whether the last line has rolled off the top of the picture.
 *
 * @param offset - Distance rolled so far.
 * @param height - Height of the credits; zero (not laid out yet) never ends.
 * @returns True once everything has passed.
 */
export function rolledOff(offset: number, height: number): boolean {
  return height > 0 && offset >= START + height;
}

/** Space kept clear at the top and bottom when revealing a focused link. */
const MARGIN = 60;

/**
 * The offset that keeps a focused element visible: unchanged when it is already well inside
 * the picture, otherwise moved to bring it to the middle.
 *
 * @param offset - Distance rolled so far.
 * @param top - The element's top within the credits.
 * @param height - The element's height.
 * @param viewHeight - The picture's height.
 * @returns The offset, never before the start.
 */
export function revealOffset(
  offset: number,
  top: number,
  height: number,
  viewHeight: number,
): number {
  const shownAt = START - offset + top;
  if (shownAt >= MARGIN && shownAt + height <= viewHeight - MARGIN)
    return offset;
  return Math.max(0, top + height / 2 + START - viewHeight / 2);
}

/** A rewind takes about this long, however far the roll has gone. */
export const REWIND_MS = 1000;
/** The slowest rewind, so a short one still looks like a fast wind. */
const REWIND_MIN_SPEED = 1200;

/**
 * The rewind speed for a roll that has gone a given distance.
 *
 * @param offset - Distance rolled so far.
 * @returns Pixels per second.
 */
export function rewindSpeed(offset: number): number {
  return Math.max(REWIND_MIN_SPEED, offset / (REWIND_MS / 1000));
}

/**
 * Winds the roll back by one frame, stopping at the start.
 *
 * @param offset - Distance rolled so far.
 * @param elapsedMs - Time since the last frame.
 * @param speed - Pixels per second, from `rewindSpeed`.
 * @returns The new distance.
 */
export function rewind(offset: number, elapsedMs: number, speed: number) {
  return Math.max(
    0,
    offset - (speed * Math.max(0, Math.min(elapsedMs, MAX_STEP_MS))) / 1000,
  );
}
