import { describe, expect, it } from "vitest";
import { fixtureProjects } from "../_shared/testing/fixtures";
import type { LiveServer } from "../../data/types";
import { CABINET, UNIT_GAP, UNIT_HEIGHT } from "./hardware";
import {
  VIEW_HEIGHT,
  buildRack,
  cameraFor,
  clampCamera,
  initialCamera,
} from "./rack";

const server = (id: string): LiveServer => ({
  id,
  name: id,
  game: "minecraft",
  state: "running",
});

describe("rack layout", () => {
  it("stacks network gear, then projects, game servers and power, each opened by a blank and a sign", () => {
    const rack = buildRack(fixtureProjects(2), [server("a")]);
    expect(rack.units.map((unit) => unit.kind)).toEqual([
      "patch",
      "switch",
      "blank",
      "display",
      "server1u",
      "server1u",
      "blank",
      "display",
      "server2u",
      "blank",
      "display",
      "ups",
    ]);
    for (const [index, unit] of rack.units.entries()) {
      const previous = rack.units[index - 1];
      expect(unit.height).toBe(UNIT_HEIGHT[unit.kind]);
      expect(unit.top).toBe(
        previous ? previous.top + previous.height + UNIT_GAP : 0,
      );
    }
  });

  it("grows with 30 projects and still lays out with none", () => {
    const empty = buildRack([], []);
    const full = buildRack(fixtureProjects(30), []);
    expect(full.height - empty.height).toBe(
      30 * (UNIT_HEIGHT.server1u + UNIT_GAP),
    );
    expect(empty.units.filter((unit) => unit.kind === "display")).toHaveLength(
      3,
    );
  });

  it("centres a unit in view without leaving the rack", () => {
    const rack = buildRack(fixtureProjects(30), [server("a")]);
    const last = rack.units.at(-1);
    const first = rack.units[0];
    if (!last || !first) throw new Error("empty rack");
    expect(cameraFor(first, rack.height)).toBe(
      Math.max(0, CABINET.top + first.height / 2 - VIEW_HEIGHT / 2),
    );
    expect(cameraFor(last, rack.height)).toBe(rack.height - VIEW_HEIGHT);
    const middle = rack.units[15];
    if (!middle) throw new Error("short rack");
    expect(
      CABINET.top +
        middle.top +
        middle.height / 2 -
        cameraFor(middle, rack.height),
    ).toBeCloseTo(VIEW_HEIGHT / 2);
    expect(clampCamera(-50, rack.height)).toBe(0);
    expect(initialCamera(rack)).toBeGreaterThan(0);
  });
});
