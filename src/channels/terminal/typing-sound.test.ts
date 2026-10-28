import { describe, expect, it } from "vitest";
import { KEY_SOUND_IDS, keySoundFor, type KeyLike } from "./typing-sound";

const press = (key: string, mods: Partial<KeyLike> = {}): KeyLike => ({
  key,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  ...mods,
});

/**
 * A repeatable stand-in for Math.random that cycles through the given values.
 *
 * @param values - The numbers to return, in order.
 * @returns A function returning the next number each call.
 */
function sequence(...values: number[]) {
  let index = 0;
  return () => values[index++ % values.length] ?? 0;
}

describe("keySoundFor", () => {
  it("clicks for letters, digits and punctuation", () => {
    for (const key of ["a", "Z", "7", "-", "/", "."]) {
      const sound = keySoundFor(press(key), () => 0.5, null);
      expect(KEY_SOUND_IDS).toContain(sound?.id);
    }
  });

  it("uses a heavier sound for Enter and Space, and its own for Backspace", () => {
    expect(keySoundFor(press("Enter"), () => 0.5, null)?.id).toBe("enter");
    expect(keySoundFor(press(" "), () => 0.5, null)?.id).toBe("enter");
    expect(keySoundFor(press("Backspace"), () => 0.5, null)?.id).toBe("back");
    expect(keySoundFor(press("Delete"), () => 0.5, null)?.id).toBe("back");
  });

  it("makes Space softer and higher than Enter", () => {
    const enter = keySoundFor(press("Enter"), () => 0.5, null);
    const space = keySoundFor(press(" "), () => 0.5, null);
    expect(space?.options.gain).toBeLessThan(enter?.options.gain ?? 0);
    expect(space?.options.rate).toBeGreaterThan(enter?.options.rate ?? 0);
  });

  it("is silent for shortcuts, modifiers, arrows and Escape", () => {
    expect(
      keySoundFor(press("c", { ctrlKey: true }), () => 0.5, null),
    ).toBeNull();
    expect(
      keySoundFor(press("v", { metaKey: true }), () => 0.5, null),
    ).toBeNull();
    expect(
      keySoundFor(press("x", { altKey: true }), () => 0.5, null),
    ).toBeNull();
    for (const key of [
      "Shift",
      "Control",
      "ArrowUp",
      "ArrowDown",
      "Escape",
      "F5",
    ])
      expect(keySoundFor(press(key), () => 0.5, null)).toBeNull();
  });

  it("never repeats the same click twice in a row", () => {
    for (const last of KEY_SOUND_IDS)
      for (const roll of [0, 0.2, 0.5, 0.99])
        expect(keySoundFor(press("a"), () => roll, last)?.id).not.toBe(last);
  });

  it("keeps variation within bounds", () => {
    for (const roll of [0, 0.5, 0.999]) {
      const sound = keySoundFor(press("a"), sequence(roll), null);
      expect(sound?.options.rate).toBeGreaterThanOrEqual(0.95);
      expect(sound?.options.rate).toBeLessThanOrEqual(1.05);
      expect(sound?.options.gain).toBeGreaterThanOrEqual(0.8);
      expect(sound?.options.gain).toBeLessThanOrEqual(1);
    }
  });

  it("reaches every click sound", () => {
    const seen = new Set<string>();
    for (let roll = 0; roll < 1; roll += 0.05) {
      const sound = keySoundFor(press("a"), () => roll, null);
      if (sound) seen.add(sound.id);
    }
    expect([...seen].sort()).toEqual([...KEY_SOUND_IDS].sort());
  });
});
