// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PanelButton } from "@data/types";
import { PanelButtons, stackLayout } from "./PanelButtons";

const buttons: PanelButton[] = [
  { label: "STEAM", face: "cream", href: "https://example.invalid/steam" },
  { label: "GITHUB", face: "grey", href: "https://example.invalid/github" },
  {
    label: "DISCORD",
    face: "dark",
    action: "copy",
    copyValue: "fixture",
    copiedLabel: "COPIED!",
  },
  { label: "SERVERS", face: "cream", action: "tune", channel: "status" },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("panel buttons", () => {
  it("shrinks four buttons to about 72% to fit the stack", () => {
    expect(stackLayout(2).scale).toBeCloseTo(0.984, 3);
    expect(stackLayout(3).scale).toBeCloseTo(0.974, 3);
    expect(stackLayout(4).scale).toBeCloseTo(0.722, 3);
  });

  it("opens links in a new tab, copies, and tunes by channel ID", async () => {
    const onTune = vi.fn();
    const onAnnounce = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(
      <PanelButtons
        buttons={buttons}
        onTune={onTune}
        onAnnounce={onAnnounce}
      />,
    );

    const steam = screen.getByRole("link", { name: /STEAM/ });
    expect(steam.getAttribute("target")).toBe("_blank");
    expect(steam.getAttribute("rel")).toContain("noopener");

    fireEvent.click(
      screen.getByRole("button", { name: "DISCORD: copy username" }),
    );
    await vi.waitFor(() => {
      expect(screen.getByText("COPIED!")).toBeTruthy();
    });
    expect(writeText).toHaveBeenCalledWith("fixture");
    expect(onAnnounce).toHaveBeenCalledWith("Copied fixture");

    fireEvent.click(
      screen.getByRole("button", { name: "SERVERS: tune to channel" }),
    );
    expect(onTune).toHaveBeenCalledWith("status");
  });

  it("announces the value when copying is blocked", async () => {
    const onAnnounce = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    });
    render(
      <PanelButtons
        buttons={buttons}
        onTune={vi.fn()}
        onAnnounce={onAnnounce}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "DISCORD: copy username" }),
    );
    await vi.waitFor(() => {
      expect(onAnnounce).toHaveBeenCalledWith(
        "Copy failed. The username is fixture",
      );
    });
  });
});
