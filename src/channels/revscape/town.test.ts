import { describe, expect, it } from "vitest";
import { CELL, FOUNTAIN_RADIUS, LANE, hash, layoutTown, random } from "./town";
import type { Plot } from "./town";
import { buildWorld, groundHeight } from "./world";

const ids = (count: number) =>
  Array.from({ length: count }, (_, index) => `project-${String(index + 1)}`);

const overlaps = (a: Plot, b: Plot) =>
  Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
  Math.abs(a.z - b.z) < (a.depth + b.depth) / 2;

describe("hash and random", () => {
  it("are stable", () => {
    expect(hash("revenantal")).toBe(hash("revenantal"));
    expect(hash("a")).not.toBe(hash("b"));
    const first = random(5);
    const second = random(5);
    expect([first(), first()]).toEqual([second(), second()]);
  });
});

describe("layoutTown", () => {
  it.each([0, 1, 8, 30])("lays out %i projects with no overlaps", (count) => {
    const town = layoutTown(ids(count));
    expect(town.plots.filter((p) => p.kind === "project")).toHaveLength(count);
    expect(town.plots.filter((p) => p.kind === "hall")).toHaveLength(1);
    for (const [index, plot] of town.plots.entries())
      for (const other of town.plots.slice(index + 1))
        expect(overlaps(plot, other), `${plot.id} and ${other.id}`).toBe(false);
  });

  it("keeps the lanes and the fountain clear, and every plot inside the world", () => {
    for (const count of [0, 1, 30]) {
      const town = layoutTown(ids(count));
      for (const plot of town.plots) {
        expect(Math.abs(plot.x) - plot.width / 2).toBeGreaterThan(LANE);
        expect(Math.abs(plot.z) - plot.depth / 2).toBeGreaterThan(LANE);
        expect(Math.hypot(plot.x, plot.z)).toBeGreaterThan(FOUNTAIN_RADIUS + 2);
        expect(Math.abs(plot.x) + plot.width / 2).toBeLessThan(town.half);
        expect(Math.abs(plot.z) + plot.depth / 2).toBeLessThan(town.half);
      }
    }
  });

  it("puts the Server Hall nearest the fountain and projects in order after it", () => {
    const town = layoutTown(ids(5));
    expect(town.plots[0]?.id).toBe("server-hall");
    expect(town.plots.slice(1).map((p) => p.id)).toEqual(ids(5));
    const distance = (p: Plot) => Math.hypot(p.x, p.z);
    const distances = town.plots.map(distance);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  it("is the same every time, and a project looks the same wherever it is listed", () => {
    expect(layoutTown(ids(10))).toEqual(layoutTown(ids(10)));
    const a = layoutTown(["x", "alpha"]).plots.find((p) => p.id === "alpha");
    const b = layoutTown(["alpha"]).plots.find((p) => p.id === "alpha");
    expect(a?.wallColor).toBe(b?.wallColor);
    expect(a?.roofColor).toBe(b?.roofColor);
  });

  it("turns every door towards the square", () => {
    for (const plot of layoutTown(ids(30)).plots) {
      const front = [Math.sin(plot.ry), Math.cos(plot.ry)] as const;
      // The door points from the building towards the centre along its dominant axis.
      expect(front[0] * -plot.x + front[1] * -plot.z).toBeGreaterThan(0);
    }
  });

  it("grows the world only when the plots need it, and keeps trees off buildings and lanes", () => {
    expect(layoutTown([]).half).toBe(20);
    expect(layoutTown(ids(30)).half).toBeGreaterThan(20);
    const town = layoutTown(ids(30));
    expect(town.trees.length).toBeGreaterThan(10);
    for (const tree of town.trees) {
      expect(Math.abs(tree.x)).toBeGreaterThan(LANE);
      expect(Math.abs(tree.z)).toBeGreaterThan(LANE);
      for (const plot of town.plots)
        expect(
          Math.abs(tree.x - plot.x) < plot.width / 2 &&
            Math.abs(tree.z - plot.z) < plot.depth / 2,
        ).toBe(false);
    }
    expect(CELL).toBeGreaterThan(6);
  });
});

describe("buildWorld", () => {
  it("draws every tile and splits the world into chunks that can be culled", () => {
    const town = layoutTown(ids(3));
    const chunks = buildWorld(town);
    expect(chunks.length).toBeGreaterThan(4);
    for (const chunk of chunks) {
      expect(chunk.positions.length).toBe(chunk.triangles * 9);
      expect(chunk.colors.length).toBe(chunk.positions.length);
      expect(chunk.radius).toBeGreaterThan(0);
      expect(Number.isFinite(chunk.centre[0])).toBe(true);
    }
  });

  it("keeps each chunk small enough that only the visible ones are drawn", () => {
    const chunks = buildWorld(layoutTown(ids(30)));
    expect(Math.max(...chunks.map((c) => c.triangles))).toBeLessThan(1000);
    expect(Math.max(...chunks.map((c) => c.radius))).toBeLessThan(12);
  });

  it("is deterministic", () => {
    const one = buildWorld(layoutTown(ids(4)));
    const two = buildWorld(layoutTown(ids(4)));
    expect(one.map((c) => c.triangles)).toEqual(two.map((c) => c.triangles));
    expect(Array.from(one[0]?.positions ?? [])).toEqual(
      Array.from(two[0]?.positions ?? []),
    );
  });

  it("keeps the ground flat where buildings stand", () => {
    expect(groundHeight(3, 5, 10)).toBe(0);
    expect(groundHeight(30, 30, 10)).toBeGreaterThan(0);
  });
});
