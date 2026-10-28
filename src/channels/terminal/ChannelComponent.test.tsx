// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { channelProps } from "../_shared/testing/fixtures";
import { BOOT_DURATION_MS } from "./boot";
import { ChannelComponent } from "./ChannelComponent";

const SKIP = { name: /click or press enter to skip/i };

/**
 * Props that skip the boot, for tests of the shell itself.
 *
 * @param overrides - Props to replace.
 * @returns Fixture props with reduced motion on.
 */
const shell = (overrides = {}) =>
  channelProps({ reducedMotion: true, ...overrides });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Terminal boot", () => {
  it("shows the boot first, then hands over to the shell", async () => {
    render(<ChannelComponent {...channelProps()} />);
    expect(screen.getByRole("button", SKIP)).toBeTruthy();
    // The shell is hidden from assistive technology until the boot ends.
    expect(screen.queryByRole("log")).toBeNull();

    await act(() => {
      vi.advanceTimersByTime(BOOT_DURATION_MS + 100);
    });
    expect(screen.queryByRole("button", SKIP)).toBeNull();
    expect(screen.getByRole("log")).toBeTruthy();
  });

  it("does not take the keyboard when it ends by itself", async () => {
    render(<ChannelComponent {...channelProps()} />);
    await act(() => {
      vi.advanceTimersByTime(BOOT_DURATION_MS + 100);
    });
    expect(document.activeElement).toBe(document.body);
  });

  it("skips on a click and puts the cursor in the input", async () => {
    render(<ChannelComponent {...channelProps()} />);
    await act(() => {
      fireEvent.click(screen.getByRole("button", SKIP));
    });
    expect(screen.queryByRole("button", SKIP)).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByLabelText("Terminal command"),
    );
  });

  it("skips on Enter, Space or a letter, but not on Tab, Shift or the arrows", async () => {
    render(<ChannelComponent {...channelProps()} />);
    const boot = screen.getByRole("button", SKIP);
    for (const key of ["Tab", "Shift", "ArrowUp", "ArrowLeft"]) {
      await act(() => {
        fireEvent.keyDown(boot, { key });
      });
      expect(screen.queryByRole("button", SKIP)).not.toBeNull();
    }
    await act(() => {
      fireEvent.keyDown(boot, { key: "Enter" });
    });
    expect(screen.queryByRole("button", SKIP)).toBeNull();

    cleanup();
    render(<ChannelComponent {...channelProps()} />);
    await act(() => {
      fireEvent.keyDown(screen.getByRole("button", SKIP), { key: "x" });
    });
    expect(screen.queryByRole("button", SKIP)).toBeNull();
  });

  it("only runs its clock while the channel is active", async () => {
    const props = channelProps({ active: false });
    const { rerender } = render(<ChannelComponent {...props} />);
    await act(() => {
      vi.advanceTimersByTime(BOOT_DURATION_MS * 2);
    });
    expect(screen.queryByRole("button", SKIP)).not.toBeNull();
    expect(vi.getTimerCount()).toBe(0);

    rerender(<ChannelComponent {...props} active />);
    await act(() => {
      vi.advanceTimersByTime(BOOT_DURATION_MS + 100);
    });
    expect(screen.queryByRole("button", SKIP)).toBeNull();
  });

  it("goes straight to the shell with reduced motion", () => {
    render(<ChannelComponent {...shell()} />);
    expect(screen.queryByRole("button", SKIP)).toBeNull();
    expect(screen.getByRole("log")).toBeTruthy();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps every project link in the page during the boot", () => {
    const props = channelProps();
    const { container } = render(<ChannelComponent {...props} />);
    for (const project of props.projects)
      expect(
        container.querySelector(`a[href="${project.url}"]`),
      ).not.toBeNull();
  });
});

describe("Terminal shell", () => {
  it("renders the banner and the project listing", () => {
    const props = shell();
    const { container } = render(<ChannelComponent {...props} />);

    expect(screen.getByText(/revenantal.sh/)).toBeTruthy();
    expect(screen.getByRole("log")).toBeTruthy();
    expect(screen.getByLabelText("Terminal command")).toBeTruthy();
    expect(container.textContent).not.toContain("BIOS");

    for (const project of props.projects) {
      const link = container.querySelector(`a[href="${project.url}"]`);
      expect(link).not.toBeNull();
      expect(link?.getAttribute("target")).toBe("_blank");
      expect(link?.getAttribute("rel")).toContain("noopener");
    }
  });

  it("executes commands on Enter and updates output", async () => {
    render(<ChannelComponent {...shell()} />);
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
    render(<ChannelComponent {...shell()} />);
    const input = screen.getByLabelText<HTMLInputElement>("Terminal command");

    for (const command of ["help", "servers"]) {
      await act(() => {
        fireEvent.input(input, { target: { value: command } });
      });
      await act(() => {
        fireEvent.keyDown(input, { key: "Enter" });
      });
    }

    for (const [key, expected] of [
      ["ArrowUp", "servers"],
      ["ArrowUp", "help"],
      ["ArrowDown", "servers"],
      ["ArrowDown", ""],
    ] as const) {
      await act(() => {
        fireEvent.keyDown(input, { key });
      });
      expect(input.value).toBe(expected);
    }
  });

  it("autocompletes commands and arguments on Tab", async () => {
    const props = shell();
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
    render(<ChannelComponent {...shell()} />);
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
    render(<ChannelComponent {...shell()} />);
    const input = screen.getByLabelText<HTMLInputElement>("Terminal command");
    input.focus();
    expect(document.activeElement).toBe(input);

    await act(() => {
      fireEvent.keyDown(input, { key: "Escape" });
    });
    expect(document.activeElement).not.toBe(input);
  });

  it("puts the cursor in the input when the window is clicked", async () => {
    render(<ChannelComponent {...shell()} />);
    const input = screen.getByLabelText<HTMLInputElement>("Terminal command");
    expect(document.activeElement).not.toBe(input);

    await act(() => {
      fireEvent.click(screen.getByRole("log"));
    });
    expect(document.activeElement).toBe(input);

    input.blur();
    await act(() => {
      fireEvent.click(screen.getByText(/revenantal.sh/));
    });
    expect(document.activeElement).toBe(input);
  });

  it("leaves links alone, and does not interrupt a text selection", async () => {
    const props = shell();
    render(<ChannelComponent {...props} />);
    const input = screen.getByLabelText<HTMLInputElement>("Terminal command");
    const link = document.querySelector("a");
    if (link)
      await act(() => {
        fireEvent.click(link);
      });
    expect(document.activeElement).not.toBe(input);

    vi.spyOn(window, "getSelection").mockReturnValue({
      toString: () => "selected text",
    } as Selection);
    await act(() => {
      fireEvent.click(screen.getByRole("log"));
    });
    expect(document.activeElement).not.toBe(input);
  });

  it("handles live = null and 0 projects without throwing", () => {
    const { container } = render(
      <ChannelComponent
        {...shell({ live: null, projects: [], servers: [] })}
      />,
    );
    expect(container).toBeTruthy();
    expect(screen.getByRole("log")).toBeTruthy();
  });
});

describe("Terminal key sounds", () => {
  const type = async (input: HTMLElement, key: string) => {
    await act(() => {
      fireEvent.keyDown(input, { key });
    });
  };

  it("clicks for letters, thunks for Enter and Space, and knocks for Backspace", async () => {
    const props = shell();
    render(<ChannelComponent {...props} />);
    const input = screen.getByLabelText("Terminal command");
    let now = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => (now += 100));

    await type(input, "a");
    await type(input, "Enter");
    await type(input, " ");
    await type(input, "Backspace");

    const ids = vi.mocked(props.play).mock.calls.map(([id]) => id);
    expect(ids[0]).toMatch(/^key-[1-6]$/);
    expect(ids.slice(1)).toEqual(["enter", "enter", "back"]);
    const options = vi.mocked(props.play).mock.calls[0]?.[1];
    expect(options?.rate).toBeGreaterThanOrEqual(0.95);
    expect(options?.rate).toBeLessThanOrEqual(1.05);
  });

  it("stays quiet for arrows, Escape, shortcuts and an inactive channel", async () => {
    const props = shell();
    const { rerender } = render(<ChannelComponent {...props} />);
    const input = screen.getByLabelText("Terminal command");
    let now = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => (now += 100));

    for (const key of ["ArrowUp", "ArrowDown", "Escape", "Shift"])
      await type(input, key);
    await act(() => {
      fireEvent.keyDown(input, { key: "c", ctrlKey: true });
    });
    expect(props.play).not.toHaveBeenCalled();

    rerender(<ChannelComponent {...props} active={false} />);
    await type(input, "a");
    expect(props.play).not.toHaveBeenCalled();
  });

  it("thins out a held key", async () => {
    const props = shell();
    render(<ChannelComponent {...props} />);
    const input = screen.getByLabelText("Terminal command");
    const clock = vi.spyOn(performance, "now");

    clock.mockReturnValue(1000);
    await type(input, "a");
    clock.mockReturnValue(1010);
    await type(input, "a");
    clock.mockReturnValue(1100);
    await type(input, "a");
    expect(props.play).toHaveBeenCalledTimes(2);
  });

  it("never plays the same click twice in a row", async () => {
    const props = shell();
    render(<ChannelComponent {...props} />);
    const input = screen.getByLabelText("Terminal command");
    let now = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => (now += 100));

    for (let i = 0; i < 40; i += 1) await type(input, "a");
    const ids = vi.mocked(props.play).mock.calls.map(([id]) => id);
    expect(ids).toHaveLength(40);
    ids.slice(1).forEach((id, index) => {
      expect(id).not.toBe(ids[index]);
    });
  });
});
