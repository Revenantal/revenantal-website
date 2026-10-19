import { vi } from "vitest";
import type {
  Live,
  LiveFreshness,
  LiveServer,
  Project,
  Site,
  SourceState,
} from "../../../data/types";
import type { ChannelProps } from "../types";

/**
 * Test-only fixtures for the channel contract. They match what the TV host passes after
 * freshness filtering, so channels never need the store. Placeholder names only.
 */

/** The fixed display clock every fixture uses. */
export const FIXTURE_NOW = new Date("2026-10-19T18:30:00Z");

const FIXTURE_ISO = FIXTURE_NOW.toISOString();
const OLD_ISO = new Date(FIXTURE_NOW.getTime() - 3 * 60 * 60_000).toISOString();

/**
 * Visible, ordered projects named Project 1..N.
 *
 * @param count - How many projects.
 * @returns Projects with stable IDs and example.invalid URLs.
 */
export function fixtureProjects(count: number): Project[] {
  const types: Project["type"][] = ["site", "tool", "sandbox"];
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    return {
      id: `project-${String(number)}`,
      name: `Project ${String(number)}`,
      type: types[index % types.length] ?? "site",
      url: `https://project-${String(number)}.example.invalid/`,
      host: `project-${String(number)}.example.invalid`,
      desc: `Placeholder project number ${String(number)}.`,
      order: number,
    };
  });
}

const freshServers: LiveServer[] = [
  {
    id: "1a2b3c4d",
    name: "Server 1",
    game: "minecraft",
    state: "running",
    players: 3,
    maxPlayers: 20,
    uptimeSec: 86_400,
    address: "203.0.113.10:25565",
    cpuPct: 21,
    memMb: 2048,
    memLimitMb: 4096,
    netRxBps: 12_000,
    netTxBps: 30_000,
  },
  { id: "5e6f7a8b", name: "Server 2", game: "factorio", state: "offline" },
];

/** Every source observed just now. */
export const FRESH_LIVE: Live = {
  fetchedAt: FIXTURE_ISO,
  sources: {
    steam: {
      lastAttemptAt: FIXTURE_ISO,
      lastSuccessAt: FIXTURE_ISO,
      failed: false,
    },
    github: {
      lastAttemptAt: FIXTURE_ISO,
      lastSuccessAt: FIXTURE_ISO,
      failed: false,
    },
    status: {
      lastAttemptAt: FIXTURE_ISO,
      lastSuccessAt: FIXTURE_ISO,
      failed: false,
    },
    servers: {
      lastAttemptAt: FIXTURE_ISO,
      lastSuccessAt: FIXTURE_ISO,
      failed: false,
    },
  },
  steam: {
    status: "online",
    level: 12,
    gamesOwned: 140,
    hoursPast2Weeks: 9.5,
    recent: [{ appId: 1, name: "Game 1", hours2w: 9.5, hoursTotal: 120 }],
  },
  github: {
    repos: [
      {
        name: "project-1",
        pushedAt: FIXTURE_ISO,
        lang: "TypeScript",
        url: "https://project-1.example.invalid/",
      },
    ],
  },
  status: { "project-1": { state: "up", ms: 120 } },
  servers: freshServers,
};

/**
 * Every source failed long ago, after the host's freshness filter: servers keep only their
 * identity with an unknown state, and project status is gone.
 */
export const STALE_LIVE: Live = {
  fetchedAt: FIXTURE_ISO,
  sources: {
    steam: { lastAttemptAt: FIXTURE_ISO, lastSuccessAt: OLD_ISO, failed: true },
    github: {
      lastAttemptAt: FIXTURE_ISO,
      lastSuccessAt: OLD_ISO,
      failed: true,
    },
    status: {
      lastAttemptAt: FIXTURE_ISO,
      lastSuccessAt: OLD_ISO,
      failed: true,
    },
    servers: {
      lastAttemptAt: FIXTURE_ISO,
      lastSuccessAt: OLD_ISO,
      failed: true,
    },
  },
  servers: freshServers.map(({ id, name, game }) => ({
    id,
    name,
    game,
    state: "unknown",
  })),
};

const links: Site["links"] = {
  steam: "https://steam.example.invalid/",
  github: "https://github.example.invalid/",
  discord: "revenantal",
};

const credits: Site["credits"] = [
  {
    title: "Asset 1",
    author: "Author 1",
    url: "https://credit-1.example.invalid/",
    license: "CC BY 4.0",
    usedFor: "Placeholder credit",
  },
];

const every = (state: SourceState): LiveFreshness => ({
  steam: state,
  github: state,
  status: state,
  servers: state,
});

/** Every source fresh, as FRESH_LIVE reports. */
export const FRESH_STATE = every({ state: "fresh", observedAt: FIXTURE_ISO });
/** Every source stale, as STALE_LIVE reports. */
export const STALE_STATE = every({ state: "stale", observedAt: OLD_ISO });
/** No live data at all. */
export const UNAVAILABLE_STATE = every({
  state: "unavailable",
  observedAt: null,
});

/**
 * Full channel props with spies for every callback: one fresh project and live data, active,
 * full motion and volume. Every value can be overridden.
 *
 * @param overrides - Props to replace.
 * @returns Props a channel can render from.
 */
export function channelProps(
  overrides: Partial<ChannelProps> = {},
): ChannelProps {
  const live = "live" in overrides ? (overrides.live ?? null) : FRESH_LIVE;
  return {
    projects: fixtureProjects(1),
    servers: live?.servers ?? [],
    live,
    freshness:
      live === null
        ? UNAVAILABLE_STATE
        : live === STALE_LIVE
          ? STALE_STATE
          : FRESH_STATE,
    links,
    credits,
    broadcast: null,
    now: FIXTURE_NOW,
    active: true,
    reducedMotion: false,
    volume: 0.5,
    play: vi.fn(),
    setLoop: vi.fn(),
    captions: true,
    setCaptions: vi.fn(),
    host: { tune: vi.fn(() => true), powerOff: vi.fn() },
    captured: false,
    requestCapture: vi.fn(),
    releaseCapture: vi.fn(),
    save: {
      load: vi.fn(() => null),
      store: vi.fn(() => true),
      reset: vi.fn(() => true),
    },
    ...overrides,
  };
}

/** A named set of data a channel must render sensibly. */
export type FixtureCase = { name: string; props: Partial<ChannelProps> };

/** Every data shape from the contract: fixtures, no live, stale, 0/1/30 projects, empties. */
export const FIXTURE_CASES: FixtureCase[] = [
  { name: "fresh fixtures", props: {} },
  { name: "live = null", props: { live: null } },
  { name: "stale sources", props: { live: STALE_LIVE } },
  { name: "0 projects", props: { projects: [] } },
  { name: "1 project", props: { projects: fixtureProjects(1) } },
  { name: "30 projects", props: { projects: fixtureProjects(30) } },
  { name: "no credits", props: { credits: [] } },
  { name: "reduced motion", props: { reducedMotion: true } },
  { name: "muted and locked", props: { volume: 0 } },
];

/**
 * Freezes a value and everything inside it, so a channel that mutates its props throws.
 *
 * @param value - Props or data.
 * @returns The same value, frozen.
 */
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const inner of Object.values(value)) deepFreeze(inner);
  }
  return value;
}
