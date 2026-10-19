// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { channelProps, fixtureProjects } from "../_shared/testing/fixtures";
import { ChannelComponent } from "./ChannelComponent";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("TV Guide", () => {
  it("lists every project as a new-tab link, named for screen readers", () => {
    render(
      <ChannelComponent {...channelProps({ projects: fixtureProjects(3) })} />,
    );
    const link = screen.getByRole("link", {
      name: /^Project 2, status unknown\./,
    });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(
      screen.getAllByRole("link", { name: /opens in a new tab/ }),
    ).toHaveLength(3);
  });

  it("tunes to other channels from the listings through the host", () => {
    const props = channelProps();
    render(<ChannelComponent {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /^CH 10, STATUS:/ }));
    expect(props.host.tune).toHaveBeenCalledWith("status");
  });

  it("shows soft static in the forecast window until weather is available, never a fixed city", () => {
    render(<ChannelComponent {...channelProps()} />);
    const window = screen.getByRole("region", { name: "Local forecast" });
    expect(window.textContent).toContain("Forecast not available");
    expect(window.querySelector("canvas")).not.toBeNull();
  });

  it("drifts the listings only while active and not hovered, and keeps a second copy out of reach", () => {
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "cancelAnimationFrame"],
    });
    const props = channelProps({ projects: fixtureProjects(30) });
    const { container, rerender } = render(<ChannelComponent {...props} />);
    const track =
      container.querySelector<HTMLElement>("[data-copy]")?.parentElement;
    if (!track) throw new Error("no scrolling track");
    void act(() => {
      vi.advanceTimersByTime(1000);
    });
    const moved = track.style.transform;
    expect(moved).toMatch(/translateY\(-\d/);

    const copy = container.querySelector("[data-copy]");
    expect(copy?.getAttribute("aria-hidden")).toBe("true");
    expect(copy?.querySelector("a")?.getAttribute("tabindex")).toBe("-1");

    fireEvent.pointerEnter(screen.getByRole("region", { name: "Listings" }));
    void act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(track.style.transform).toBe(moved);

    fireEvent.pointerLeave(screen.getByRole("region", { name: "Listings" }));
    rerender(<ChannelComponent {...props} active={false} />);
    void act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(track.style.transform).toBe(moved);
  });

  it("holds a still, manually scrollable list for reduced motion", () => {
    const { container } = render(
      <ChannelComponent
        {...channelProps({
          projects: fixtureProjects(30),
          reducedMotion: true,
        })}
      />,
    );
    expect(container.querySelector("[data-copy]")).toBeNull();
    expect(container.firstElementChild?.getAttribute("data-motion")).toBe(
      "reduced",
    );
  });

  it("reads the ticker once to screen readers", () => {
    render(<ChannelComponent {...channelProps()} />);
    expect(screen.getByRole("list", { name: "News" }).textContent).toContain(
      "revenantal has been playing Game 1 lately",
    );
  });
});
