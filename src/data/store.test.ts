import { describe, expect, it, vi } from "vitest";
import { createStore } from "./store";
import type { Site } from "./types";

const now = new Date("2026-10-18T12:00:00Z");
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
const json = (value: unknown) =>
  new Response(JSON.stringify(value), {
    headers: { "Content-Type": "application/json" },
  });

describe("shared store", () => {
  it("fetches once per resource, then ages the retained snapshot without polling", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation((url) =>
      Promise.resolve(
        url === "/site.json"
          ? json(site)
          : json({
              fetchedAt: now.toISOString(),
              sources: {
                github: {
                  lastAttemptAt: now.toISOString(),
                  lastSuccessAt: now.toISOString(),
                  failed: false,
                },
              },
              github: { repos: [] },
            }),
      ),
    );
    const store = createStore({ fetcher, now });
    await Promise.all([store.load(), store.load()]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(store.getView()?.freshness.github.state).toBe("fresh");
    store.tick(new Date("2026-10-18T12:30:00Z"));
    expect(store.getView()?.freshness.github.state).toBe("stale");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("renders site content before a delayed live request completes", async () => {
    let finish: ((response: Response) => void) | undefined;
    const fetcher = vi.fn<typeof fetch>().mockImplementation((url) =>
      url === "/site.json"
        ? Promise.resolve(json(site))
        : new Promise<Response>((resolve) => {
            finish = resolve;
          }),
    );
    const store = createStore({ fetcher, now });
    const loaded = store.load();
    await vi.waitFor(() => {
      expect(store.getSnapshot().loading).toBe(false);
    });
    expect(store.getSnapshot().site).toEqual(site);
    finish?.(new Response("", { status: 404 }));
    await loaded;
  });

  it("uses null live data on HTTP, malformed JSON or transport failures", async () => {
    for (const live of [
      new Response("", { status: 404 }),
      new Response("invalid", {
        headers: { "Content-Type": "application/json" },
      }),
      new Response("<html>fallback</html>"),
    ]) {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockImplementation((url) =>
          Promise.resolve(url === "/site.json" ? json(site) : live),
        );
      const store = createStore({ fetcher });
      await store.load();
      expect(store.getSnapshot().error).toBe(false);
      expect(store.getView()?.live).toBeNull();
    }
  });

  it("contains site failures and blocked storage", async () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    const store = createStore({
      storage,
      fetcher: vi.fn<typeof fetch>().mockRejectedValue(new Error("offline")),
    });
    store.setCaptions(false);
    store.setVolume(20);
    expect(store.getSnapshot().settings).toMatchObject({
      captions: false,
      volume: 10,
    });
    await store.load();
    expect(store.getSnapshot().error).toBe(true);
  });

  it("persists captions, validates positions and closes the door on power-off", () => {
    const storage = {
      getItem: () => '{"captions":false,"volume":2}',
      setItem: vi.fn(),
    };
    const store = createStore({ storage, positionCount: 17 });
    expect(store.getSnapshot().settings.captions).toBe(false);
    store.setCaptions(true);
    expect(storage.setItem).toHaveBeenCalledWith(
      "rv-settings",
      expect.stringContaining('"captions":true'),
    );
    expect(store.setChannel(14)).toBe(true);
    expect(store.setChannel(18)).toBe(false);
    expect(store.setChannel(Number.NaN)).toBe(false);
    store.setDoor(true);
    store.setPower(false);
    expect(store.getSnapshot().door).toBe(false);
    expect(store.setChannel(1)).toBe(false);
  });
});
