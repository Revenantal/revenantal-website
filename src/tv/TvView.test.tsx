// @vitest-environment jsdom
import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { TvView } from "./TvView";

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
});
