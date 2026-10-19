// @vitest-environment jsdom
import { render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TvView } from "./TvView";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TV view", () => {
  it("renders the cabinet layers with a page heading and decorative images", () => {
    const { container } = render(<TvView />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "revenantal",
    );
    const sources = [...container.querySelectorAll("img")].map((image) =>
      image.getAttribute("src"),
    );
    expect(sources).toEqual([
      "/assets/tv/frame.webp",
      "/assets/tv/door.webp",
      "/assets/tv/vol.webp",
      "/assets/tv/cap.webp",
      "/assets/tv/knob.webp",
    ]);
    for (const image of container.querySelectorAll("img"))
      expect(image.getAttribute("alt")).toBe("");
    expect(container.textContent).toContain("SOLID STATE · MODEL RV-404");
  });

  it("draws the room photo behind the TV once the window is measured", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1920);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(
      1080,
    );
    const { container } = render(<TvView />);

    const images = [...container.querySelectorAll("img")];
    expect(images[0]?.getAttribute("src")).toBe("/assets/tv/room.webp");
    expect(images[1]?.getAttribute("src")).toBe("/assets/tv/frame.webp");
  });
});
