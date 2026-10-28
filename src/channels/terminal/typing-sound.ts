/** The shortest gap in ms between two key sounds, so a held key stays a patter, not a buzz. */
export const MIN_GAP_MS = 35;

/** The sound ids declared in the manifest for ordinary keys. */
export const KEY_SOUND_IDS = [
  "key-1",
  "key-2",
  "key-3",
  "key-4",
  "key-5",
  "key-6",
] as const;

/** The part of a keyboard event that decides the sound. */
export type KeyLike = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
};

/** The sound to play for one key. */
export type KeySound = {
  id: string;
  options: { gain: number; rate: number };
};

/**
 * Picks the sound for a keypress: a random click for letters and digits that is never the
 * same twice in a row, a heavier thunk for Enter and Space, and a softer one for Backspace.
 * Shortcuts, arrows and modifier keys are silent.
 *
 * @param event - The key that was pressed.
 * @param random - A source of numbers from 0 up to 1.
 * @param last - The id of the ordinary key sound played last, if any.
 * @returns The sound to play, or null for a silent key.
 */
export function keySoundFor(
  event: KeyLike,
  random: () => number,
  last: string | null,
): KeySound | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  // Slight random variation in level and pitch, so repeats do not sound identical.
  const rate = 0.95 + random() * 0.1;
  const gain = 0.8 + random() * 0.2;
  if (event.key === "Enter") return { id: "enter", options: { gain, rate } };
  if (event.key === " ")
    return { id: "enter", options: { gain: gain * 0.75, rate: rate * 1.12 } };
  if (event.key === "Backspace" || event.key === "Delete")
    return { id: "back", options: { gain, rate } };
  if (event.key !== "Tab" && event.key.length !== 1) return null;
  const pool = KEY_SOUND_IDS.filter((id) => id !== last);
  const id =
    pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
  return id === undefined ? null : { id, options: { gain, rate } };
}
