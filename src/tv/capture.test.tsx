// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/preact";
import { useSyncExternalStore } from "preact/compat";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStore } from "@data/store";
import type { SaveStorage } from "@data/channel-save";
import type { ChannelProps } from "@channels/_shared/types";
import { SLOT_COUNT } from "./lineup";
import { TvView } from "./TvView";

// A test lineup: a probe game at position 2 that hands its props to the test, plus the
// launch reservations, so capture and saves run through the real TV, store and frame.
const probe = vi.hoisted(() => ({ props: null as ChannelProps | null }));
vi.mock("@channels/index", async () => {
  const { createLineup } = await import("@channels/_shared/lineup");
  const capture = (props: ChannelProps) => {
    probe.props = props;
  };
  const Probe = (props: ChannelProps) => {
    capture(props);
    return <p>{props.captured ? "game captured" : "game idle"}</p>;
  };
  const registry = {
    2: {
      id: "probe",
      name: "PROBE",
      kind: "game" as const,
      bg: "#000000",
      glow: "rgba(0,0,0,0.5)",
      safe: false,
      display: { transition: "cut" as const },
      load: () => Promise.resolve({ ChannelComponent: Probe }),
    },
    11: null,
  };
  return {
    registry,
    lineup: createLineup(registry, {
      reserved: { "tv-guide": 1, status: 10, credits: 11 },
    }),
  };
});

beforeEach(() => {
  probe.props = null;
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1920);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(1080);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function memory(): SaveStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

function ConnectedTv({ store }: { store: ReturnType<typeof createStore> }) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return <TvView snapshot={snapshot} view={store.getView()} actions={store} />;
}

async function tuneToProbe(storage: SaveStorage = memory()) {
  const store = createStore({
    positionCount: SLOT_COUNT,
    initialChannel: 2,
    storage,
  });
  render(<ConnectedTv store={store} />);
  await screen.findByText("game idle");
  await vi.waitFor(() => {
    expect(probe.props?.active).toBe(true);
  });
  const current = () => {
    if (!probe.props) throw new Error("the probe channel did not mount");
    return probe.props;
  };
  return { store, current, storage };
}

const arrow = (key: string) => {
  void act(() => {
    fireEvent.keyDown(document.body, { key });
  });
};

describe("keyboard capture through the TV", () => {
  it("starts not captured, and the arrows turn the dial", async () => {
    const { store, current } = await tuneToProbe();
    expect(current().captured).toBe(false);
    arrow("ArrowRight");
    expect(store.getSnapshot().channel).toBe(3);
  });

  it("takes the keys off the dial once captured, but volume still works", async () => {
    const { store, current } = await tuneToProbe();
    void act(() => {
      current().requestCapture();
    });
    await screen.findByText("game captured");
    expect(current().captured).toBe(true);

    arrow("ArrowRight");
    arrow("ArrowLeft");
    arrow("ArrowUp");
    arrow("ArrowDown");
    expect(store.getSnapshot().channel).toBe(2);

    const volume = store.getSnapshot().settings.volume;
    arrow("+");
    expect(store.getSnapshot().settings.volume).toBe(volume + 1);
  });

  it("hands the keys back on Esc", async () => {
    const { store, current } = await tuneToProbe();
    void act(() => {
      current().requestCapture();
    });
    await screen.findByText("game captured");
    arrow("Escape");
    await screen.findByText("game idle");
    arrow("ArrowRight");
    expect(store.getSnapshot().channel).toBe(3);
  });

  it("hands the keys back on a press outside the glass, not inside it", async () => {
    const { current } = await tuneToProbe();
    void act(() => {
      current().requestCapture();
    });
    await screen.findByText("game captured");

    void act(() => {
      fireEvent.pointerDown(screen.getByText("game captured"));
    });
    expect(current().captured).toBe(true);

    void act(() => {
      fireEvent.pointerDown(document.body);
    });
    await screen.findByText("game idle");
  });

  it("releases on tune-away, and an old scope cannot capture or release the new one", async () => {
    const { store, current } = await tuneToProbe();
    const old = current();
    void act(() => {
      old.requestCapture();
    });
    await screen.findByText("game captured");

    void act(() => {
      old.host.tune("status");
    });
    expect(store.getSnapshot().channel).toBe(10);

    // Back on the probe: a fresh scope, not captured, whatever the old one does.
    void act(() => {
      old.requestCapture();
      old.releaseCapture();
    });
    void act(() => {
      store.setChannel(2);
    });
    await screen.findByText("game idle");
    expect(current().captured).toBe(false);
  });

  it("releases when the TV turns off, and when the tab is hidden", async () => {
    const { store, current } = await tuneToProbe();
    void act(() => {
      current().requestCapture();
    });
    await screen.findByText("game captured");
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    void act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    void act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await screen.findByText("game idle");

    void act(() => {
      current().requestCapture();
    });
    await screen.findByText("game captured");
    void act(() => {
      store.setPower(false);
    });
    void act(() => {
      store.setPower(true);
    });
    await screen.findByText("game idle");
  });

  it("ignores a request that did not come from a user gesture", async () => {
    vi.stubGlobal("navigator", { userActivation: { isActive: false } });
    const { current } = await tuneToProbe();
    void act(() => {
      current().requestCapture();
    });
    expect(current().captured).toBe(false);

    vi.stubGlobal("navigator", { userActivation: { isActive: true } });
    void act(() => {
      current().requestCapture();
    });
    await screen.findByText("game captured");
  });

  it("is safe to release repeatedly", async () => {
    const { current } = await tuneToProbe();
    void act(() => {
      current().releaseCapture();
      current().releaseCapture();
    });
    expect(current().captured).toBe(false);
  });
});

describe("channel saves through the TV", () => {
  it("saves under rv-save-<id> and loads it back", async () => {
    const { current, storage } = await tuneToProbe();
    expect(current().save.store(1, { xp: 12 })).toBe(true);
    expect(storage.getItem("rv-save-probe")).toBe(
      JSON.stringify({ version: 1, data: { xp: 12 } }),
    );
    expect(current().save.load(1, (value) => value)).toEqual({ xp: 12 });
    expect(current().save.reset()).toBe(true);
    expect(storage.getItem("rv-save-probe")).toBeNull();
  });

  it("rejects a bad value and keeps the TV working with blocked storage", async () => {
    const blocked: SaveStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    const { store, current } = await tuneToProbe(blocked);
    expect(current().save.store(1, Number.NaN)).toBe(false);
    expect(current().save.store(1, { xp: 1 })).toBe(false);
    expect(current().save.load(1, (value) => value)).toBeNull();
    arrow("ArrowRight");
    expect(store.getSnapshot().channel).toBe(3);
  });

  it("stops an ended scope from writing, after its cleanup has run", async () => {
    const { store, current, storage } = await tuneToProbe();
    const old = current();
    void act(() => {
      store.setChannel(10);
    });
    // The channel is gone once its picture leaves the glass; its cleanup then closes the save.
    await vi.waitFor(() => {
      expect(screen.queryByText("game idle")).toBeNull();
    });
    await Promise.resolve();
    expect(old.save.store(1, { xp: 99 })).toBe(false);
    expect(storage.getItem("rv-save-probe")).toBeNull();
    expect(old.save.load(1, (value) => value)).toBeNull();
    expect(old.save.reset()).toBe(false);
  });
});
