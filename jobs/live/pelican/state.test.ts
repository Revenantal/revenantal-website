import { mkdtemp, readFile, writeFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { readCounters, writeCounters } from "./state.ts";
import { mapServer } from "./mapping.ts";
import { listingSchema } from "./schemas.ts";
import listing from "./__fixtures__/servers-beta38.json";
import resources from "./__fixtures__/resources-beta38.json";
describe("private scheduled rate baselines", () => {
  it("persists only numeric state and computes rates across ten-minute executions", async () => {
    const directory = await mkdtemp(join(tmpdir(), "rv-pelican-state-"));
    try {
      const file = join(directory, "pelican-state.json");
      const entry = listingSchema.parse(listing).data[0];
      if (!entry) throw new Error("Missing fixture");
      const now = Date.parse("2026-10-18T12:00:00Z");
      const first = mapServer(entry.attributes, resources, now);
      if (!first.counter) throw new Error("Missing counter");
      await writeCounters(
        file,
        new Map([[entry.attributes.identifier, first.counter]]),
      );
      const saved = await readCounters(file);
      const next = structuredClone(resources);
      next.attributes.resources.uptime += 600000;
      next.attributes.resources.network_rx_bytes += 60000;
      next.attributes.resources.network_tx_bytes += 120000;
      const result = mapServer(
        entry.attributes,
        next,
        now + 600000,
        saved.get(entry.attributes.identifier),
      );
      expect(result.server).toMatchObject({ netRxBps: 100, netTxBps: 200 });
      expect(await readdir(directory)).toEqual(["pelican-state.json"]);
      expect(await readFile(file, "utf8")).not.toMatch(
        /fixture-private|commands|players|name/,
      );
      await writeFile(file, "invalid");
      expect((await readCounters(file)).size).toBe(0);
      await writeCounters(file, new Map());
      expect((await readCounters(file)).size).toBe(0);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
