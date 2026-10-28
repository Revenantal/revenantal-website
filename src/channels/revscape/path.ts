import type { Grid, Tile } from "./grid";

// Diagonals come first, so routes take the original game's familiar diagonal-then-straight shape.
const STEPS: readonly (readonly [number, number])[] = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * Whether one step from (i, j) is allowed. A diagonal step needs both tiles beside it free,
 * so nobody cuts a corner.
 *
 * @param grid - The walkable tiles.
 * @param i - Column stepped from.
 * @param j - Row stepped from.
 * @param di - Column change, -1, 0 or 1.
 * @param dj - Row change, -1, 0 or 1.
 * @returns True if the step is open.
 */
export function canStep(
  grid: Grid,
  i: number,
  j: number,
  di: number,
  dj: number,
): boolean {
  if (grid.isBlocked(i + di, j + dj)) return false;
  if (di !== 0 && dj !== 0)
    return !grid.isBlocked(i + di, j) && !grid.isBlocked(i, j + dj);
  return true;
}

/**
 * The shortest route between two tiles, in steps (a diagonal is one step). Found by
 * flooding outward from the goal, then walking back from the start preferring diagonals, so
 * the same click always gives the same route and it is as short as any route can be.
 *
 * @param grid - The walkable tiles.
 * @param from - Where the walker stands.
 * @param to - Where they want to be.
 * @returns The tiles to walk through, ending on `to` (empty if already there), or null if
 *   `to` cannot be reached.
 */
export function findPath(grid: Grid, from: Tile, to: Tile): Tile[] | null {
  if (grid.isBlocked(to.i, to.j) || grid.isBlocked(from.i, from.j)) return null;
  if (from.i === to.i && from.j === to.j) return [];
  const size = grid.half * 2;
  const key = (i: number, j: number) => i + grid.half + (j + grid.half) * size;
  const distance = new Map<number, number>([[key(to.i, to.j), 0]]);
  let frontier: Tile[] = [to];
  const start = key(from.i, from.j);
  while (frontier.length > 0 && !distance.has(start)) {
    const next: Tile[] = [];
    for (const tile of frontier) {
      const here = distance.get(key(tile.i, tile.j)) ?? 0;
      for (const [di, dj] of STEPS) {
        const i = tile.i + di;
        const j = tile.j + dj;
        // A step is allowed in both directions or neither, so the flood can run backwards.
        if (!canStep(grid, tile.i, tile.j, di, dj) || distance.has(key(i, j)))
          continue;
        distance.set(key(i, j), here + 1);
        next.push({ i, j });
      }
    }
    frontier = next;
  }
  if (!distance.has(start)) return null;
  const path: Tile[] = [];
  let at = from;
  while (at.i !== to.i || at.j !== to.j) {
    const left = distance.get(key(at.i, at.j)) ?? 0;
    // Prefer a diagonal that closes the gap on both axes, then any shortest step; so a walker
    // goes diagonal until level with the goal and then straight, never zigzagging.
    const wantI = Math.sign(to.i - at.i);
    const wantJ = Math.sign(to.j - at.j);
    const shortest = STEPS.filter(([di, dj]) => {
      const nextDistance = distance.get(key(at.i + di, at.j + dj));
      return nextDistance === left - 1 && canStep(grid, at.i, at.j, di, dj);
    });
    const step =
      shortest.find(
        ([di, dj]) => (di === 0 || di === wantI) && (dj === 0 || dj === wantJ),
      ) ?? shortest[0];
    if (!step) return null;
    at = { i: at.i + step[0], j: at.j + step[1] };
    path.push(at);
  }
  return path;
}
