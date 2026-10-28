import { PROP_FOOTPRINTS } from "./props";
import type { Footprint } from "./props";
import type { Town } from "./town";

/** One ground tile: the unit square whose north-west corner is (i, j). */
export type Tile = { i: number; j: number };

/** Which tiles can be walked on. */
export type Grid = {
  /** Tiles run from -half to half - 1 on both axes. */
  half: number;
  /** Whether a tile is outside the world or covered by something. */
  isBlocked: (i: number, j: number) => boolean;
};

/** Where the player starts: the lane just south of the fountain. */
export const SPAWN: Readonly<Tile> = { i: 0, j: 4 };

const EDGE = 1e-6;

function coverRect(blocked: Set<number>, half: number, rect: Footprint) {
  const size = half * 2;
  const i0 = Math.floor(rect.x - rect.width / 2 + EDGE);
  const i1 = Math.ceil(rect.x + rect.width / 2 - EDGE) - 1;
  const j0 = Math.floor(rect.z - rect.depth / 2 + EDGE);
  const j1 = Math.ceil(rect.z + rect.depth / 2 - EDGE) - 1;
  for (let i = i0; i <= i1; i += 1)
    for (let j = j0; j <= j1; j += 1) {
      if (i >= -half && i < half && j >= -half && j < half)
        blocked.add(i + half + (j + half) * size);
    }
}

/**
 * Works out which tiles are blocked: any tile a building, the fountain, a tree or a prop
 * covers any part of, and everything outside the world.
 *
 * @param town - The layout.
 * @returns The grid.
 */
export function buildGrid(town: Town): Grid {
  const { half } = town;
  const size = half * 2;
  const blocked = new Set<number>();
  for (const plot of town.plots) coverRect(blocked, half, plot);
  for (const prop of PROP_FOOTPRINTS) coverRect(blocked, half, prop);
  for (const tree of town.trees) {
    // A tree stands on a corner and fills the four tiles round it.
    coverRect(blocked, half, { x: tree.x, z: tree.z, width: 2, depth: 2 });
  }
  // The fountain: every tile its round rim touches.
  const reach = town.fountain.radius * 0.85;
  for (let i = -half; i < half; i += 1)
    for (let j = -half; j < half; j += 1) {
      const nearX = Math.max(i - town.fountain.x, 0, town.fountain.x - (i + 1));
      const nearZ = Math.max(j - town.fountain.z, 0, town.fountain.z - (j + 1));
      if (Math.hypot(nearX, nearZ) < reach)
        blocked.add(i + half + (j + half) * size);
    }
  return {
    half,
    isBlocked: (i, j) =>
      i < -half ||
      i >= half ||
      j < -half ||
      j >= half ||
      blocked.has(i + half + (j + half) * size),
  };
}
