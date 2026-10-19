// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStore } from "@data/store";
import { useSyncExternalStore } from "preact/compat";
import { SLOT_COUNT } from "./lineup";
import { TvView } from "./TvView";

// The stage stays hidden until the window is measured, so give jsdom a window size.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1920);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(1080);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function ConnectedTv({ store }: { store: ReturnType<typeof createStore> }) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return <TvView snapshot={snapshot} actions={store} />;
}

function renderTv() {
  const store = createStore({ positionCount: SLOT_COUNT });
  const result = render(<ConnectedTv store={store} />);
  return { store, ...result };
}

describe("TV view", () => {
  it("renders the room, cabinet and controls with decorative images", () => {
    const { container } = renderTv();

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "revenantal",
    );
    const sources = [...container.querySelectorAll("img")].map((image) =>
      image.getAttribute("src"),
    );
    expect(sources).toEqual([
      "/assets/tv/room.webp",
      "/assets/tv/frame.webp",
      "/assets/tv/knob.webp",
      "/assets/tv/vol.webp",
      "/assets/tv/cap.webp",
      "/assets/tv/door.webp",
    ]);
    for (const image of container.querySelectorAll("img")) {
      expect(image.getAttribute("alt")).toBe("");
      expect(image.draggable).toBe(false);
    }
    expect(container.textContent).toContain("SOLID STATE · MODEL RV-404");
  });

  it("keeps the stage hidden until the window is measured", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(0);
    const { container } = renderTv();

    expect(container.querySelector("img[src$='room.webp']")).toBeNull();
    expect(screen.queryByRole("button", { name: /Channel dial/ })).toBeNull();
  });

  it("tunes forward on click, wrapping after the last slot, and announces it", () => {
    const { store } = renderTv();
    const dial = screen.getByRole("button", { name: /Channel dial/ });

    fireEvent.click(dial);
    expect(store.getSnapshot().channel).toBe(2);
    expect(dial.getAttribute("aria-label")).toContain("CH 02, NO SIGNAL");
    expect(screen.getByText("CH 02, NO SIGNAL")).toBeTruthy();

    void act(() => {
      store.setChannel(SLOT_COUNT);
    });
    fireEvent.click(screen.getByRole("button", { name: /Channel dial/ }));
    expect(store.getSnapshot().channel).toBe(1);
  });

  it("scrolls one slot at a time, throttled", () => {
    const { store } = renderTv();
    const dial = screen.getByRole("button", { name: /Channel dial/ });
    const wheel = (deltaY: number, timeStamp: number) => {
      const event = new WheelEvent("wheel", {
        deltaY,
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, "timeStamp", { value: timeStamp });
      fireEvent(dial, event);
    };

    wheel(100, 1000);
    wheel(100, 1050);
    expect(store.getSnapshot().channel).toBe(2);
    wheel(-100, 1300);
    expect(store.getSnapshot().channel).toBe(1);
  });

  it("changes channel with arrow keys and volume with +/−, but not inside the slider", () => {
    const { store } = renderTv();

    fireEvent.keyDown(document.body, { key: "ArrowLeft" });
    expect(store.getSnapshot().channel).toBe(SLOT_COUNT);
    fireEvent.keyDown(document.body, { key: "+" });
    expect(store.getSnapshot().settings.volume).toBe(6);

    const slider = screen.getByRole("slider", { name: "Volume" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(store.getSnapshot().settings.volume).toBe(7);
    expect(store.getSnapshot().channel).toBe(SLOT_COUNT);
    fireEvent.keyDown(slider, { key: "Home" });
    expect(slider.getAttribute("aria-valuetext")).toBe("Muted");
  });

  it("ignores channel changes while the TV is off", () => {
    const { store } = renderTv();
    void act(() => {
      store.setPower(false);
    });

    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(store.getSnapshot().channel).toBe(1);
  });

  it("sets volume from the left or right half of the knob", () => {
    const { store } = renderTv();
    const slider = screen.getByRole("slider", { name: "Volume" });
    vi.spyOn(slider, "getBoundingClientRect").mockReturnValue({
      left: 0,
      width: 100,
    } as DOMRect);

    fireEvent.click(slider, { clientX: 10 });
    expect(store.getSnapshot().settings.volume).toBe(4);
    fireEvent.click(slider, { clientX: 90 });
    expect(store.getSnapshot().settings.volume).toBe(5);
  });

  it("turns volume by dragging round the knob, 27° per step, from where it was grabbed", () => {
    const { store } = renderTv();
    const slider = screen.getByRole("slider", { name: "Volume" });
    vi.spyOn(slider, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    } as DOMRect);
    Object.assign(slider, { setPointerCapture: vi.fn() });

    fireEvent.pointerDown(slider, { clientX: 50, clientY: 10, pointerId: 1 });
    fireEvent.pointerMove(slider, { clientX: 90, clientY: 50, pointerId: 1 });
    expect(store.getSnapshot().settings.volume).toBe(8);
    fireEvent.pointerMove(slider, { clientX: 50, clientY: 90, pointerId: 1 });
    expect(store.getSnapshot().settings.volume).toBe(10);
    fireEvent.pointerMove(slider, { clientX: 10, clientY: 50, pointerId: 1 });
    expect(store.getSnapshot().settings.volume).toBe(10);
    fireEvent.pointerUp(slider, { pointerId: 1 });
  });

  it("cancels drags that start anywhere on the TV", () => {
    const { container } = renderTv();
    const frame = container.querySelector("img[src$='frame.webp']");
    expect(frame).not.toBeNull();
    expect(fireEvent.dragStart(frame as Element)).toBe(false);
  });

  it("powers off and on from the LED, darkening the tube and blocking tuning", () => {
    const { store } = renderTv();
    const power = screen.getByRole("button", { name: "Power" });
    expect(power.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(power);
    expect(store.getSnapshot().power).toBe(false);
    expect(power.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("TV off")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Channel dial/ }));
    expect(store.getSnapshot().channel).toBe(1);

    fireEvent.click(power);
    expect(store.getSnapshot().power).toBe(true);
  });

  it("opens the door to reveal the switches, and closes it again", () => {
    const { store } = renderTv();
    const door = screen.getByRole("button", { name: "Settings door" });
    expect(door.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: /Scanlines/ })).toBeNull();

    fireEvent.click(door);
    expect(store.getSnapshot().door).toBe(true);
    const scan = screen.getByRole("button", { name: "SCAN: Scanlines, ON" });
    fireEvent.click(scan);
    expect(store.getSnapshot().settings.scan).toBe(false);
    expect(
      screen.getByRole("button", { name: "SCAN: Scanlines, OFF" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /^GLOW: Room glow, ON, limited/ }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Settings door" }));
    expect(store.getSnapshot().door).toBe(false);
  });

  it("closes the door and tunes to Credits from the CRD button", () => {
    const { store } = renderTv();
    fireEvent.click(screen.getByRole("button", { name: "Settings door" }));

    fireEvent.click(screen.getByRole("button", { name: "CRD: Credits" }));
    expect(store.getSnapshot().door).toBe(false);
    expect(store.getSnapshot().channel).toBe(11);
    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Settings door",
    );
  });

  it("shows the note after a moment and drops it when clicked", () => {
    vi.useFakeTimers();
    renderTv();
    expect(screen.queryByRole("note")).toBeNull();

    void act(() => {
      vi.advanceTimersByTime(1600);
    });
    const note = screen.getByRole("button", { name: /Tip: turn the dial/ });
    expect(screen.getByText("CH 01")).toBeTruthy();

    fireEvent.click(note);
    void act(() => {
      vi.advanceTimersByTime(1400);
    });
    expect(screen.queryByRole("note")).toBeNull();
    vi.useRealTimers();
  });

  it("dismisses the note on the first channel change, and shows it again on the next page load", () => {
    vi.useFakeTimers();
    const { store } = renderTv();
    void act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(screen.getByRole("note")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Channel dial/ }));
    expect(store.getSnapshot().hintDismissed).toBe(true);
    cleanup();

    renderTv();
    void act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(screen.getByRole("note")).toBeTruthy();
    vi.useRealTimers();
  });
});
