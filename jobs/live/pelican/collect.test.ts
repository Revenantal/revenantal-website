import assert from "node:assert/strict";
import { describe, expect, it, vi } from "vitest";
import listing from "./__fixtures__/servers-beta38.json";
import stats from "./__fixtures__/resources-beta38.json";
import { listingSchema } from "./schemas.ts";
import { collectServers } from "./collect.ts";
const entry = listingSchema.parse(listing).data[0];
assert(entry);
const metadata = entry.attributes;
const now = new Date("2026-10-18T12:00:00Z");
describe("server collection lifecycle", () => {
  it("discovers additions/removals each cycle and replaces successful empty listings", async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce([metadata])
      .mockResolvedValueOnce([]);
    const client = { list, resources: () => Promise.resolve(stats) };
    const query = vi.fn().mockResolvedValue(null);
    const first = await collectServers(client, [], new Map(), now, query);
    expect(first.snapshot.servers).toHaveLength(1);
    const next = await collectServers(client, [], first.counters, now, query);
    expect(next.snapshot.servers).toEqual([]);
    expect(next.counters.size).toBe(0);
    expect(list).toHaveBeenCalledTimes(2);
  });
  it("isolates one resource failure without keeping its old counters", async () => {
    const other = {
      ...metadata,
      identifier: "bbbbbbbb",
      uuid: "123e4567-e89b-42d3-a456-426614174001",
    };
    const first = await collectServers(
      {
        list: () => Promise.resolve([metadata]),
        resources: () => Promise.resolve(stats),
      },
      [],
      new Map(),
      now,
      () => Promise.resolve(null),
    );
    const next = await collectServers(
      {
        list: () => Promise.resolve([metadata, other]),
        resources: (uuid) =>
          uuid === metadata.uuid
            ? Promise.reject(new Error("fixture-secret"))
            : Promise.resolve(stats),
      },
      [],
      first.counters,
      now,
      () => Promise.resolve(null),
    );
    expect(next.snapshot.servers[0]).toMatchObject({ state: "unknown" });
    expect(next.snapshot.servers[0]?.cpuPct).toBeUndefined();
    expect(next.snapshot.servers[1]?.state).toBe("running");
    expect(next.counters.has(metadata.identifier)).toBe(false);
    expect(next.unavailable).toBe(1);
    expect(JSON.stringify(next.snapshot)).not.toContain("fixture-secret");
  });
  it("does not query hidden servers or turn a game query failure into a stopped server", async () => {
    const resources = vi.fn().mockResolvedValue(stats);
    const client = { list: () => Promise.resolve([metadata]), resources };
    const query = vi.fn().mockRejectedValue(new Error("fixture-private"));
    const hidden = await collectServers(
      client,
      [{ pelicanId: metadata.identifier, hidden: true }],
      new Map(),
      now,
      query,
    );
    expect(hidden.snapshot.servers).toEqual([]);
    expect(resources).not.toHaveBeenCalled();
    const result = await collectServers(
      client,
      [{ pelicanId: metadata.identifier, gamedig: "protocol-valve" }],
      new Map(),
      now,
      query,
      "games.example.invalid",
    );
    expect(result.snapshot.servers[0]?.state).toBe("running");
    expect(result.snapshot.servers[0]?.players).toBeUndefined();
    expect(query).toHaveBeenCalledTimes(1);
  });
  it("fails closed on discovery failure instead of emitting an empty replacement", async () => {
    await expect(
      collectServers(
        {
          list: () => Promise.reject(new Error("fixture-private")),
          resources: () => Promise.resolve(stats),
        },
        [],
        new Map(),
        now,
        () => Promise.resolve(null),
      ),
    ).rejects.toThrow();
  });
});
