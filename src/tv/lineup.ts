import { lineup } from "@channels/index";
import type { ChannelManifest } from "@channels/_shared/types";

/** The dial's slot count, from the highest registered position. */
export const SLOT_COUNT = lineup.slots;

/**
 * The manifest tuned at a dial position.
 *
 * @param position - Dial position 1..SLOT_COUNT.
 * @returns The manifest, or null for NO SIGNAL.
 */
export function manifestAt(position: number): ChannelManifest | null {
  return lineup.at(position);
}

/**
 * Display name for a dial position.
 *
 * @param position - Dial position 1..SLOT_COUNT.
 * @returns The channel name, or NO SIGNAL for an empty slot.
 */
export function channelName(position: number): string {
  return lineup.at(position)?.name ?? "NO SIGNAL";
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

/**
 * Resolves a stable channel ID to its dial position.
 *
 * @param id - Channel ID such as "status".
 * @returns The assigned position, or undefined if the ID has none.
 */
export function positionOf(id: string): number | undefined {
  return lineup.positionOf(id);
}
