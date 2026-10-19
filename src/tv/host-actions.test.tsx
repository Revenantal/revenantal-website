// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/preact";
import { useSyncExternalStore } from "preact/compat";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStore } from "@data/store";
import type { ChannelProps } from "@channels/_shared/types";
import { SLOT_COUNT } from "./lineup";
import { TvView } from "./TvView";

// A test lineup: a probe channel at 2 that hands its props to the test, plus the launch
// reservations, so host actions run through the real TV, store and registry.
const probe = vi.hoisted(() => ({ props: null as ChannelProps | null }));
vi.mock("@channels/index", async () => {
  const { createLineup } = await import("@channels/_shared/lineup");
  const capture = (props: ChannelProps) => {
    probe.props = props;
  };
  const Probe = (props: ChannelProps) => {
    capture(props);
    return <p>probe channel</p>;
  };
  const registry = {
    2: {
      id: "probe",
      name: "PROBE",
      kind: "toy" as const,
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
});

function ConnectedTv({ store }: { store: ReturnType<typeof createStore> }) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return <TvView snapshot={snapshot} view={store.getView()} actions={store} />;
}

async function tuneToProbe() {
  const store = createStore({ positionCount: SLOT_COUNT, initialChannel: 2 });
  render(<ConnectedTv store={store} />);
  await screen.findByText("probe channel");
  await vi.waitFor(() => {
    expect(probe.props?.active).toBe(true);
  });
  const props = probe.props;
  if (!props) throw new Error("the probe channel did not mount");
  return { store, props };
}

describe("channel host actions through the TV", () => {
  it("tunes by stable ID, including reserved and current channels, and rejects unknown IDs", async () => {
    const { store, props } = await tuneToProbe();

    let result = true;
    void act(() => {
      result = props.host.tune("no-such-channel");
    });
    expect(result).toBe(false);
    expect(store.getSnapshot().channel).toBe(2);

    void act(() => {
      result = props.host.tune("probe");
    });
    expect(result).toBe(true);
    expect(store.getSnapshot().channel).toBe(2);

    void act(() => {
      result = props.host.tune("status");
    });
    expect(result).toBe(true);
    expect(store.getSnapshot().channel).toBe(10);
    expect(window.location.hash).toBe("#ch10");

    // The old scope is gone: its callbacks no longer act.
    void act(() => {
      result = props.host.tune("credits");
    });
    expect(result).toBe(false);
    expect(store.getSnapshot().channel).toBe(10);
  });

  it("powers off through the normal power path, after which tuning is refused", async () => {
    const { store, props } = await tuneToProbe();

    void act(() => {
      props.host.powerOff();
    });
    expect(store.getSnapshot().power).toBe(false);
    let result = true;
    void act(() => {
      result = props.host.tune("status");
    });
    expect(result).toBe(false);
    expect(store.getSnapshot().channel).toBe(2);
  });
});
