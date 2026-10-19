/** The storage surface persistence uses; any call may throw when storage is blocked. */
export type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

/** Last tuned position, stored zero-based. */
export const CHANNEL_KEY = "rv-ch";
/** Whether the viewer left the TV on or off. */
export const POWER_KEY = "rv-tv";

/**
 * Reads a `#chN` hash as a dial position.
 *
 * @param hash - `location.hash`, for example "#ch10".
 * @param slots - The dial's slot count.
 * @returns The position if the hash is exactly `#ch` plus a valid in-range position.
 */
export function positionFromHash(hash: string, slots: number): number | null {
  const match = /^#ch([1-9]\d*)$/.exec(hash);
  if (!match?.[1]) return null;
  const position = Number(match[1]);
  return Number.isSafeInteger(position) && position <= slots ? position : null;
}

/**
 * The channel to start on: a valid hash, else the last saved position, else channel 1.
 * Never wraps external input; out-of-range or malformed values fall through.
 *
 * @param hash - `location.hash`.
 * @param storage - Browser storage, if available.
 * @param slots - The dial's slot count.
 * @returns The starting position.
 */
export function initialChannel(
  hash: string,
  storage: Storage | undefined,
  slots: number,
): number {
  const fromHash = positionFromHash(hash, slots);
  if (fromHash !== null) return fromHash;
  try {
    const saved = storage?.getItem(CHANNEL_KEY);
    if (saved !== null && saved !== undefined && /^\d+$/.test(saved)) {
      const position = Number(saved) + 1;
      if (Number.isSafeInteger(position) && position <= slots) return position;
    }
  } catch {
    /* Blocked storage starts on channel 1. */
  }
  return 1;
}

/**
 * Whether the TV starts on: off if the viewer turned it off last visit or prefers reduced
 * motion; both start in List mode with a way to turn the TV on.
 *
 * @param storage - Browser storage, if available.
 * @param reducedMotion - Whether the viewer prefers reduced motion.
 * @returns True to start with the TV on.
 */
export function initialPower(
  storage: Storage | undefined,
  reducedMotion: boolean,
): boolean {
  if (reducedMotion) return false;
  try {
    return storage?.getItem(POWER_KEY) !== "off";
  } catch {
    return true;
  }
}

/**
 * Writes one value, ignoring blocked or full storage.
 *
 * @param storage - Browser storage, if available.
 * @param key - Storage key.
 * @param value - Value to store.
 */
export function remember(
  storage: Storage | undefined,
  key: string,
  value: string,
) {
  try {
    storage?.setItem(key, value);
  } catch {
    /* The site keeps working in memory. */
  }
}
