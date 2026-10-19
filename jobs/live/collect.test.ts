import { describe, expect, it, vi } from "vitest";
import { collectSnapshot } from "./collect.ts";
import type { SourceReaders } from "./collect.ts";
import { isPublicAddress } from "./project-check.ts";
import { createReaders, mapGithub, mapSteam } from "./providers.ts";
import type { Live, Site } from "../../src/data/types.ts";

const time = "2026-10-18T12:00:00Z";
const now = new Date("2026-10-18T12:10:00Z");
const site: Site = {
  projects: [],
  buttons: [],
  servers: [],
  links: {
    steam: "https://example.invalid/",
    github: "https://example.invalid/",
    discord: "fixture",
  },
  credits: [],
  broadcast: {},
};
const old: Live = {
  fetchedAt: time,
  sources: {
    github: { lastAttemptAt: time, lastSuccessAt: time, failed: false },
  },
  github: {
    repos: [
      {
        name: "Old",
        pushedAt: time,
        lang: "TS",
        url: "https://example.invalid/old",
      },
    ],
  },
};
const failure = () => Promise.reject(new Error("private-token-or-diagnostic"));
const readers = (): SourceReaders => ({
  steam: failure,
  github: failure,
  status: () => Promise.resolve({ data: {} }),
  servers: () => Promise.resolve({ data: [], observedAt: time }),
});

describe("live job observations", () => {
  it("preserves failed observations and success time without exposing raw errors", async () => {
    const next = await collectSnapshot(old, readers(), site, now);
    expect(next.github).toEqual(old.github);
    expect(next.sources.github).toEqual({
      lastAttemptAt: now.toISOString(),
      lastSuccessAt: time,
      failed: true,
    });
    expect(next.status).toEqual({});
    expect(JSON.stringify(next)).not.toContain("private-token");
    expect(next.errors).toEqual(["github_unavailable", "steam_unavailable"]);
  });
  it("replaces old data with successful empty data", async () => {
    const input = readers();
    input.github = () => Promise.resolve({ data: { repos: [] } });
    const next = await collectSnapshot(old, input, site, now);
    expect(next.github?.repos).toEqual([]);
    expect(next.sources.github?.lastSuccessAt).toBe(now.toISOString());
  });
  it("preserves a repeated agent sample time and current address policy", async () => {
    const input = readers();
    input.servers = () =>
      Promise.resolve({
        observedAt: time,
        data: [
          {
            id: "fixture",
            name: "Fixture",
            game: "Fixture",
            state: "running",
            address: "203.0.113.1:25565",
          },
        ],
      });
    const next = await collectSnapshot(null, input, site, now);
    expect(next.sources.servers?.lastSuccessAt).toBe(time);
    expect(next.servers?.[0]?.address).toBeUndefined();
    expect(
      (
        await collectSnapshot(
          null,
          input,
          { ...site, servers: [{ pelicanId: "fixture", showAddress: true }] },
          now,
        )
      ).servers?.[0]?.address,
    ).toBe("203.0.113.1:25565");
  });
  it("never advances freshness for a future agent sample or invalid payload", async () => {
    const input = readers();
    input.servers = () =>
      Promise.resolve({ observedAt: "2026-10-18T13:00:00Z", data: [] });
    input.github = () => Promise.resolve({ data: { repos: "invalid" } });
    const next = await collectSnapshot(null, input, site, now);
    expect(next.sources.servers).toMatchObject({
      failed: true,
      lastSuccessAt: null,
    });
    expect(next.sources.github?.failed).toBe(true);
  });
});

describe("provider projection", () => {
  it("shares one anonymous GitHub request between navigation and availability", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response("[]", { headers: { "Content-Type": "application/json" } }),
      );
    const source = createReaders(
      { ...site, directory: { source: "github", limit: 10 } },
      {},
      fetcher,
    );
    const [github, status] = await Promise.all([
      source.github(),
      source.status(),
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(github.data).toEqual({ repos: [], projects: [] });
    expect(status.data).toEqual({});
    expect(fetcher.mock.calls[0]?.[1]?.headers).not.toHaveProperty(
      "Authorization",
    );
  });
  it("omits archived/personal listings and raw descriptions, with stable IDs", () => {
    const repo = {
      id: 42,
      name: "fixture",
      html_url: "https://example.invalid/repo",
      pushed_at: time,
      language: "TypeScript",
      fork: false,
      private: false,
    };
    const mapped = mapGithub([
      repo,
      { ...repo, id: 43, archived: true },
      { ...repo, id: 44, description: "Personal website" },
    ]);
    expect(mapped.projects).toHaveLength(1);
    expect(mapped.projects?.[0]?.id).toBe("github-42");
    expect(JSON.stringify(mapped)).not.toContain("Personal website");
  });
  it("drops private GitHub repositories, forks and unnecessary account fields", () => {
    const repo = {
      id: 1,
      name: "Fixture",
      html_url: "https://example.invalid/fixture",
      pushed_at: time,
      language: null,
      fork: false,
      private: false,
      owner: { login: "private-field" },
    };
    const mapped = mapGithub([
      repo,
      { ...repo, private: true },
      { ...repo, fork: true },
    ]);
    expect(mapped.repos).toHaveLength(1);
    expect(JSON.stringify(mapped)).not.toContain("private-field");
  });
  it("converts Steam minutes to hours and strips personal fields", () => {
    const mapped = mapSteam([
      {
        response: {
          players: [
            {
              personastate: 1,
              gameid: "1",
              personaname: "private-field",
              loccityid: 1,
            },
          ],
        },
      },
      {
        response: {
          games: [
            {
              appid: 1,
              name: "Fixture",
              playtime_2weeks: 90,
              playtime_forever: 120,
            },
          ],
        },
      },
      { response: { game_count: 2 } },
      { response: { player_level: 3 } },
    ]);
    expect(mapped).toMatchObject({
      status: "in-game",
      hoursPast2Weeks: 1.5,
      gamesOwned: 2,
      level: 3,
    });
    expect(JSON.stringify(mapped)).not.toContain("private-field");
  });
});

describe("project target policy", () => {
  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "203.0.113.1",
    "::1",
    "fe80::1",
    "fc00::1",
    "::ffff:127.0.0.1",
    "not-an-address",
  ])("blocks non-public target %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });
  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])(
    "accepts public address %s",
    (address) => {
      expect(isPublicAddress(address)).toBe(true);
    },
  );
});
