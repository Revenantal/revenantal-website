import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import listing from "./__fixtures__/servers-beta38.json";
import stats from "./__fixtures__/resources-beta38.json";
import { serverSnapshotSchema } from "../../src/data/schemas.ts";
import { listingSchema, queryResultSchema } from "./schemas.ts";
import { allocationAddress, mapServer, queryTarget } from "./mapping.ts";
const entry = listingSchema.parse(listing).data[0];
assert(entry);
const metadata = entry.attributes;
const now = Date.parse("2026-10-18T12:00:00Z");
describe("beta38 public resource mapping", () => {
  it("maps real sample units without scaling CPU or inventing first-sample rates", () => {
    const { server } = mapServer(metadata, stats, now);
    expect(server).toMatchObject({
      state: "running",
      uptimeSec: 298546.289,
      cpuPct: 0.149,
      memMb: 2043437056 / 1048576,
      memLimitMb: 3000,
    });
    expect(server.netRxBps).toBeUndefined();
    expect(server.address).toBeUndefined();
    expect(
      serverSnapshotSchema.safeParse({
        fetchedAt: new Date(now).toISOString(),
        servers: [server],
      }).success,
    ).toBe(true);
    expect(JSON.stringify(server)).not.toMatch(
      /fixture-private|example.invalid|sftp|invocation|disk_bytes/,
    );
  });
  it("calculates rates only from adjacent running observations", () => {
    const first = mapServer(metadata, stats, now);
    const next = structuredClone(stats);
    next.attributes.resources.uptime += 120000;
    next.attributes.resources.network_rx_bytes += 12000;
    next.attributes.resources.network_tx_bytes += 24000;
    expect(
      mapServer(metadata, next, now + 120000, first.counter).server,
    ).toMatchObject({ netRxBps: 100, netTxBps: 200 });
  });
  it.each(["restart", "reset", "old", "future"])(
    "omits invalid rate baseline: %s",
    (reason) => {
      const counter = mapServer(metadata, stats, now).counter;
      assert(counter);
      if (reason === "restart")
        counter.uptime = stats.attributes.resources.uptime - 1000;
      if (reason === "reset") counter.rx += 1;
      if (reason === "old") counter.at -= 600000;
      if (reason === "future") counter.at += 120000;
      expect(
        mapServer(metadata, stats, now + 120000, counter).server.netRxBps,
      ).toBeUndefined();
    },
  );
  it("drops counters after offline/unknown/maintenance and failed resource reads", () => {
    for (const state of ["offline", "starting", "stopping", "future-state"]) {
      const value = structuredClone(stats);
      value.attributes.current_state = state;
      const mapped = mapServer(metadata, value, now);
      expect(mapped.server.cpuPct).toBeUndefined();
      expect(mapped.counter).toBeUndefined();
    }
    expect(mapServer(metadata, null, now).server.state).toBe("unknown");
    expect(
      mapServer({ ...metadata, is_node_under_maintenance: true }, stats, now)
        .server.state,
    ).toBe("maintenance");
    expect(
      mapServer({ ...metadata, status: "suspended" }, null, now).server.cpuPct,
    ).toBeUndefined();
  });
  it("publishes only opted-in usable numeric allocations, never wildcard or alias labels", () => {
    expect(allocationAddress(metadata)).toBeUndefined();
    expect(
      mapServer(metadata, stats, now, undefined, {
        pelicanId: metadata.identifier,
        showAddress: true,
      }).server.address,
    ).toBeUndefined();
    const server = structuredClone(metadata);
    const allocation = server.relationships.allocations.data[0];
    assert(allocation);
    allocation.attributes.ip = "203.0.113.1";
    expect(mapServer(server, stats, now).server.address).toBeUndefined();
    expect(
      mapServer(server, stats, now, undefined, {
        pelicanId: server.identifier,
        showAddress: true,
      }).server.address,
    ).toBe("203.0.113.1:34197");
  });
  it("requires configured routing for wildcard binds and excludes external Factorio lookup", () => {
    expect(queryTarget(metadata, {}, undefined)).toBeNull();
    expect(
      queryTarget(metadata, {
        aaaaaaaa: { host: "127.0.0.1", gamedig: "protocol-valve" },
      }),
    ).toMatchObject({ host: "127.0.0.1", port: 34197, type: "protocol-valve" });
    expect(
      queryTarget(metadata, {}, { pelicanId: "aaaaaaaa", gamedig: "factorio" }),
    ).toBeNull();
  });
  it("strips all game query identity/raw fields before public mapping", () => {
    const result = queryResultSchema.parse({
      numplayers: 4,
      maxplayers: 20,
      ping: 8,
      password: true,
      players: [{ name: "fixture-private-player" }],
      raw: { token: "fixture-secret" },
    });
    const mapped = mapServer(
      metadata,
      stats,
      now,
      undefined,
      undefined,
      result,
    );
    expect(mapped.server).toMatchObject({
      players: 4,
      maxPlayers: 20,
      pingMs: 8,
      passworded: true,
    });
    expect(JSON.stringify(mapped.server)).not.toMatch(
      /fixture-private-player|fixture-secret/,
    );
  });
});
