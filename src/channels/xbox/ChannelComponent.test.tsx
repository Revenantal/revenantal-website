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

  it("carries Microsoft's notice with a link to the rules", () => {
    render(<ChannelComponent {...channelProps()} />);
    const link = screen.getByRole("link", { name: /Game Content Usage Rules/ });
    expect(link.getAttribute("href")).toBe(
      "https://www.xbox.com/en-US/developers/rules",
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    const notice = link.closest("p")?.textContent.replace(/\s+/g, " ");
    expect(notice).toContain("Halo © Microsoft Corporation.");
    expect(notice).toContain(
      "revenantal was created under Microsoft's “Game Content Usage Rules (opens in a new tab)” using assets from Halo, and it is not endorsed by or affiliated with Microsoft.",
    );
    expect(
      screen.getByText("Xbox: the Halo main menu with its theme."),
    ).toBeTruthy();
  });
});
