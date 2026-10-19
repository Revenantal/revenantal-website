import { describe, expect, it } from "vitest";
import {
  nearestDetent,
  pointerAngle,
  shortestDelta,
  stepAngle,
  turnTo,
  unwrapAngle,
  wrapPosition,
} from "./dial-math";

describe("dial maths", () => {
  it("derives the detent angle from the slot count, including more than twelve", () => {
    expect(stepAngle(11)).toBeCloseTo(32.727);
    expect(stepAngle(17)).toBeCloseTo(21.176);
    expect(stepAngle(1)).toBe(360);
  });

  it("wraps at both ends and keeps one-slot dials on that slot", () => {
    expect(wrapPosition(12, 11)).toBe(1);
    expect(wrapPosition(0, 11)).toBe(11);
    expect(wrapPosition(-11, 11)).toBe(11);
    expect(wrapPosition(5, 1)).toBe(1);
  });

  it("turns the short way, with forward half-turn ties", () => {
    expect(shortestDelta(1, 11, 11)).toBe(-1);
    expect(shortestDelta(11, 1, 11)).toBe(1);
    expect(shortestDelta(1, 5, 8)).toBe(4);
    expect(shortestDelta(5, 1, 8)).toBe(4);
    expect(shortestDelta(3, 3, 13)).toBe(0);
  });

  it("accumulates rotation so wraparound never reverses a whole turn", () => {
    const step = stepAngle(11);
    let turn = 11 * step;
    turn = turnTo(turn, 11, 1, 11);
    expect(turn).toBeCloseTo(12 * step);
    turn = turnTo(turn, 1, 11, 11);
    expect(turn).toBeCloseTo(11 * step);
  });

  it("measures pointer angles clockwise from 12 o'clock", () => {
    expect(pointerAngle(0, -10)).toBeCloseTo(0);
    expect(pointerAngle(10, 0)).toBeCloseTo(90);
    expect(pointerAngle(-10, 0)).toBeCloseTo(-90);
  });

  it("continues a drag smoothly across 12 o'clock", () => {
    expect(unwrapAngle(-170, 350)).toBeCloseTo(190);
    expect(unwrapAngle(170, -350)).toBeCloseTo(-190);
    expect(unwrapAngle(20, 30)).toBeCloseTo(20);
  });

  it("snaps drags to the nearest detent and reports the offset", () => {
    const step = stepAngle(10);
    expect(nearestDetent(3 * step + 10, 10)).toEqual({
      position: 3,
      turn: 3 * step,
      offset: expect.closeTo(10 / step, 5) as number,
    });
    expect(nearestDetent(-step, 10).position).toBe(9);
    expect(nearestDetent(12 * step, 10).position).toBe(2);
  });
});
