// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  STALE_LIVE,
  channelProps,
  fixtureProjects,
} from "../_shared/testing/fixtures";
import type { ChannelProps } from "../_shared/types";
import { ChannelComponent } from "./ChannelComponent";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const up = (props: Partial<ChannelProps> = {}) => {
  const projects = fixtureProjects(2).map((project, index) => ({
    ...project,
    status: index === 0 ? ("up" as const) : ("slow" as const),
  }));
  return channelProps({ projects, ...props });
};

describe("Status channel", () => {
  it("names every project and server for screen readers", () => {
    render(<ChannelComponent {...up()} />);
    expect(
      screen.getByRole("link", { name: /^Project 1, up, 120 milliseconds\./ }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /^Project 2, slow\./ })
        .getAttribute("target"),
    ).toBe("_blank");
    expect(
      screen.getByRole("button", {
        name: "Server 1, minecraft, running, 3 of 20 players, up 1 day. Press to copy the address 203.0.113.10:25565",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: /^Server 2, factorio, offline\. No public address$/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /PROJECTS: 2\/2 UP, checked/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /GAME SERVERS: 3 PLAYERS, checked/ }),
    ).toBeTruthy();
  });

  it("selects on the first click and opens on the second; keyboard Enter opens at once", () => {
    render(<ChannelComponent {...up()} />);
    const link = screen.getByRole("link", { name: /^Project 1/ });

    fireEvent.pointerDown(link);
    fireEvent.focus(link);
    const first = fireEvent.click(link, { detail: 1 });
    expect(first).toBe(false);
    expect(link.getAttribute("data-selected")).toBe("true");

    fireEvent.pointerDown(link);
    expect(fireEvent.click(link, { detail: 1 })).toBe(true);
    expect(fireEvent.click(link, { detail: 0 })).toBe(true);
  });

  it("copies a published address and announces it, or announces it when copying fails", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<ChannelComponent {...up()} />);
    const button = screen.getByRole("button", { name: /^Server 1/ });

    fireEvent.focus(button);
    fireEvent.click(button, { detail: 0 });
    expect(writeText).toHaveBeenCalledWith("203.0.113.10:25565");
    expect(
      await screen.findByText("Address copied: 203.0.113.10:25565"),
    ).toBeTruthy();

    writeText.mockImplementationOnce(() => Promise.reject(new Error("denied")));
    fireEvent.click(button, { detail: 0 });
    expect(
      await screen.findByText("Copy failed. The address is 203.0.113.10:25565"),
    ).toBeTruthy();

    writeText.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /^Server 2/ }), {
      detail: 0,
    });
    expect(writeText).not.toHaveBeenCalled();
  });

  it("shows stale and missing data as unknown, never as down, with no player totals", () => {
    const { container, rerender } = render(
      <ChannelComponent
        {...channelProps({ live: STALE_LIVE, projects: fixtureProjects(1) })}
      />,
    );
    expect(
      screen.getByRole("link", { name: /^Project 1, status unknown\./ }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: /^Server 1, minecraft, status unknown, sample 3 h old\./,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: /PROJECTS: NO STATUS, STALE · 3 h old/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /GAME SERVERS: -- PLAYERS, STALE/ }),
    ).toBeTruthy();
    expect(container.textContent).not.toMatch(/DOWN/);
    expect(container.textContent).not.toMatch(/PLAYERS ONLINE/);

    rerender(
      <ChannelComponent {...channelProps({ live: null, projects: [] })} />,
    );
    expect(
      screen.getByRole("heading", {
        name: /GAME SERVERS: -- PLAYERS, NO DATA/,
      }),
    ).toBeTruthy();
    expect(container.textContent).toContain("00 UNITS");
    expect(container.textContent).toContain("no snapshot");
  });

  it("shows no player total while a running server reports no count", () => {
    const props = up();
    render(
      <ChannelComponent
        {...props}
        servers={[
          { id: "f", name: "Factory", game: "factorio", state: "running" },
          { id: "p", name: "Pix", game: "minecraft", state: "offline" },
        ]}
      />,
    );
    expect(
      screen.getByRole("heading", {
        name: /GAME SERVERS: -- PLAYERS, checked/,
      }),
    ).toBeTruthy();
    cleanup();
    render(
      <ChannelComponent
        {...props}
        servers={[
          { id: "p", name: "Pix", game: "minecraft", state: "offline" },
        ]}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /GAME SERVERS: 0 PLAYERS, checked/ }),
    ).toBeTruthy();
  });

  it("shows the local time and snapshot age, never a poll countdown", () => {
    const { container } = render(<ChannelComponent {...up()} />);
    expect(container.textContent).toMatch(/snapshot under a minute old/);
    expect(container.textContent).not.toMatch(/poll/i);
  });
});
