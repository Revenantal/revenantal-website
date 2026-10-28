import { describe, expect, it } from "vitest";
import { registry } from "../../src/channels/index.ts";
import dial from "../../src/channels/tv-guide/dial.json";

// Dev-only channels are registered in the dev server but are not on the production dial, so
// the TV Guide does not list them. Remove an ID here when its channel goes live and add it
// to dial.json.
const DEV_ONLY = new Set(["revscape"]);

describe("the TV Guide's channel list", () => {
  it("lists every other built channel at its real dial position", () => {
    const built = Object.entries(registry).flatMap(([position, manifest]) =>
      manifest && manifest.id !== "tv-guide" && !DEV_ONLY.has(manifest.id)
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
