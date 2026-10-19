import { describe, expect, it } from "vitest";
import {
  initialChannel,
  initialPower,
  positionFromHash,
  remember,
} from "./persistence";
import type { Storage } from "./persistence";

const store = (values: Record<string, string>): Storage => ({
  getItem: (key) => values[key] ?? null,
  setItem: (key, value) => {
    values[key] = value;
  },
});
const blocked: Storage = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};

describe("persistence", () => {
  it("reads only exact, in-range #chN hashes and never wraps", () => {
    expect(positionFromHash("#ch10", 11)).toBe(10);
    expect(positionFromHash("#ch11", 11)).toBe(11);
    for (const hash of [
      "#ch12",
      "#ch0",
      "#ch01",
      "#ch-1",
      "#ch1.5",
      "#chx",
      "#10",
      "",
      "#ch99999999999999999",
    ])
      expect(positionFromHash(hash, 11)).toBeNull();
  });

  it("starts from the hash, then the saved zero-based position, then channel 1", () => {
    expect(initialChannel("#ch3", store({ "rv-ch": "9" }), 11)).toBe(3);
    expect(initialChannel("", store({ "rv-ch": "9" }), 11)).toBe(10);
    expect(initialChannel("#ch99", store({ "rv-ch": "9" }), 11)).toBe(10);
    expect(initialChannel("", store({ "rv-ch": "11" }), 11)).toBe(1);
    expect(initialChannel("", store({ "rv-ch": "-2" }), 11)).toBe(1);
    expect(initialChannel("", store({}), 11)).toBe(1);
    expect(initialChannel("", blocked, 11)).toBe(1);
    expect(initialChannel("", undefined, 11)).toBe(1);
  });

  it("keeps empty positions as themselves (NO SIGNAL), including after the dial grows", () => {
    expect(initialChannel("#ch2", undefined, 11)).toBe(2);
    expect(initialChannel("#ch14", undefined, 14)).toBe(14);
  });

  it("starts with the TV off after the viewer turned it off, or with reduced motion", () => {
    expect(initialPower(store({}), false)).toBe(true);
    expect(initialPower(store({ "rv-tv": "on" }), false)).toBe(true);
    expect(initialPower(store({ "rv-tv": "off" }), false)).toBe(false);
    expect(initialPower(store({ "rv-tv": "on" }), true)).toBe(false);
    expect(initialPower(blocked, false)).toBe(true);
  });

  it("ignores blocked storage when remembering", () => {
    const values: Record<string, string> = {};
    remember(store(values), "rv-ch", "3");
    expect(values["rv-ch"]).toBe("3");
    expect(() => {
      remember(blocked, "rv-ch", "3");
    }).not.toThrow();
  });
});
