// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { useRef } from "preact/hooks";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CaptureOverlay, useCaptureFocus } from "./CaptureOverlay";

afterEach(() => {
  cleanup();
});

describe("CaptureOverlay", () => {
  it("shows PRESS START and asks for the keyboard when clicked", () => {
    const onStart = vi.fn();
    render(<CaptureOverlay captured={false} onStart={onStart} />);
    const start = screen.getByRole("button", { name: /press start/i });
    expect(onStart).not.toHaveBeenCalled();
    fireEvent.click(start);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("names the keys and explains how to start", () => {
    render(
      <CaptureOverlay captured={false} onStart={vi.fn()} hint="WASD to move" />,
    );
    expect(screen.getByText("WASD to move")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /press enter or space/i }),
    ).toBeTruthy();
  });

  it("shows the ESC tag and no button once captured, and says so to screen readers", () => {
    render(<CaptureOverlay captured onStart={vi.fn()} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("ESC to release")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toMatch(/press escape/i);
  });
});

describe("useCaptureFocus", () => {
  const Surface = ({ captured }: { captured: boolean }) => {
    const ref = useRef<HTMLDivElement>(null);
    useCaptureFocus(ref, captured);
    return (
      <div ref={ref} tabIndex={-1} data-testid="surface">
        game
      </div>
    );
  };

  it("focuses the game surface when the keyboard is captured, and not before", () => {
    const { rerender } = render(<Surface captured={false} />);
    expect(document.activeElement).not.toBe(screen.getByTestId("surface"));
    rerender(<Surface captured />);
    expect(document.activeElement).toBe(screen.getByTestId("surface"));
  });
});
