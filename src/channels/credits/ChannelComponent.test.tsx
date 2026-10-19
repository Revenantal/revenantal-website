// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Credit } from "../../data/types";
import { channelProps } from "../_shared/testing/fixtures";
import type { ChannelProps } from "../_shared/types";
import { ChannelComponent } from "./ChannelComponent";
import { REWIND_MS, START, STATIC_MS } from "./roll";

const credit = (
  title: string,
  department: string,
  extra: Partial<Credit> = {},
): Credit => ({
  title,
  department,
  author: `${title} author`,
  url: `https://example.invalid/${title}`,
  license: "CC0 1.0",
  usedFor: `${title} use`,
  ...extra,
});

const CREDITS = [
  credit("Hum", "Sound Department"),
  credit("Cabinet", "Art Department", { edits: "cut into sprites" }),
  credit("Click", "Sound Department"),
];

function show(overrides: Partial<ChannelProps> = {}) {
  const props = channelProps({ credits: CREDITS, ...overrides });
  const view = render(<ChannelComponent {...props} />);
  const track = () =>
    screen.getByRole("region", { name: "Credits" })
      .firstElementChild as HTMLElement;
  return { ...view, props, track };
}

function rolled(track: HTMLElement): number {
  const match = /translate3d\(0, (-?[\d.]+)px, 0\)/.exec(track.style.transform);
  return START - Number(match?.[1] ?? Number.NaN);
}

function wait(ms: number) {
  void act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "performance",
    ],
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Credits channel", () => {
  it("groups credits by department in content order, with every source link", () => {
    show();
    expect(
      screen.getByRole("heading", { level: 2, name: "REVENANTAL" }),
    ).toBeTruthy();
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent),
    ).toEqual(["Sound Department", "Art Department"]);
    const sound = screen.getByRole("region", { name: "Sound Department" });
    expect(
      [...sound.querySelectorAll("a")].map((link) => link.textContent),
    ).toEqual(["Hum (opens in a new tab)", "Click (opens in a new tab)"]);
    for (const entry of CREDITS) {
      const link = screen.getByRole("link", { name: new RegExp(entry.title) });
      expect(link.getAttribute("href")).toBe(entry.url);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
    }
    expect(screen.getByText("CC0 1.0 · cut into sprites")).toBeTruthy();
    expect(screen.getByText("Created by").nextElementSibling?.textContent).toBe(
      "revenantal",
    );
  });

  it("rolls upward while active and holds still while inactive", () => {
    const { track, rerender, props } = show();
    expect(rolled(track())).toBe(0);
    wait(1000);
    const moved = rolled(track());
    expect(moved).toBeGreaterThan(20);
    rerender(<ChannelComponent {...props} active={false} />);
    wait(2000);
    expect(rolled(track())).toBe(moved);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("pauses and plays, and rewinds to the top keeping a deliberate pause", () => {
    const { track, container } = show();
    wait(1000);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(container.textContent).toContain("❚❚ PAUSE");
    const held = rolled(track());
    wait(1000);
    expect(rolled(track())).toBe(held);
    fireEvent.click(screen.getByRole("button", { name: "Rewind" }));
    expect(container.textContent).toContain("◀◀ REW");
    wait(REWIND_MS + 200);
    expect(rolled(track())).toBe(0);
    wait(1000);
    expect(rolled(track())).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    wait(1000);
    expect(rolled(track())).toBeGreaterThan(0);
    expect(container.textContent).not.toContain("PAUSE ");
  });

  it("winds back over time rather than jumping", () => {
    const { track } = show();
    wait(60_000);
    const from = rolled(track());
    fireEvent.click(screen.getByRole("button", { name: "Rewind" }));
    wait(REWIND_MS / 2);
    const midway = rolled(track());
    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(from);
    wait(REWIND_MS);
    expect(rolled(track())).toBeLessThan(40);
  });

  it("shows the VCR bar while the pointer moves and hides it two seconds after", () => {
    const { rerender, props } = show();
    const bar = screen.getByRole("button", { name: "Pause" })
      .parentElement as HTMLElement;
    const root = screen.getByRole("region", { name: "Credits" })
      .parentElement as HTMLElement;
    expect(bar.hasAttribute("data-shown")).toBe(false);
    fireEvent.pointerMove(root);
    expect(bar.hasAttribute("data-shown")).toBe(true);
    wait(1500);
    fireEvent.pointerMove(root);
    wait(1500);
    expect(bar.hasAttribute("data-shown")).toBe(true);
    wait(600);
    expect(bar.hasAttribute("data-shown")).toBe(false);

    fireEvent.pointerMove(root);
    rerender(<ChannelComponent {...props} active={false} />);
    expect(bar.hasAttribute("data-shown")).toBe(false);
    fireEvent.pointerMove(root);
    expect(bar.hasAttribute("data-shown")).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("pauses on hover without overriding a deliberate pause", () => {
    const { track } = show();
    const region = screen.getByRole("region", { name: "Credits" });
    fireEvent.pointerEnter(region);
    wait(1000);
    expect(rolled(track())).toBe(0);
    fireEvent.pointerLeave(region);
    wait(500);
    expect(rolled(track())).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    fireEvent.pointerEnter(region);
    fireEvent.pointerLeave(region);
    const held = rolled(track());
    wait(1000);
    expect(rolled(track())).toBe(held);
  });

  it("pauses while a link has focus and resumes when focus leaves", () => {
    const { track } = show();
    const link = screen.getByRole("link", { name: /Hum/ });
    void act(() => {
      link.focus();
    });
    const held = rolled(track());
    wait(1000);
    expect(rolled(track())).toBe(held);
    void act(() => {
      screen.getByRole("button", { name: "Pause" }).focus();
    });
    wait(500);
    expect(rolled(track())).toBeGreaterThan(held);
  });

  it("cuts to static after the last line and starts again", () => {
    const { track, container } = show();
    Object.defineProperty(track(), "offsetHeight", { value: 100 });
    wait(((START + 100) / 36) * 1000 + 200);
    expect(container.querySelector("canvas")).not.toBeNull();
    wait(STATIC_MS);
    expect(container.querySelector("canvas")).toBeNull();
    expect(rolled(track())).toBeLessThan(5);
  });

  it("shows a static list with reduced motion", () => {
    const { container } = show({ reducedMotion: true });
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("region", { name: "Credits" })).toBeNull();
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.hasAttribute("data-focus-first")).toBe(true);
    expect(screen.getAllByRole("link")).toHaveLength(CREDITS.length);
    expect(container.querySelector("[style*='transform']")).toBeNull();
    wait(2000);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("marks Pause as the first focus target in the roll", () => {
    show();
    expect(
      screen
        .getByRole("button", { name: "Pause" })
        .hasAttribute("data-focus-first"),
    ).toBe(true);
  });

  it("fades the music out on PAUSE and plays it fast while rewinding", () => {
    const { props } = show();
    const loop = vi.mocked(props.setLoop);
    expect(loop).toHaveBeenLastCalledWith("music", true, { gain: 1, rate: 1 });
    wait(5000);
    fireEvent.click(screen.getByRole("button", { name: "Rewind" }));
    expect(loop).toHaveBeenLastCalledWith("music", true, {
      gain: 0.6,
      rate: 2,
    });
    wait(2000);
    expect(loop).toHaveBeenLastCalledWith("music", true, { gain: 1, rate: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(loop).toHaveBeenLastCalledWith("music", true, { gain: 0, rate: 1 });
    // A hover pause leaves the music alone.
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    const calls = loop.mock.calls.length;
    fireEvent.pointerEnter(screen.getByRole("region", { name: "Credits" }));
    expect(loop.mock.calls.length).toBe(calls);
  });

  it("says so when there are no credits", () => {
    show({ credits: [] });
    expect(screen.getByText("No credits yet.")).toBeTruthy();
    expect(screen.getByText("revenantal.com")).toBeTruthy();
  });
});
