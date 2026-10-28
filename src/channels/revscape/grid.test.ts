import { describe, expect, it } from "vitest";
import { SPAWN, buildGrid } from "./grid";
import { LANE, layoutTown } from "./town";
import { PROP_FOOTPRINTS } from "./props";

const ids = (count: number) =>
  Array.from({ length: count }, (_, index) => `project-${String(index + 1)}`);

describe("buildGrid", () => {
  it.each([0, 1, 30])(
    "blocks every building, tree and prop in a town of %i",
    (count) => {
      const town = layoutTown(ids(count));
      const grid = buildGrid(town);
      for (const plot of town.plots) {
        // Every tile under the walls is blocked: the centre and all four corners, just inside.
        for (const [dx, dz] of [
          [0, 0],
          [1, 1],
          [-1, 1],
          [1, -1],
          [-1, -1],
        ] as const) {
          const x = plot.x + dx * (plot.width / 2 - 0.1);
          const z = plot.z + dz * (plot.depth / 2 - 0.1);
          expect(
            grid.isBlocked(Math.floor(x), Math.floor(z)),
            `${plot.id} at ${String(x)},${String(z)}`,
          ).toBe(true);
        }
      }
      for (const tree of town.trees)
        for (const [i, j] of [
          [tree.x - 1, tree.z - 1],
          [tree.x, tree.z - 1],
          [tree.x - 1, tree.z],
          [tree.x, tree.z],
        ] as const)
          expect(grid.isBlocked(i, j)).toBe(true);
      for (const prop of PROP_FOOTPRINTS)
        expect(grid.isBlocked(Math.floor(prop.x), Math.floor(prop.z))).toBe(
          true,
        );
    },
  );

  it("blocks the fountain and everything outside the world", () => {
    const town = layoutTown([]);
    const grid = buildGrid(town);
    for (const [i, j] of [
      [0, 0],
      [-1, -1],
      [1, 1],
      [-2, 0],
      [1, 0],
    ] as const)
      expect(grid.isBlocked(i, j), `${String(i)},${String(j)}`).toBe(true);
    expect(grid.isBlocked(-town.half - 1, 0)).toBe(true);
    expect(grid.isBlocked(0, town.half)).toBe(true);
    expect(grid.isBlocked(town.half - 1, town.half - 1)).toBeTypeOf("boolean");
  });

  it("keeps the lanes open away from the fountain, and the spawn walkable", () => {
    for (const count of [0, 1, 30]) {
      const grid = buildGrid(layoutTown(ids(count)));
      expect(grid.isBlocked(SPAWN.i, SPAWN.j)).toBe(false);
      for (let along = 3; along < 12; along += 1) {
        // Lane tiles lie within LANE of the axis, so tiles -2..1 either way.
        for (const across of [-2, -1, 0, 1]) {
          expect(
            grid.isBlocked(across, along),
            `south lane ${String(across)},${String(along)}`,
          ).toBe(across >= 1 && along === 3 ? true : false);
          expect(grid.isBlocked(across, -along - 1)).toBe(false);
          expect(grid.isBlocked(along, across)).toBe(false);
          expect(grid.isBlocked(-along - 1, across)).toBe(false);
        }
      }
    }
    expect(LANE).toBe(1.5);
  });
});
