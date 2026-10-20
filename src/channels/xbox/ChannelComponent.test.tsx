// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import { channelProps } from "../_shared/testing/fixtures";
import { ChannelComponent } from "./ChannelComponent";

let play: MockInstance<HTMLMediaElement["play"]>;
let pause: MockInstance<HTMLMediaElement["pause"]>;

beforeEach(() => {
  play = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockImplementation(() => Promise.resolve());
  pause = vi
    .spyOn(HTMLMediaElement.prototype, "pause")
    .mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("XBOX channel", () => {
  it("plays the muted menu loop only while active", () => {
    const props = channelProps();
    const { container, rerender, unmount } = render(
      <ChannelComponent {...props} />,
    );
    const video = container.querySelector("video");
    expect(video?.muted).toBe(true);
    expect(video?.loop).toBe(true);
    expect(video?.getAttribute("poster")).toBe("/assets/xbox/menu.webp");
    expect(
      [...(video?.querySelectorAll("source") ?? [])].map((s) =>
        s.getAttribute("src"),
      ),
    ).toEqual(["/assets/xbox/menu.webm", "/assets/xbox/menu.mp4"]);
    expect(play).toHaveBeenCalledTimes(1);

    rerender(<ChannelComponent {...props} active={false} />);
    expect(pause).toHaveBeenCalled();
    const pauses = pause.mock.calls.length;
    rerender(<ChannelComponent {...props} />);
    expect(play).toHaveBeenCalledTimes(2);
    // Tune-away: the effect cleanup pauses the loop once Preact flushes it.
    void act(() => {
      unmount();
    });
    expect(pause.mock.calls.length).toBeGreaterThan(pauses);
  });

  it("shows the still and plays nothing with reduced motion", () => {
    const { container } = render(
      <ChannelComponent {...channelProps({ reducedMotion: true })} />,
    );
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/assets/xbox/menu.webp",
    );
    expect(play).not.toHaveBeenCalled();
  });

  it("describes itself to screen readers and leaves the notice to the credits", () => {
    const { container } = render(<ChannelComponent {...channelProps()} />);
    expect(
      screen.getByText("Xbox: the Halo main menu with its theme."),
    ).toBeTruthy();
    expect(container.textContent).not.toContain("Microsoft");
    expect(screen.queryByRole("link")).toBeNull();
  });
});
