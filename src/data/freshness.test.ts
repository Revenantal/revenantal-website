import { describe, expect, it } from "vitest";
import { decodeLive } from "./decode-live";
import { filterFreshData } from "./freshness";
import type { Live, Site } from "./types";

const observed = "2026-10-18T12:00:00Z";
const metadata = {
  lastAttemptAt: observed,
  lastSuccessAt: observed,
  failed: false,
};
const site: Site = {
  projects: [
    {
      id: "fixture",
      name: "Fixture",
      type: "sandbox",
      url: "https://example.invalid/",
      host: "example.invalid",
      desc: "Fixture",
    },
  ],
  buttons: [],
  links: {
    steam: "https://example.invalid/",
    github: "https://example.invalid/",
    discord: "fixture",
  },
  credits: [],
  servers: [],
  broadcast: {},
};
const raw: Live = {
  fetchedAt: observed,
  sources: {
    status: metadata,
    servers: metadata,
    steam: metadata,
    github: metadata,
  },
  status: { fixture: { state: "up", ms: 10 } },
  servers: [
    {
      id: "server",
      name: "Fixture",
      game: "Fixture",
      state: "running",
      players: 4,
      uptimeSec: 123,
      cpuPct: 40,
      netRxBps: 500,
      address: "203.0.113.1:25565",
    },
  ],
  steam: {
    status: "online",
    level: 1,
    gamesOwned: 1,
    hoursPast2Weeks: 1,
    recent: [],
  },
  github: { repos: [] },
};

describe("source freshness", () => {
  it("retains stale repository navigation without current activity or status", () => {
    const githubSite: Site = {
      ...site,
      directory: { source: "github", limit: 10 },
      projects: [],
    };
    const snapshot: Live = {
      ...raw,
      github: { repos: [], projects: site.projects },
    };
    const view = filterFreshData(
      githubSite,
      snapshot,
      new Date("2026-10-18T13:00:00Z"),
    );
    expect(view.projects[0]?.url).toBe(site.projects[0]?.url);
    expect(view.projects[0]?.status).toBeUndefined();
    expect(view.live?.github).toBeUndefined();
    expect(view.freshness.github.state).toBe("stale");
    expect(
      filterFreshData(
        githubSite,
        {
          ...snapshot,
          github: { repos: [], projects: [] },
        },
        new Date(observed),
      ).projects,
    ).toEqual([]);
  });
  it("expires servers exactly at fifteen minutes, with no stale counters", () => {
    const before = filterFreshData(
      site,
      raw,
      new Date("2026-10-18T12:14:59.999Z"),
    );
    expect(before.servers[0]?.players).toBe(4);
    const expired = filterFreshData(
      site,
      raw,
      new Date("2026-10-18T12:15:00Z"),
    );
    expect(expired.servers[0]).toEqual({
      id: "server",
      name: "Fixture",
      game: "Fixture",
      state: "unknown",
    });
    expect(expired.freshness.servers.state).toBe("stale");
    expect(expired.projects[0]?.status).toBe("up");
  });

  it("expires all other observations at thirty minutes", () => {
    const expired = filterFreshData(
      site,
      raw,
      new Date("2026-10-18T12:30:00Z"),
    );
    expect(expired.projects[0]?.status).toBeUndefined();
    expect(expired.live?.steam).toBeUndefined();
    expect(expired.live?.github).toBeUndefined();
    expect(expired.live?.status).toBeUndefined();
    expect(raw.servers?.[0]?.players).toBe(4);
  });

  it("marks a failed source stale without hiding other fresh sources", () => {
    const failed = {
      ...raw,
      sources: { ...raw.sources, status: { ...metadata, failed: true } },
    };
    const view = filterFreshData(site, failed, new Date(observed));
    expect(view.freshness.status.state).toBe("stale");
    expect(view.projects[0]?.status).toBeUndefined();
    expect(view.live?.steam?.status).toBe("online");
  });

  it.each([null, "invalid", "2026-10-18T13:00:00Z"])(
    "never trusts missing, malformed or future observations: %s",
    (lastSuccessAt) => {
      const invalid = {
        ...raw,
        sources: { ...raw.sources, steam: { ...metadata, lastSuccessAt } },
      };
      expect(
        filterFreshData(site, invalid, new Date(observed)).freshness.steam
          .state,
      ).toBe("unavailable");
    },
  );

  it("preserves a current opt-in address on stale identities and hides revoked addresses", () => {
    const optedIn = {
      ...site,
      servers: [{ pelicanId: "server", showAddress: true }],
    };
    expect(
      filterFreshData(optedIn, raw, new Date("2026-10-18T13:00:00Z")).servers[0]
        ?.address,
    ).toBe("203.0.113.1:25565");
    expect(
      filterFreshData(site, raw, new Date(observed)).servers[0]?.address,
    ).toBeUndefined();
    expect(
      filterFreshData(
        { ...site, servers: [{ pelicanId: "server", hidden: true }] },
        raw,
        new Date(observed),
      ).servers,
    ).toEqual([]);
  });

  it("accepts fresh empty payloads and keeps missing data unknown", () => {
    expect(
      filterFreshData(site, { ...raw, servers: [] }, new Date(observed))
        .freshness.servers.state,
    ).toBe("fresh");
    expect(
      filterFreshData(site, null, new Date(observed)).projects[0]?.status,
    ).toBeUndefined();
  });

  it("discards one malformed provider while preserving valid sources", () => {
    const decoded = decodeLive({
      ...raw,
      steam: { ...raw.steam, friendList: ["Private"] },
    });
    expect(decoded?.steam).toBeUndefined();
    expect(decoded?.status).toEqual(raw.status);
    expect(decodeLive({ ...raw, fetchedAt: "not a timestamp" })).toBeNull();
  });
});
