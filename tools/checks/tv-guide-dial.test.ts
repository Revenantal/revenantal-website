import { describe, expect, it } from "vitest";
import { registry } from "../../src/channels/index.ts";
import dial from "../../src/channels/tv-guide/dial.json";

describe("the TV Guide's channel list", () => {
  it("lists every other built channel at its real dial position", () => {
    const built = Object.entries(registry).flatMap(([position, manifest]) =>
      manifest && manifest.id !== "tv-guide"
        ? [
            {
              id: manifest.id,
              label: `CH ${position.padStart(2, "0")}`,
              title: manifest.name,
            },
          ]
        : [],
    );
    expect(dial.map(({ id, label, title }) => ({ id, label, title }))).toEqual(
      built,
    );
    for (const channel of dial) expect(channel.blurb.trim()).not.toBe("");
  });
});
