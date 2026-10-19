/**
 * Temporary phase 2 lineup: eleven slots (the highest launch position, Credits at 11),
 * all NO SIGNAL. Task 2.4 replaces this with the channel registry in src/channels/index.ts.
 */
export const SLOT_COUNT = 11;

// No channel is built yet, so every slot is empty.
const NAMES = new Map<number, string>();

/**
 * Display name for a dial position.
 *
 * @param position - Dial position 1..SLOT_COUNT.
 * @returns The channel name, or NO SIGNAL for an empty slot.
 */
export function channelName(position: number): string {
  return NAMES.get(position) ?? "NO SIGNAL";
}

/**
 * OSD label for a dial position.
 *
 * @param position - Dial position.
 * @returns For example "CH 03".
 */
export function channelLabel(position: number): string {
  return `CH ${String(position).padStart(2, "0")}`;
}
