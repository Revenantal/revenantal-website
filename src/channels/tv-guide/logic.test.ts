import { describe, expect, it } from "vitest";
import {
  FIXTURE_NOW,
  FRESH_LIVE,
  FRESH_STATE,
  STALE_LIVE,
  STALE_STATE,
  UNAVAILABLE_STATE,
  fixtureProjects,
} from "../_shared/testing/fixtures";
import { buildRows, callsign, projectRow, serverRow } from "./listings";
import { tickerItems } from "./ticker";
import { clockParts, listingSlots, longDate, timeAgo } from "./time";

const dialChannel = {
  id: "status",
  label: "CH 10",
  title: "STATUS",
  blurb: "The server rack.",
};

describe("listings", () => {
  it("makes cable-style call signs", () => {
    expect(callsign("Project A", "PRJ")).toBe("PROJ");
    expect(callsign("hvrc-website", "PRJ")).toBe("HVRC");
    expect(callsign("!!", "PRJ")).toBe("PRJ");
  });

  it("gives projects a new-tab link and a LIVE badge only while up", () => {
    const [up] = fixtureProjects(1).map((project) => ({
      ...project,
      status: "up" as const,
    }));
    if (!up) throw new Error("no fixture");
    const row = projectRow(up, 2);
    expect(row.action).toEqual({ kind: "link", url: up.url });
    expect(row.blocks[0]?.tag).toBe("LIVE");
    expect(row.label).toBe(
      "Project 1, up. Placeholder project number 1. (opens in a new tab)",
    );
    const unknown = projectRow({ ...up, status: undefined }, 0);
    expect(unknown.blocks.some((block) => block.tag)).toBe(false);
    expect(unknown.label).toContain("status unknown");
    expect(unknown.blocks.map((block) => block.span)).toEqual([2, 1]);
  });

  it("shows server player counts only when observed, and stale servers as unknown", () => {
    const running = serverRow(
      {
        id: "a",
        name: "Pix",
        game: "minecraft",
        state: "running",
        players: 3,
        maxPlayers: 20,
      },
      0,
    );
    expect(running.blocks[0]?.tag).toBe("3/20");
    expect(running.action.kind).toBe("none");
    const quiet = serverRow(
      { id: "b", name: "Fac", game: "factorio", state: "running" },
      1,
    );
    expect(quiet.blocks[0]?.tag).toBeUndefined();
    expect(quiet.callsign).toBe("SRV2");
    expect(
      serverRow({ id: "c", name: "Old", game: "g", state: "unknown" }, 2)
        .blocks[0]?.detail,
    ).toContain("Status unknown");
  });

  it("orders projects, servers, Steam, GitHub and other channels, skipping stale Steam", () => {
    const rows = buildRows({
      projects: fixtureProjects(2),
      servers: FRESH_LIVE.servers ?? [],
      live: FRESH_LIVE,
      steam: FRESH_STATE.steam,
      dial: [dialChannel],
      now: FIXTURE_NOW,
    });
    expect(rows.map((row) => row.icon)).toEqual([
      "site",
      "tool",
      "server",
      "server",
      "steam",
      "git",
      "dial",
    ]);
    expect(rows.at(-1)?.action).toEqual({ kind: "tune", channelId: "status" });
    const stale = buildRows({
      projects: [],
      servers: [],
      live: STALE_LIVE,
      steam: STALE_STATE.steam,
      dial: [],
      now: FIXTURE_NOW,
    });
    expect(stale).toEqual([]);
  });
});

describe("ticker", () => {
  it("reports only what is true now", () => {
    const items = tickerItems({
      projects: [
        ...fixtureProjects(1).map((project) => ({
          ...project,
          status: "down" as const,
        })),
      ],
      live: FRESH_LIVE,
      freshness: FRESH_STATE,
      now: FIXTURE_NOW,
    });
    expect(items).toEqual([
      "revenantal has been playing Game 1 lately",
      "project-1 pushed just now",
      "Server 1: 3 players online",
      "Project 1 is down",
    ]);
  });

  it("says nothing stale and never goes empty", () => {
    expect(
      tickerItems({
        projects: [],
        live: STALE_LIVE,
        freshness: STALE_STATE,
        now: FIXTURE_NOW,
      }),
    ).toEqual(["Welcome to the revenantal guide"]);
    expect(
      tickerItems({
        projects: [],
        live: null,
        freshness: UNAVAILABLE_STATE,
        now: FIXTURE_NOW,
      }),
    ).toEqual(["Welcome to the revenantal guide"]);
  });
});

describe("time", () => {
  const at = new Date(2026, 9, 19, 19, 42);

  it("shows the viewer's own clock in their locale's format", () => {
    expect(clockParts(at, "en-US")).toEqual({ time: "7:42", period: "PM" });
    expect(clockParts(at, "en-GB")).toEqual({ time: "19:42", period: "" });
    expect(longDate(at, "en-US")).toBe("MONDAY · OCTOBER 19");
  });

  it("starts the listings at the current half hour", () => {
    expect(listingSlots(at, "en-US")).toEqual({
      date: "MON 10/19",
      slots: ["7:30 PM", "8:00 PM", "8:30 PM"],
    });
    expect(listingSlots(new Date(2026, 9, 19, 19, 12), "en-GB").slots[0]).toBe(
      "19:00",
    );
  });

  it("describes how long ago something happened", () => {
    expect(
      timeAgo(new Date(at.getTime() - 2 * 3_600_000).toISOString(), at, "en"),
    ).toBe("2 hours ago");
    expect(timeAgo("nonsense", at, "en")).toBeNull();
  });
});
