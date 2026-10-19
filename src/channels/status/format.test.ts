import { describe, expect, it } from "vitest";
import type { LiveServer } from "../../data/types";
import {
  age,
  readout,
  serverActivity,
  sourceCaption,
  uptime,
  uptimeWords,
} from "./format";

const now = new Date("2026-10-19T18:30:00Z");
const ago = (minutes: number) =>
  new Date(now.getTime() - minutes * 60_000).toISOString();

describe("status text", () => {
  it("reads response times, and never invents one for unknown or down projects", () => {
    expect(readout(142, "up")).toBe("142ms");
    expect(readout(1900, "slow")).toBe("1.9s");
    expect(readout(undefined, "up")).toBe("—");
    expect(readout(142, "unknown")).toBe("—");
    expect(readout(142, "down")).toBe("DOWN");
  });

  it("shortens and speaks uptimes", () => {
    expect(uptime(4 * 86_400 + 5)).toBe("4d");
    expect(uptime(11 * 3600)).toBe("11h");
    expect(uptime(35 * 60)).toBe("35m");
    expect(uptime(20)).toBe("<1m");
    expect(uptimeWords(86_400)).toBe("1 day");
    expect(uptimeWords(2 * 3600)).toBe("2 hours");
  });

  it("states ages and source captions", () => {
    expect(age(ago(0.5), now)).toBe("under a minute");
    expect(age(ago(8), now)).toBe("8 min");
    expect(age(ago(5 * 60), now)).toBe("5 h");
    expect(age(ago(3 * 24 * 60), now)).toBe("3 days");
    expect(age(null, now)).toBeNull();
    expect(sourceCaption({ state: "fresh", observedAt: ago(3) }, now)).toBe(
      "checked 3 min ago",
    );
    expect(sourceCaption({ state: "stale", observedAt: ago(300) }, now)).toBe(
      "STALE · 5 h old",
    );
    expect(sourceCaption({ state: "unavailable", observedAt: null }, now)).toBe(
      "NO DATA",
    );
  });

  it("describes each server state, and a stale one only by its sample age", () => {
    const fresh = { state: "fresh", observedAt: ago(1) } as const;
    const base: LiveServer = {
      id: "a",
      name: "A",
      game: "g",
      state: "running",
    };
    expect(
      serverActivity(
        { ...base, players: 3, maxPlayers: 20, uptimeSec: 4 * 86_400 },
        fresh,
        now,
      ),
    ).toBe("3/20 players · up 4d");
    expect(serverActivity(base, fresh, now)).toBe("players —");
    expect(serverActivity({ ...base, state: "starting" }, fresh, now)).toBe(
      "booting…",
    );
    expect(serverActivity({ ...base, state: "offline" }, fresh, now)).toBe(
      "offline",
    );
    expect(
      serverActivity(
        { ...base, state: "unknown" },
        { state: "stale", observedAt: ago(2 * 24 * 60) },
        now,
      ),
    ).toBe("sample 2 days old");
    expect(
      serverActivity(
        { ...base, state: "unknown" },
        { state: "unavailable", observedAt: null },
        now,
      ),
    ).toBe("no data");
  });
});
