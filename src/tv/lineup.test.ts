import { describe, expect, it } from "vitest";
import { LAUNCH_POSITIONS, lineup, registry } from "@channels/index";
import { manifestProblems } from "@channels/_shared/manifest-check";
import { positionFromHash } from "@data/persistence";
import { SLOT_COUNT, channelLabel, channelName, positionOf } from "./lineup";

describe("the real channel registry", () => {
  it("keeps the launch channels at 1, 10 and 11, registered or not", () => {
    for (const [id, position] of Object.entries(LAUNCH_POSITIONS)) {
      expect(positionOf(id)).toBe(position);
      const manifest = lineup.at(position);
      if (manifest) expect(manifest.id).toBe(id);
    }
  });

  it("gives SERVERS and the settings-door Credits button their targets", () => {
    expect(positionOf("status")).toBe(10);
    expect(positionOf("credits")).toBe(11);
  });

  it("registers only valid manifests, each at one position", () => {
    const ids = new Set<string>();
    for (const manifest of Object.values(registry)) {
      if (!manifest) continue;
      expect(manifestProblems(manifest), manifest.id).toEqual([]);
      expect(ids.has(manifest.id), `${manifest.id} registered twice`).toBe(
        false,
      );
      ids.add(manifest.id);
    }
  });

  it("shows NO SIGNAL in every gap and keeps every slot's hash stable", () => {
    expect(SLOT_COUNT).toBe(lineup.slots);
    for (let position = 1; position <= SLOT_COUNT; position += 1) {
      if (!lineup.at(position)) expect(channelName(position)).toBe("NO SIGNAL");
      expect(channelLabel(position)).toMatch(/^CH \d{2,}$/);
      expect(positionFromHash(`#ch${String(position)}`, SLOT_COUNT)).toBe(
        position,
      );
    }
  });
});
