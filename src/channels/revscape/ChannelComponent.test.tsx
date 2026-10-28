// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { channelProps, fixtureProjects } from "../_shared/testing/fixtures";
import type { CameraState } from "./camera";
import { DIST_MIN, START } from "./camera";
import { ChannelComponent } from "./ChannelComponent";

// A fake 3D view: WebGL does not exist in jsdom, and the camera maths is tested on its own.
const scene = vi.hoisted(() => ({
  create: vi.fn(),
  render: vi.fn(),
  dispose: vi.fn(),
  lost: null as null | (() => void),
}));
vi.mock("./scene", () => ({
  VIEW: { width: 512, height: 384 },
  createScene: (
    _canvas: HTMLCanvasElement,
    chunks: unknown[],
    onLost: () => void,
  ) => {
    scene.create(chunks);
    scene.lost = onLost;
    return {
      render: scene.render,
      dispose: scene.dispose,
      stats: () => ({ triangles: 1200, calls: 9 }),
    };
  },
}));

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"],
  });
});

afterEach(() => {
  // Unmount inside act and run the framework's deferred cleanup before real timers return,
  // so it cannot fire during the next test.
  void act(() => {
    cleanup();
    vi.advanceTimersByTime(200);
  });
  vi.useRealTimers();
  scene.create.mockReset();
  scene.render.mockReset();
  scene.dispose.mockReset();
  scene.lost = null;
});

const frames = (count = 1) => {
  void act(() => {
    for (let i = 0; i < count; i += 1) vi.advanceTimersByTime(17);
  });
};

const lastCamera = (): CameraState => {
  const call = scene.render.mock.calls.at(-1);
  if (!call) throw new Error("nothing was drawn");
  return call[0] as CameraState;
};

const canvas = () =>
  document.querySelector<HTMLCanvasElement>("canvas") as HTMLCanvasElement;

describe("Revscape look-around", () => {
  it("draws the town on the first frame and lists the project links", () => {
    const props = channelProps();
    render(<ChannelComponent {...props} />);
    expect(scene.create).toHaveBeenCalledTimes(1);
    frames();
    expect(scene.render).toHaveBeenCalled();
    expect(lastCamera()).toEqual(START);
    for (const project of props.projects)
      expect(screen.getByRole("link", { name: project.name })).toBeTruthy();
  });

  it("stops drawing once the camera has settled", () => {
    render(<ChannelComponent {...channelProps()} />);
    frames();
    const drawn = scene.render.mock.calls.length;
    frames(10);
    expect(scene.render.mock.calls.length).toBe(drawn);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("zooms with the wheel and glides there", () => {
    render(<ChannelComponent {...channelProps()} />);
    frames();
    fireEvent.wheel(canvas(), { deltaY: 300 });
    frames(120);
    expect(lastCamera().dist).toBeCloseTo(START.dist + 3, 1);
    fireEvent.wheel(canvas(), { deltaY: -10000 });
    frames(120);
    expect(lastCamera().dist).toBeCloseTo(DIST_MIN, 1);
  });

  it("turns and tilts when dragged, within the pitch limits", () => {
    render(<ChannelComponent {...channelProps()} />);
    frames();
    const view = canvas();
    fireEvent.pointerDown(view, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(view, { clientX: 140, clientY: 100, pointerId: 1 });
    frames(120);
    expect(lastCamera().yaw).toBeLessThan(START.yaw);
    fireEvent.pointerMove(view, { clientX: 140, clientY: -9000, pointerId: 1 });
    frames(120);
    expect(lastCamera().pitch).toBeCloseTo(65, 1);
    fireEvent.pointerUp(view, { pointerId: 1 });
    const settled = lastCamera();
    fireEvent.pointerMove(view, { clientX: 400, clientY: 400, pointerId: 1 });
    frames(20);
    expect(lastCamera()).toEqual(settled);
  });

  it("ignores the right mouse button, which the menu will use", () => {
    render(<ChannelComponent {...channelProps()} />);
    frames();
    const view = canvas();
    fireEvent.pointerDown(view, {
      button: 2,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent.pointerMove(view, { clientX: 300, clientY: 100, pointerId: 1 });
    frames(20);
    expect(lastCamera()).toEqual(START);
  });

  it("pans with Shift held, and keeps the view over the town", () => {
    render(<ChannelComponent {...channelProps()} />);
    frames();
    const view = canvas();
    fireEvent.pointerDown(view, {
      button: 0,
      shiftKey: true,
      clientX: 0,
      clientY: 0,
      pointerId: 1,
    });
    fireEvent.pointerMove(view, { clientX: 0, clientY: 99999, pointerId: 1 });
    frames(120);
    const camera = lastCamera();
    expect(camera.z).toBeLessThan(0);
    expect(Math.abs(camera.z)).toBeLessThanOrEqual(18);
    expect(camera.yaw).toBe(0);
  });

  it("faces north when the compass is clicked", () => {
    render(<ChannelComponent {...channelProps()} />);
    frames();
    const view = canvas();
    fireEvent.pointerDown(view, {
      button: 0,
      clientX: 0,
      clientY: 0,
      pointerId: 1,
    });
    fireEvent.pointerMove(view, { clientX: -100, clientY: 0, pointerId: 1 });
    fireEvent.pointerUp(view, { pointerId: 1 });
    frames(120);
    expect(lastCamera().yaw).toBeGreaterThan(20);
    fireEvent.click(screen.getByRole("button", { name: /face north/i }));
    frames(240);
    expect(lastCamera().yaw).toBeCloseTo(0, 0);
  });

  it("snaps with reduced motion", () => {
    render(<ChannelComponent {...channelProps({ reducedMotion: true })} />);
    frames();
    fireEvent.wheel(canvas(), { deltaY: 300 });
    frames(1);
    expect(lastCamera().dist).toBeCloseTo(START.dist + 3, 5);
  });
});

describe("Revscape keyboard", () => {
  it("shows PRESS START first, and leaves the arrow keys alone until it is pressed", () => {
    const props = channelProps();
    render(<ChannelComponent {...props} />);
    frames();
    const surface = screen.getByRole("application");
    fireEvent.keyDown(surface, { key: "ArrowRight" });
    frames(30);
    expect(lastCamera()).toEqual(START);
    expect(props.requestCapture).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /press start/i }));
    expect(props.requestCapture).toHaveBeenCalledTimes(1);
  });

  it("takes the focus and turns while captured, stopping when the key is released", () => {
    const props = channelProps({ captured: true });
    render(<ChannelComponent {...props} />);
    frames();
    const surface = screen.getByRole("application");
    expect(document.activeElement).toBe(surface);
    expect(screen.getByText("ESC to release")).toBeTruthy();

    fireEvent.keyDown(surface, { key: "ArrowRight" });
    frames(30);
    const turned = lastCamera().yaw;
    expect(turned).toBeGreaterThan(10);
    fireEvent.keyUp(surface, { key: "ArrowRight" });
    frames(60);
    const stopped = lastCamera().yaw;
    frames(30);
    expect(lastCamera().yaw).toBeCloseTo(stopped, 3);

    fireEvent.keyDown(surface, { key: "ArrowUp" });
    fireEvent.keyDown(surface, { key: "PageDown" });
    frames(30);
    expect(lastCamera().pitch).toBeGreaterThan(START.pitch);
    expect(lastCamera().dist).toBeGreaterThan(START.dist);
  });

  it("lets go of held keys when the keyboard is released", () => {
    const props = channelProps({ captured: true });
    const { rerender } = render(<ChannelComponent {...props} />);
    frames();
    fireEvent.keyDown(screen.getByRole("application"), { key: "ArrowLeft" });
    frames(5);
    rerender(<ChannelComponent {...props} captured={false} />);
    // Let the camera glide to where it was heading, then check it no longer moves.
    frames(120);
    const yaw = lastCamera().yaw;
    frames(30);
    expect(lastCamera().yaw).toBeCloseTo(yaw, 3);
  });
});

describe("Revscape lifecycle", () => {
  it("draws nothing while inactive, and draws again when it comes back", () => {
    const props = channelProps();
    const { rerender } = render(<ChannelComponent {...props} />);
    frames();
    rerender(<ChannelComponent {...props} active={false} />);
    scene.render.mockClear();
    fireEvent.wheel(canvas(), { deltaY: 300 });
    frames(30);
    expect(scene.render).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    rerender(<ChannelComponent {...props} />);
    frames(2);
    expect(scene.render).toHaveBeenCalled();
  });

  it("frees the 3D view and leaves no frame scheduled when it unmounts", () => {
    const { unmount } = render(<ChannelComponent {...channelProps()} />);
    frames();
    fireEvent.wheel(canvas(), { deltaY: 300 });
    void act(() => {
      unmount();
    });
    frames(5);
    expect(scene.dispose).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rebuilds the town only when the projects change, and frees the old one", () => {
    const three = fixtureProjects(3);
    const props = channelProps({ projects: three });
    const { rerender } = render(<ChannelComponent {...props} />);
    frames();
    rerender(<ChannelComponent {...props} projects={three.slice(0, 1)} />);
    frames();
    expect(scene.create).toHaveBeenCalledTimes(2);
    expect(scene.dispose).toHaveBeenCalledTimes(1);
    // The same projects in a new array are the same town.
    rerender(<ChannelComponent {...props} projects={[...three.slice(0, 1)]} />);
    frames();
    expect(scene.create).toHaveBeenCalledTimes(2);
  });

  it("shows the projects as plain links if the browser takes the 3D view away", () => {
    render(<ChannelComponent {...channelProps()} />);
    frames();
    void act(() => {
      scene.lost?.();
    });
    expect(screen.getByRole("status").textContent).toMatch(/3D graphics/);
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
    expect(scene.dispose).toHaveBeenCalled();
  });

  it("handles no projects", () => {
    render(<ChannelComponent {...channelProps({ projects: [] })} />);
    frames();
    expect(scene.render).toHaveBeenCalled();
    expect(screen.queryAllByRole("link")).toEqual([]);
  });
});
