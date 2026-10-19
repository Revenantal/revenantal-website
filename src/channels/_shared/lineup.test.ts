import { describe, expect, it } from "vitest";
import { createLineup } from "./lineup";
import type { ChannelManifest, ChannelRegistry } from "./types";

const manifest = (id: string): ChannelManifest => ({
  id,
  name: id.toUpperCase(),
  kind: "toy",
  bg: "#000000",
  glow: "rgba(0,0,0,0.5)",
  safe: false,
  load: () => Promise.reject(new Error("not loaded in this test")),
});

describe("channel lineup", () => {
  it("counts slots up to the highest key, with gaps and null slots as NO SIGNAL", () => {
    const lineup = createLineup({
      1: manifest("tv-guide"),
      3: null,
      10: manifest("status"),
      11: manifest("credits"),
    });
    expect(lineup.slots).toBe(11);
    expect(lineup.at(1)?.id).toBe("tv-guide");
    expect(lineup.at(2)).toBeNull();
    expect(lineup.at(3)).toBeNull();
    expect(lineup.positionOf("status")).toBe(10);
  });

  it("grows past twelve without moving earlier positions, and a trailing null keeps the slot", () => {
    const grown = createLineup({ 1: manifest("a"), 14: manifest("b") });
    expect(grown.slots).toBe(14);
    expect(grown.positionOf("a")).toBe(1);
    const removedHighest = createLineup({ 1: manifest("a"), 14: null });
    expect(removedHighest.slots).toBe(14);
    expect(removedHighest.at(14)).toBeNull();
  });

  it.each(["0", "-1", "1.5", "01", "abc", "9007199254740993"])(
    "rejects the position key %s",
    (key) => {
      const registry = { [key]: manifest("a") } as unknown as ChannelRegistry;
      expect(() => createLineup(registry)).toThrow(/Invalid registry position/);
    },
  );

  it("rejects duplicate IDs and invalid manifests", () => {
    expect(() => createLineup({ 1: manifest("a"), 2: manifest("a") })).toThrow(
      /Duplicate/,
    );
    expect(() => createLineup({ 1: manifest("Bad ID") })).toThrow(
      /invalid channel ID/,
    );
    const noLoader = { ...manifest("a"), load: undefined };
    expect(() =>
      createLineup({ 1: noLoader as unknown as ChannelManifest }),
    ).toThrow(/load must be a function/);
    expect(() =>
      createLineup({ 1: { ...manifest("a"), display: { scan: 1.5 } } }),
    ).toThrow(/position 1: display.scan/);
  });

  it("rejects empty and all-null registries", () => {
    expect(() => createLineup({})).toThrow(/no slots/);
    expect(() => createLineup({ 11: null })).toThrow(/no channels/);
  });

  it("resolves reserved IDs until their channel registers, without overriding it", () => {
    const reserved = { status: 10, credits: 11 };
    const early = createLineup(
      { 1: manifest("tv-guide"), 11: null },
      { reserved },
    );
    expect(early.positionOf("status")).toBe(10);
    expect(early.at(10)).toBeNull();

    const built = createLineup(
      { 10: manifest("status"), 11: null },
      { reserved },
    );
    expect(built.positionOf("status")).toBe(10);
    expect(() =>
      createLineup({ 10: manifest("other"), 11: null }, { reserved }),
    ).toThrow(/holds "other"/);
    expect(() =>
      createLineup({ 5: manifest("a") }, { reserved: { status: 9 } }),
    ).toThrow(/outside the dial/);
  });
});
