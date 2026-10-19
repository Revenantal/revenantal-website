// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePerfMonitor } from "./perf-monitor";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function Harness(props: {
  active: boolean;
  perf: number;
  setPerf: (perf: number) => void;
}) {
  usePerfMonitor(props.active, props.perf, props.setPerf);
  return null;
}

// Drive requestAnimationFrame with a fixed frame time.
function frameClock(frameMs: number) {
  let now = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    window.setTimeout(() => {
      now += frameMs;
      callback(now);
    }, frameMs),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    window.clearTimeout(id);
  });
}

describe("performance fallback", () => {
  it("steps down when the picture runs under 42 fps", () => {
    vi.useFakeTimers();
    frameClock(40);
    const setPerf = vi.fn();
    render(<Harness active perf={0} setPerf={setPerf} />);
    vi.advanceTimersByTime(1200 + 1600);
    expect(setPerf).toHaveBeenCalledWith(1);
  });

  it("stays put at 60 fps, while inactive, and at the lowest level", () => {
    vi.useFakeTimers();
    frameClock(16);
    const setPerf = vi.fn();
    render(<Harness active perf={0} setPerf={setPerf} />);
    vi.advanceTimersByTime(3000);
    cleanup();
    frameClock(40);
    render(<Harness active={false} perf={0} setPerf={setPerf} />);
    vi.advanceTimersByTime(3000);
    cleanup();
    render(<Harness active perf={2} setPerf={setPerf} />);
    vi.advanceTimersByTime(3000);
    expect(setPerf).not.toHaveBeenCalled();
  });
});
