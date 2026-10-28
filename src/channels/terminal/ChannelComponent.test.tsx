// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { channelProps } from "../_shared/testing/fixtures";
import { ChannelComponent } from "./ChannelComponent";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Terminal ChannelComponent", () => {
  it("renders BIOS boot, logo banner, and initial projects listing", () => {
    const props = channelProps();
    const { container } = render(<ChannelComponent {...props} />);

    expect(screen.getByText(/REVENANTAL BIOS v4.04/)).toBeTruthy();
    expect(screen.getByText(/revenantal.sh/)).toBeTruthy();
    expect(screen.getByRole("log")).toBeTruthy();

    const input = screen.getByLabelText("Terminal command");
    expect(input).toBeTruthy();

    for (const project of props.projects) {
      const link = container.querySelector(`a[href="${project.url}"]`);
      expect(link).not.toBeNull();
      expect(link?.getAttribute("target")).toBe("_blank");
      expect(link?.getAttribute("rel")).toContain("noopener");
    }
  });

  it("executes commands on Enter and updates output", async () => {
    const props = channelProps();
    render(<ChannelComponent {...props} />);

    const input = screen.getByLabelText<HTMLInputElement>("Terminal command");

    await act(() => {
      fireEvent.input(input, { target: { value: "help" } });
    });
    await act(() => {
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(screen.getByText("Available commands:")).toBeTruthy();
    expect(screen.getByText(/List projects, servers, and files/)).toBeTruthy();
  });

  it("supports command history via ArrowUp and ArrowDown", async () => {
    const props = channelProps();
    render(<ChannelComponent {...props} />);

    const input = screen.getByLabelText<HTMLInputElement>("Terminal command");

    await act(() => {
      fireEvent.input(input, { target: { value: "help" } });
    });
    await act(() => {
      fireEvent.keyDown(input, { key: "Enter" });
    });
    await act(() => {
      fireEvent.input(input, { target: { value: "servers" } });
    });
    await act(() => {
      fireEvent.keyDown(input, { key: "Enter" });
    });

    await act(() => {
      fireEvent.keyDown(input, { key: "ArrowUp" });
    });
    expect(input.value).toBe("servers");

    await act(() => {
      fireEvent.keyDown(input, { key: "ArrowUp" });
    });
    expect(input.value).toBe("help");

    await act(() => {
      fireEvent.keyDown(input, { key: "ArrowDown" });
    });
    expect(input.value).toBe("servers");

    await act(() => {
      fireEvent.keyDown(input, { key: "ArrowDown" });
    });
    expect(input.value).toBe("");
  });

  it("autocompletes commands and arguments on Tab", async () => {
    const props = channelProps();
    render(<ChannelComponent {...props} />);

    const input = screen.getByLabelText<HTMLInputElement>("Terminal command");

    await act(() => {
      fireEvent.input(input, { target: { value: "ser" } });
    });
    await act(() => {
      fireEvent.keyDown(input, { key: "Tab" });
    });
    expect(input.value).toBe("servers ");

    const p = props.projects[0];
    if (p) {
      await act(() => {
        fireEvent.input(input, {
          target: { value: `open ${p.id.slice(0, 3)}` },
        });
      });
      await act(() => {
        fireEvent.keyDown(input, { key: "Tab" });
      });
      expect(input.value).toBe(`open ${p.id}`);
    }
  });

  it("stops key event propagation to protect TV dial", () => {
    const props = channelProps();
    render(<ChannelComponent {...props} />);

    const input = screen.getByLabelText("Terminal command");
    const event = new KeyboardEvent("keydown", {
      key: "ArrowLeft",
      bubbles: true,
    });
    const spy = vi.spyOn(event, "stopPropagation");

    input.dispatchEvent(event);
    expect(spy).toHaveBeenCalled();
  });

  it("blurs input on Escape", async () => {
    const props = channelProps();
    render(<ChannelComponent {...props} />);

    const input = screen.getByLabelText<HTMLInputElement>("Terminal command");
    input.focus();
    expect(document.activeElement).toBe(input);

    await act(() => {
      fireEvent.keyDown(input, { key: "Escape" });
    });
    expect(document.activeElement).not.toBe(input);
  });

  it("runs commands via bottom chips", async () => {
    const props = channelProps();
    render(<ChannelComponent {...props} />);

    const helpChip = screen.getByRole("button", { name: "help" });
    await act(() => {
      fireEvent.click(helpChip);
    });
    expect(screen.getByText("Available commands:")).toBeTruthy();

    const serversChip = screen.getByRole("button", { name: "servers" });
    await act(() => {
      fireEvent.click(serversChip);
    });
    expect(screen.getByText(/PLAYERS/)).toBeTruthy();
  });

  it("handles live = null and 0 projects without throwing", () => {
    const emptyProps = channelProps({ live: null, projects: [], servers: [] });
    const { container } = render(<ChannelComponent {...emptyProps} />);
    expect(container).toBeTruthy();
    expect(screen.getByRole("log")).toBeTruthy();
  });
});
