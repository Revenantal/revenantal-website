// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { startPageClock } from "./page-clock";
afterEach(() => {
  vi.useRealTimers();
});
describe("shared page clock", () => {
  it("ages on the timer, updates on tab resume and removes both on disposal", () => {
    vi.useFakeTimers();
    const tick = vi.fn();
    const stop = startPageClock(tick);
    expect(tick).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(20_000);
    expect(tick).toHaveBeenCalledTimes(2);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(tick).toHaveBeenCalledTimes(3);
    stop();
    vi.advanceTimersByTime(20_000);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(tick).toHaveBeenCalledTimes(3);
  });
});
