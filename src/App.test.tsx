// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { createStore } from "@data/store";
import type { Site } from "@data/types";

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

let wide = true;
beforeEach(() => {
  wide = true;
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("min-width") ? wide : false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1920);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(1080);
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderApp(options: Parameters<typeof createStore>[0] = {}) {
  const values = new Map<string, string>();
  const store = createStore({
    positionCount: 11,
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        values.set(key, value);
      },
    },
    fetcher: (url) =>
      Promise.resolve(
        (typeof url === "string"
          ? url
          : url instanceof URL
            ? url.href
            : url.url
        ).endsWith("site.json")
          ? new Response(JSON.stringify(site), {
              headers: { "Content-Type": "application/json" },
            })
          : new Response(null, { status: 404 }),
      ),
    ...options,
  });
  render(<App store={store} />);
  return { store, values };
}

describe("TV and List modes", () => {
  it("shows the TV on wide windows by default", () => {
    renderApp();
    expect(screen.getByRole("button", { name: /Channel dial/ })).toBeTruthy();
  });

  it("fades into List mode when powered off, remembers it, and turns back on", async () => {
    vi.useFakeTimers();
    const { store, values } = renderApp();
    await act(async () => {
      await store.load();
    });

    fireEvent.click(screen.getByRole("button", { name: "Power" }));
    expect(values.get("rv-tv")).toBe("off");
    expect(screen.getByRole("button", { name: /Channel dial/ })).toBeTruthy();
    void act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(screen.queryByRole("button", { name: /Channel dial/ })).toBeNull();
    const turnOn = screen.getByRole("button", { name: "Turn on the TV" });
    expect(document.activeElement?.textContent).toBe("REVENANTAL");

    fireEvent.click(turnOn);
    void act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: /Channel dial/ }),
    );
    expect(values.get("rv-tv")).toBe("on");
  });

  it("starts in List mode when the TV was left off, and shows only List on narrow windows", async () => {
    const { store } = renderApp({ initialPower: false });
    await act(async () => {
      await store.load();
    });
    expect(screen.getByRole("button", { name: "Turn on the TV" })).toBeTruthy();
    cleanup();

    wide = false;
    const narrow = renderApp();
    await act(async () => {
      await narrow.store.load();
    });
    expect(screen.queryByRole("button", { name: /Channel dial/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Turn on the TV" })).toBeNull();
  });

  it("writes #chN as the dial turns, re-tunes on a changed hash, and saves the position", () => {
    const { store, values } = renderApp({ initialChannel: 3 });
    expect(window.location.hash).toBe("#ch3");

    fireEvent.click(screen.getByRole("button", { name: /Channel dial/ }));
    expect(window.location.hash).toBe("#ch4");
    expect(values.get("rv-ch")).toBe("3");

    void act(() => {
      window.location.hash = "#ch10";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(store.getSnapshot().channel).toBe(10);
    void act(() => {
      window.location.hash = "#ch99";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(store.getSnapshot().channel).toBe(10);
  });

  it("offers a skip link that turns the TV off into List mode", () => {
    const { store } = renderApp();
    fireEvent.click(
      screen.getByRole("button", { name: "Skip to the simple list" }),
    );
    expect(store.getSnapshot().power).toBe(false);
  });
});
