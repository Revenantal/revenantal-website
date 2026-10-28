/** A rectangle on the ground, in tiles. */
export type Footprint = { x: number; z: number; width: number; depth: number };

/**
 * What the small props cover, so people cannot walk through them. Keep in step with
 * `addProps` in `world.ts`.
 */
export const PROP_FOOTPRINTS: readonly Footprint[] = [
  // The market stall.
  { x: 3, z: -3, width: 2.0, depth: 1.2 },
  // Two crates.
  { x: -3, z: -3, width: 0.6, depth: 0.6 },
  { x: -2.5, z: -3.6, width: 0.5, depth: 0.5 },
  // The fence.
  { x: 2.4, z: 3.4, width: 1.8, depth: 0.2 },
];
