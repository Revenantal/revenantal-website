import { describe, expect, it } from "vitest";
import type { Credit } from "../../data/types";
import {
  MAX_STEP_MS,
  SPEED,
  START,
  advance,
  groupCredits,
  revealOffset,
  rewind,
  rewindSpeed,
  rolledOff,
} from "./roll";

const credit = (title: string, department: string): Credit => ({
  title,
  department,
  author: "Author",
  url: `https://example.invalid/${title}`,
  license: "CC0 1.0",
  usedFor: "testing",
});

describe("groupCredits", () => {
  it("groups by department in first-seen order and keeps entry order", () => {
    const groups = groupCredits([
      credit("a", "Sound"),
      credit("b", "Art"),
      credit("c", "Sound"),
    ]);
    expect(groups.map((group) => group.department)).toEqual(["Sound", "Art"]);
    expect(groups[0]?.credits.map((entry) => entry.title)).toEqual(["a", "c"]);
  });
});

describe("advance", () => {
  it("moves at the roll speed", () => {
    expect(advance(10, 50)).toBeCloseTo(10 + (SPEED * 50) / 1000);
  });

  it("never catches up a long gap or goes backwards", () => {
    expect(advance(0, 60_000)).toBe((SPEED * MAX_STEP_MS) / 1000);
    expect(advance(5, -20)).toBe(5);
  });
});

describe("rolledOff", () => {
  it("ends once the whole roll has passed the top", () => {
    expect(rolledOff(START + 999, 1000)).toBe(false);
    expect(rolledOff(START + 1000, 1000)).toBe(true);
  });

  it("never ends before layout", () => {
    expect(rolledOff(1e9, 0)).toBe(false);
  });
});

describe("revealOffset", () => {
  it("leaves a visible element where it is", () => {
    // Shown at START - 400 + 200 = 370, inside 60..510 with height 20.
    expect(revealOffset(400, 200, 20, 570)).toBe(400);
  });

  it("brings an off-screen element to the middle", () => {
    const offset = revealOffset(0, 2000, 20, 570);
    expect(START - offset + 2000 + 10).toBe(285);
  });

  it("never moves before the start", () => {
    expect(revealOffset(500, -400, 20, 570)).toBe(0);
  });
});

describe("rewind", () => {
  it("winds back fast and stops at the start", () => {
    const speed = rewindSpeed(3000);
    expect(speed).toBe(3000);
    expect(rewind(3000, 50, speed)).toBe(2850);
    expect(rewind(100, 100, speed)).toBe(0);
  });

  it("keeps a short rewind brisk", () => {
    expect(rewindSpeed(50)).toBeGreaterThan(50);
  });
});
