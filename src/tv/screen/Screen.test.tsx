// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  ChannelManifest,
  ChannelModule,
  ChannelProps,
} from "@channels/_shared/types";
import { Screen, pictureFilter } from "./Screen";
import type { ScreenProps } from "./Screen";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Test-only channels; nothing here is registered or shipped.
function fixture(
  load: () => Promise<ChannelModule>,
  overrides: Partial<ChannelManifest> = {},
): ChannelManifest {
  return {
    id: "fixture",
    name: "FIXTURE",
    kind: "toy",
    bg: "#102030",
    glow: "rgba(0,0,0,0.5)",
    safe: false,
    load,
    ...overrides,
  };
}

let received: ChannelProps | null = null;
const capture = (props: ChannelProps) => {
  received = props;
};
const Echo: ChannelModule["ChannelComponent"] = (props) => {
  capture(props);
  return <p>channel says hi, active={String(props.active)}</p>;
};

function deferred() {
  let resolve: (module: ChannelModule) => void = () => undefined;
  const promise = new Promise<ChannelModule>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function props(overrides: Partial<ScreenProps> = {}): ScreenProps {
  return {
    power: true,
    shown: 1,
    switching: false,
    visible: true,
    manifest: null,
    broadcast: null,
    props: {
      projects: [],
      servers: [],
      live: null,
      links: { steam: "", github: "", discord: "" },
      credits: [],
      now: new Date("2026-10-19T12:00:00Z"),
      reducedMotion: false,
      volume: 0,
      play: () => undefined,
      setLoop: () => undefined,
      captions: true,
      setCaptions: () => undefined,
      captured: false,
      requestCapture: () => undefined,
      releaseCapture: () => undefined,
      save: { load: () => null, store: () => false, reset: () => false },
    },
    onTune: () => true,
    onPowerOff: () => undefined,
    ...overrides,
  };
}

describe("screen host", () => {
  it("shows NO SIGNAL for an empty slot, static while switching, and nothing when off", () => {
    const { rerender, container } = render(<Screen {...props()} />);
    expect(screen.getByText("NO SIGNAL")).toBeTruthy();

    rerender(<Screen {...props({ switching: true })} />);
    expect(screen.queryByText("NO SIGNAL")).toBeNull();
    expect(container.querySelector("[data-anim='static']")).not.toBeNull();

    rerender(<Screen {...props({ power: false })} />);
    expect(container.textContent).toBe("");
  });

  it("loads the channel lazily and passes every prop with a scoped host", async () => {
    const load = vi.fn(() => Promise.resolve({ ChannelComponent: Echo }));
    const manifest = fixture(load);
    expect(load).not.toHaveBeenCalled();

    render(<Screen {...props({ manifest })} />);
    expect(await screen.findByText(/channel says hi/)).toBeTruthy();
    expect(load).toHaveBeenCalledTimes(1);
    expect(received?.active).toBe(true);
    expect(typeof received?.host.tune).toBe("function");
  });

  it("discards a load that finishes after the viewer tuned away", async () => {
    const late = deferred();
    const first = fixture(() => late.promise, { id: "first" });
    const { rerender } = render(<Screen {...props({ manifest: first })} />);

    rerender(<Screen {...props({ shown: 2, manifest: null })} />);
    await act(async () => {
      late.resolve({ ChannelComponent: Echo });
      await late.promise;
    });
    expect(screen.queryByText(/channel says hi/)).toBeNull();
    expect(screen.getByText("NO SIGNAL")).toBeTruthy();
  });

  it("stops host callbacks once the channel is inactive or its scope ends", async () => {
    const onTune = vi.fn(() => true);
    const onPowerOff = vi.fn();
    const manifest = fixture(() => Promise.resolve({ ChannelComponent: Echo }));
    const { rerender } = render(
      <Screen {...props({ manifest, onTune, onPowerOff })} />,
    );
    await screen.findByText(/channel says hi/);
    const host = received?.host;
    expect(host?.tune("status")).toBe(true);
    expect(onTune).toHaveBeenCalledWith("status");

    rerender(
      <Screen {...props({ manifest, onTune, onPowerOff, visible: false })} />,
    );
    expect(host?.tune("status")).toBe(false);

    rerender(<Screen {...props({ shown: 2, manifest: null, onTune })} />);
    expect(host?.tune("status")).toBe(false);
    host?.powerOff();
    expect(onPowerOff).not.toHaveBeenCalled();
    expect(onTune).toHaveBeenCalledTimes(1);
  });

  it("shows a recoverable error when loading or rendering fails", async () => {
    const load = vi
      .fn<() => Promise<ChannelModule>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ ChannelComponent: Echo });
    render(<Screen {...props({ manifest: fixture(load) })} />);

    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findByText(/channel says hi/)).toBeTruthy();

    cleanup();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const Broken = () => {
      throw new Error("render failed");
    };
    render(
      <Screen
        {...props({
          manifest: fixture(() =>
            Promise.resolve({ ChannelComponent: Broken }),
          ),
        })}
      />,
    );
    expect((await screen.findByRole("alert")).textContent).toContain(
      "FIXTURE is unavailable.",
    );
  });

  it("plays the boot or warm-up, collapses on power off, and distorts while detuned", () => {
    const { container, rerender } = render(
      <Screen {...props({ boot: { kind: "load", key: 0 } })} />,
    );
    expect(container.querySelector("[data-boot='load']")).not.toBeNull();

    rerender(<Screen {...props({ boot: { kind: "warm", key: 1 } })} />);
    expect(container.querySelectorAll("[data-boot='warm']")).toHaveLength(2);

    rerender(<Screen {...props({ detune: 0.5 })} />);
    expect(container.querySelectorAll("canvas")).toHaveLength(2);
    const picture = container.querySelector<HTMLElement>(
      "[data-boot] [data-boot] > div",
    );
    expect(picture?.style.filter).toContain("blur(1.50px)");

    rerender(<Screen {...props({ power: false, offKey: 0 })} />);
    expect(container.textContent).toBe("");
    rerender(<Screen {...props({ power: false, offKey: 1 })} />);
    expect(container.firstElementChild).not.toBeNull();
    expect(screen.queryByText("NO SIGNAL")).toBeNull();
  });

  it("builds the picture filter from bloom and drag distance", () => {
    expect(pictureFilter(true, 0)).toBe("url(#crt-bloom)");
    expect(pictureFilter(false, 0)).toBeUndefined();
    expect(pictureFilter(true, 0.5)).toBe(
      "url(#crt-bloom) blur(1.50px) contrast(0.82)",
    );
  });
});
