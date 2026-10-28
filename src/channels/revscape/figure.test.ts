import { describe, expect, it } from "vitest";
import { buildFigure, buildMarker } from "./figure";

describe("the figure", () => {
  it("is a few dozen triangles with a colour for every vertex", () => {
    const figure = buildFigure();
    let triangles = 0;
    for (const part of [
      figure.body,
      figure.leg,
      figure.leg,
      figure.arm,
      figure.arm,
    ]) {
      expect(part.colors.length).toBe(part.positions.length);
      triangles += part.positions.length / 9;
    }
    expect(triangles).toBeLessThan(80);
    expect(triangles).toBeGreaterThan(40);
  });

  it("hangs its limbs below their joints", () => {
    const figure = buildFigure();
    for (const limb of [figure.leg, figure.arm])
      for (let i = 1; i < limb.positions.length; i += 3)
        expect(limb.positions[i]).toBeLessThanOrEqual(0);
  });

  it("marks the destination with four flat triangles just above the ground", () => {
    const marker = buildMarker();
    expect(marker.positions.length / 9).toBe(4);
    for (let i = 1; i < marker.positions.length; i += 3)
      expect(marker.positions[i]).toBeCloseTo(0.03);
  });
});
