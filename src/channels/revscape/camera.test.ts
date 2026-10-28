import { describe, expect, it } from "vitest";
import {
  DIST_MAX,
  DIST_MIN,
  NO_KEYS,
  PITCH_MAX,
  PITCH_MIN,
  START,
  anyKey,
  applyKeys,
  drag,
  ease,
  limit,
  pan,
  pose,
  wheel,
  wrapDegrees,
} from "./camera";

const start = { ...START };

describe("wrapDegrees", () => {
  it("keeps angles in -180..180", () => {
    expect(wrapDegrees(190)).toBeCloseTo(-170);
    expect(wrapDegrees(-190)).toBeCloseTo(170);
    expect(wrapDegrees(720)).toBeCloseTo(0);
    expect(wrapDegrees(180)).toBeCloseTo(-180);
  });
});

describe("limit", () => {
  it("clamps pitch, distance and the target, and wraps yaw", () => {
    const out = limit({ yaw: 370, pitch: 90, dist: 100, x: 99, z: -99 }, 18);
    expect(out).toEqual({
      yaw: 10,
      pitch: PITCH_MAX,
      dist: DIST_MAX,
      x: 18,
      z: -18,
    });
    const low = limit({ ...start, pitch: 0, dist: 1 }, 18);
    expect(low.pitch).toBe(PITCH_MIN);
    expect(low.dist).toBe(DIST_MIN);
  });

  it("starts at 40° pitch, inside the limits", () => {
    expect(START.pitch).toBe(40);
    expect(limit(start, 18)).toEqual(start);
  });
});

describe("mouse input", () => {
  it("turns with horizontal drags and raises the camera when dragging up", () => {
    expect(drag(start, 10, 0).yaw).toBeLessThan(start.yaw);
    expect(drag(start, -10, 0).yaw).toBeGreaterThan(start.yaw);
    expect(drag(start, 0, -20).pitch).toBeGreaterThan(start.pitch);
    expect(drag(start, 0, 20).pitch).toBeLessThan(start.pitch);
  });

  it("zooms out when the wheel scrolls away", () => {
    expect(wheel(start, 100).dist).toBeGreaterThan(start.dist);
    expect(wheel(start, -100).dist).toBeLessThan(start.dist);
  });

  it("pans relative to the view", () => {
    // Facing north, dragging the ground down brings the view forward (north, -z).
    expect(pan(start, 0, 50).z).toBeLessThan(0);
    // Dragging the ground left moves the view right (east, +x).
    expect(pan(start, -50, 0).x).toBeGreaterThan(0);
    // Turned to face east (yaw 90), forward is +x.
    const east = pan({ ...start, yaw: 90 }, 0, 50);
    expect(east.x).toBeLessThan(0.0001 + 0);
    expect(Math.abs(east.z)).toBeLessThan(0.0001);
  });
});

describe("held keys", () => {
  it("turns, tilts and zooms by time held", () => {
    const keys = { ...NO_KEYS, right: true, up: true, zoomOut: true };
    const next = applyKeys(start, keys, 0.5);
    expect(next.yaw).toBeGreaterThan(start.yaw);
    expect(next.pitch).toBeGreaterThan(start.pitch);
    expect(next.dist).toBeGreaterThan(start.dist);
    expect(applyKeys(start, NO_KEYS, 1)).toEqual(start);
    expect(
      applyKeys(start, { ...NO_KEYS, left: true, right: true }, 1),
    ).toEqual(start);
  });

  it("knows whether any key is held", () => {
    expect(anyKey(NO_KEYS)).toBe(false);
    expect(anyKey({ ...NO_KEYS, down: true })).toBe(true);
  });
});

describe("ease", () => {
  it("glides towards the wanted camera and arrives", () => {
    const wanted = { ...start, pitch: 60, dist: 20 };
    let shown = start;
    let settled = false;
    let steps = 0;
    while (!settled && steps < 200) {
      ({ state: shown, settled } = ease(shown, wanted, 1 / 60, false));
      steps += 1;
    }
    expect(settled).toBe(true);
    expect(steps).toBeGreaterThan(3);
    expect(shown).toEqual(wanted);
  });

  it("takes the short way round for yaw", () => {
    const next = ease(
      { ...start, yaw: 170 },
      { ...start, yaw: -170 },
      1 / 60,
      false,
    );
    expect(next.state.yaw).toBeGreaterThan(170);
  });

  it("snaps at once for reduced motion", () => {
    const wanted = { ...start, yaw: 90, pitch: 60 };
    expect(ease(start, wanted, 1 / 60, true)).toEqual({
      state: wanted,
      settled: true,
    });
  });
});

describe("pose", () => {
  it("puts the camera south of the target at yaw 0, looking north", () => {
    const { position, target } = pose(start);
    expect(target).toEqual([0, 0, 0]);
    expect(position[0]).toBeCloseTo(0);
    expect(position[2]).toBeGreaterThan(0);
    expect(position[1]).toBeCloseTo(
      START.dist * Math.sin((40 * Math.PI) / 180),
    );
  });

  it("keeps the same distance from the target at any yaw and pitch", () => {
    for (const yaw of [0, 45, 90, 180, -135])
      for (const pitch of [25, 40, 65]) {
        const { position } = pose({ ...start, yaw, pitch, x: 3, z: -2 });
        expect(
          Math.hypot(position[0] - 3, position[1], position[2] + 2),
        ).toBeCloseTo(START.dist);
      }
  });

  it("moves to the east side at yaw 90", () => {
    expect(pose({ ...start, yaw: 90 }).position[0]).toBeGreaterThan(5);
  });
});
