import { manifestProblems } from "./manifest-check";
import type { ChannelManifest, ChannelRegistry } from "./types";

/** A validated registry: the dial's slot count plus sparse lookups. */
export type Lineup = {
  /** Slot count: the highest configured position. */
  slots: number;
  /** The manifest at a position, or null for NO SIGNAL. */
  at: (position: number) => ChannelManifest | null;
  /** The position assigned to a stable channel ID. */
  positionOf: (id: string) => number | undefined;
};

/** Registry validation options. */
export type LineupOptions = {
  /**
   * Approved positions for channel IDs not yet registered, so internal buttons can tune to
   * them before the channel exists. A registered manifest always wins.
   */
  reserved?: Readonly<Record<string, number>>;
};

/**
 * Validates the position-keyed registry and builds sparse lookups. Keys must be canonical
 * positive safe integers, channel IDs unique and every manifest valid (kind, colours, display
 * profile and audio); gaps and null slots are NO SIGNAL.
 *
 * @param registry - Positions mapped to manifests or null.
 * @param options - Validation options.
 * @returns The lineup for the dial and screen.
 * @throws When a key, ID or manifest is invalid, or no channel is registered.
 */
export function createLineup(
  registry: ChannelRegistry,
  options: LineupOptions = {},
): Lineup {
  const byPosition = new Map<number, ChannelManifest>();
  const byId = new Map<string, number>();
  let slots = 0;
  for (const [key, manifest] of Object.entries(registry)) {
    const position = Number(key);
    if (
      !Number.isSafeInteger(position) ||
      position < 1 ||
      String(position) !== key
    )
      throw new Error(`Invalid registry position "${key}".`);
    slots = Math.max(slots, position);
    if (!manifest) continue;
    const problems = manifestProblems(manifest);
    if (problems.length > 0)
      throw new Error(
        `Invalid channel manifest at position ${key}: ${problems.join("; ")}.`,
      );
    if (byId.has(manifest.id))
      throw new Error(`Duplicate channel ID "${manifest.id}".`);
    byPosition.set(position, manifest);
    byId.set(manifest.id, position);
  }
  for (const [id, position] of Object.entries(options.reserved ?? {})) {
    if (!Number.isSafeInteger(position) || position < 1 || position > slots)
      throw new Error(`Reserved position for "${id}" is outside the dial.`);
    const occupant = byPosition.get(position);
    if (occupant && occupant.id !== id)
      throw new Error(
        `Reserved position ${String(position)} holds "${occupant.id}".`,
      );
    if (!byId.has(id)) byId.set(id, position);
  }
  if (slots === 0) throw new Error("The registry has no slots.");
  if (byPosition.size === 0) throw new Error("The registry has no channels.");
  return {
    slots,
    at: (position) => byPosition.get(position) ?? null,
    positionOf: (id) => byId.get(id),
  };
}
