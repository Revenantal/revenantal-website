// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it } from "vitest";
import { channelProps } from "../_shared/testing/fixtures";
import { ChannelComponent } from "./ChannelComponent";

afterEach(() => {
  cleanup();
});

// Nothing is mocked: jsdom has no WebGL, so the real three.js refuses to start, as it does
// in a browser with 3D switched off.
describe("Revscape without WebGL", () => {
  it("says so and lists every project as a link", async () => {
    const props = channelProps();
    render(<ChannelComponent {...props} />);
    const note = await screen.findByRole("status");
    expect(note.textContent).toMatch(/3D graphics/);
    for (const project of props.projects) {
      const link = screen.getByRole("link", { name: project.name });
      expect(link.getAttribute("href")).toBe(project.url);
      expect(link.getAttribute("target")).toBe("_blank");
    }
  });

  it("never asks for the keyboard", async () => {
    const props = channelProps();
    render(<ChannelComponent {...props} />);
    await screen.findByRole("status");
    expect(props.requestCapture).not.toHaveBeenCalled();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
