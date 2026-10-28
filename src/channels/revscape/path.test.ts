import { describe, expect, it } from "vitest";
import type { Grid, Tile } from "./grid";
import { canStep, findPath } from "./path";

// A grid from rows of text: `#` blocked, `.` open. Row 0 is the top.
function gridOf(rows: string[]): Grid {
  const half = Math.max(rows.length, rows[0]?.length ?? 0);
  return {
    half,
    isBlocked: (i, j) => {
      const row = rows[j];
      if (row === undefined || i < 0 || i >= row.length) return true;
      return row[i] === "#";
    },
  };
}

const at = (i: number, j: number): Tile => ({ i, j });
const key = (tile: Tile) => `${String(tile.i)},${String(tile.j)}`;

// Checks a route: every step is one tile and allowed, and it ends on the goal.
function valid(grid: Grid, from: Tile, path: Tile[], to: Tile) {
  let here = from;
  for (const step of path) {
    const di = step.i - here.i;
    const dj = step.j - here.j;
    expect(Math.max(Math.abs(di), Math.abs(dj))).toBe(1);
    expect(canStep(grid, here.i, here.j, di, dj)).toBe(true);
    here = step;
  }
  expect(here).toEqual(to);
}

describe("findPath", () => {
  it("is empty when already there", () => {
    expect(findPath(gridOf(["..."]), at(1, 0), at(1, 0))).toEqual([]);
  });

  it("takes a diagonal first, then straight", () => {
    const grid = gridOf(["......", "......", "......"]);
    const path = findPath(grid, at(0, 0), at(5, 2));
    expect(path?.map(key)).toEqual(["1,1", "2,2", "3,2", "4,2", "5,2"]);
  });

  it("counts a diagonal as one step", () => {
    const grid = gridOf(["....", "....", "....", "...."]);
    expect(findPath(grid, at(0, 0), at(3, 3))).toHaveLength(3);
  });

  it("walks round a wall by the shortest way", () => {
    const grid = gridOf([".....", ".###.", ".###.", "....."]);
    const path = findPath(grid, at(0, 1), at(4, 1));
    expect(path).not.toBeNull();
    valid(grid, at(0, 1), path ?? [], at(4, 1));
    // The corner rule forbids cutting past the wall's end, so it goes right round: six steps.
    expect(path).toHaveLength(6);
  });

  it("does not cut a corner between two blocked tiles", () => {
    const grid = gridOf(["#.", ".#"]);
    // Both tiles beside the diagonal are blocked, so the diagonal is not allowed.
    expect(canStep(gridOf([".#", "#."]), 0, 0, 1, 1)).toBe(false);
    expect(findPath(grid, at(1, 0), at(0, 1))).toBeNull();
  });

  it("does not cut a corner past a single blocked tile either", () => {
    const grid = gridOf(["..", "#."]);
    expect(canStep(grid, 0, 0, 1, 1)).toBe(false);
    const wall = gridOf([".#", ".."]);
    expect(canStep(wall, 0, 0, 1, 1)).toBe(false);
    const path = findPath(wall, at(0, 0), at(1, 1));
    expect(path?.map(key)).toEqual(["0,1", "1,1"]);
  });

  it("returns null for blocked or unreachable goals", () => {
    const grid = gridOf(["..#..", "..#..", "..#.."]);
    expect(findPath(grid, at(0, 0), at(2, 1))).toBeNull();
    expect(findPath(grid, at(0, 0), at(4, 0))).toBeNull();
    expect(findPath(grid, at(0, 0), at(9, 9))).toBeNull();
  });

  it("is the same every time and as short as any route", () => {
    const grid = gridOf([
      "..........",
      ".####.###.",
      ".#..#.#...",
      ".#.##.#.#.",
      ".#....#.#.",
      ".######.#.",
      "..........",
    ]);
    const one = findPath(grid, at(0, 0), at(9, 4));
    const two = findPath(grid, at(0, 0), at(9, 4));
    expect(one).toEqual(two);
    valid(grid, at(0, 0), one ?? [], at(9, 4));
    // Compare with a plain breadth-first search over the same steps.
    const seen = new Map<string, number>([[key(at(0, 0)), 0]]);
    let frontier = [at(0, 0)];
    while (frontier.length > 0 && !seen.has(key(at(9, 4)))) {
      const next: Tile[] = [];
      for (const tile of frontier)
        for (const di of [-1, 0, 1])
          for (const dj of [-1, 0, 1]) {
            if (!di && !dj) continue;
            const to = at(tile.i + di, tile.j + dj);
            if (canStep(grid, tile.i, tile.j, di, dj) && !seen.has(key(to))) {
              seen.set(key(to), (seen.get(key(tile)) ?? 0) + 1);
              next.push(to);
            }
          }
      frontier = next;
    }
    expect(one).toHaveLength(seen.get(key(at(9, 4))) ?? -1);
  });
});
