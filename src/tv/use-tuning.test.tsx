// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChannelManifest } from "@channels/_shared/types";
import { STATIC_MS, useTuning } from "./use-tuning";
import type { Tuning } from "./use-tuning";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const cut: ChannelManifest = {
  id: "cut",
  name: "CUT",
  kind: "toy",
  bg: "#000000",
  glow: "rgba(0,0,0,0)",
  safe: false,
  display: { transition: "cut" },
  load: () => Promise.reject(new Error("unused")),
};
const manifestAt = (position: number) => (position === 3 ? cut : null);

let latest: Tuning = { shown: 0, switching: false };
const capture = (tuning: Tuning) => {
  latest = tuning;
};
function Harness(props: { channel: number; fx: boolean; power: boolean }) {
  capture(useTuning(props.channel, props.fx, props.power, manifestAt));
  return null;
}

describe("tuning", () => {
  it("plays 460 ms of static before showing a static-transition channel", () => {
    vi.useFakeTimers();
    const { rerender } = render(<Harness channel={1} fx power />);
    rerender(<Harness channel={2} fx power />);
    expect(latest).toEqual({ shown: 1, switching: true });

    void act(() => {
      vi.advanceTimersByTime(STATIC_MS);
    });
    expect(latest).toEqual({ shown: 2, switching: false });
  });

  it("cuts straight to a cut-transition channel, and to anything with FX off", () => {
    const { rerender } = render(<Harness channel={1} fx power />);
    rerender(<Harness channel={3} fx power />);
    expect(latest).toEqual({ shown: 3, switching: false });

    rerender(<Harness channel={4} fx={false} power />);
    expect(latest).toEqual({ shown: 4, switching: false });
  });

  it("lets a newer tune replace a pending one, and power off drops it", () => {
    vi.useFakeTimers();
    const { rerender } = render(<Harness channel={1} fx power />);
    rerender(<Harness channel={2} fx power />);
    rerender(<Harness channel={4} fx power />);
    void act(() => {
      vi.advanceTimersByTime(STATIC_MS);
    });
    expect(latest).toEqual({ shown: 4, switching: false });

    rerender(<Harness channel={5} fx power />);
    rerender(<Harness channel={5} fx power={false} />);
    expect(latest).toEqual({ shown: 5, switching: false });
  });
});
