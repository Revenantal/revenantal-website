// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dial } from "./Dial";

afterEach(() => {
  cleanup();
});

function renderDial(position: number, slots: number) {
  const onTune = vi.fn();
  const view = render(
    <Dial position={position} slots={slots} label="CH" onTune={onTune} />,
  );
  return { onTune, view };
}

describe("dial with a lineup past twelve slots", () => {
  it("steps through a 14-slot dial and wraps at both ends", () => {
    const { onTune, view } = renderDial(13, 14);
    const dial = screen.getByRole("button", { name: /Channel dial/ });

    fireEvent.click(dial);
    expect(onTune).toHaveBeenLastCalledWith(14);

    view.rerender(<Dial position={14} slots={14} label="CH" onTune={onTune} />);
    fireEvent.click(dial);
    expect(onTune).toHaveBeenLastCalledWith(1);

    view.rerender(<Dial position={1} slots={14} label="CH" onTune={onTune} />);
    fireEvent.wheel(dial, { deltaY: -100 });
    expect(onTune).toHaveBeenLastCalledWith(14);
  });

  it("turns the knob by one 14-slot detent per step and renders no numerals", () => {
    const { view } = renderDial(1, 14);
    const knob = view.container.querySelector("img");
    const before = knob?.style.transform;

    view.rerender(<Dial position={2} slots={14} label="CH" onTune={vi.fn()} />);
    const angle = (transform: string | undefined) =>
      Number(/rotate\((-?[\d.]+)deg\)/.exec(transform ?? "")?.[1]);
    expect(angle(knob?.style.transform) - angle(before)).toBeCloseTo(
      360 / 14,
      1,
    );
    expect(view.container.textContent).not.toMatch(/\d/);
  });

  it("still steps on the next tap after a touch drag, which ends without a click", () => {
    const { onTune } = renderDial(1, 14);
    const dial = screen.getByRole("button", { name: /Channel dial/ });
    vi.spyOn(dial, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    } as DOMRect);
    Object.assign(dial, { setPointerCapture: vi.fn() });

    fireEvent.pointerDown(dial, { clientX: 50, clientY: 10, pointerId: 1 });
    fireEvent.pointerMove(dial, { clientX: 90, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(dial, { pointerId: 1 });
    onTune.mockClear();

    fireEvent.pointerDown(dial, { clientX: 50, clientY: 50, pointerId: 2 });
    fireEvent.pointerUp(dial, { pointerId: 2 });
    fireEvent.click(dial);
    expect(onTune).toHaveBeenCalledWith(2);
  });
});
