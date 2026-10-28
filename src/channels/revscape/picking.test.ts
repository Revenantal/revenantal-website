import { PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { FOV, START, pose } from "./camera";
import type { CameraState } from "./camera";
import { groundPoint, pickTile } from "./picking";

const ASPECT = 512 / 384;
const level = () => 0;

// The picture position three.js itself puts a ground point at.
function project(state: CameraState, x: number, y: number, z: number) {
  const camera = new PerspectiveCamera(FOV, ASPECT, 0.1, 100);
  const { position, target } = pose(state);
  camera.position.set(...position);
  camera.lookAt(...target);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  const ndc = new Vector3(x, y, z).project(camera);
  return { x: ndc.x, y: ndc.y };
}

const VIEWS: CameraState[] = [
  START,
  { ...START, yaw: 90 },
  { ...START, yaw: -135, pitch: 60, dist: 12 },
  { yaw: 30, pitch: 25, dist: 28, x: 6.5, z: -4.5 },
];

describe("pickTile", () => {
  it("agrees with three.js's own projection at several camera angles", () => {
    for (const view of VIEWS)
      for (const [x, z] of [
        [0.3, 0.3],
        [2.5, 1.5],
        [-3.2, 2.2],
        [4.1, -3.9],
      ] as const) {
        const spot = project(view, x + view.x, 0, z + view.z);
        if (Math.abs(spot.x) > 1 || Math.abs(spot.y) > 1) continue;
        const point = groundPoint(view, spot.x, spot.y, ASPECT, level);
        expect(point?.x).toBeCloseTo(x + view.x, 4);
        expect(point?.z).toBeCloseTo(z + view.z, 4);
        expect(pickTile(view, spot.x, spot.y, ASPECT, level)).toEqual({
          i: Math.floor(x + view.x),
          j: Math.floor(z + view.z),
        });
      }
  });

  it("looks at the camera's target from the middle of the picture", () => {
    expect(pickTile({ ...START, x: 4.5, z: 7.5 }, 0, 0, ASPECT, level)).toEqual(
      { i: 4, j: 7 },
    );
  });

  it("finds ground further north higher up the picture, and left to the left", () => {
    const up = groundPoint(START, 0, 0.5, ASPECT, level);
    const down = groundPoint(START, 0, -0.5, ASPECT, level);
    expect((up?.z ?? 0) < (down?.z ?? 0)).toBe(true);
    const left = groundPoint(START, -0.5, 0, ASPECT, level);
    const right = groundPoint(START, 0.5, 0, ASPECT, level);
    expect((left?.x ?? 0) < (right?.x ?? 0)).toBe(true);
  });

  it("returns null at or above the horizon", () => {
    expect(
      groundPoint({ ...START, pitch: 10 }, 0, 1, ASPECT, level),
    ).toBeNull();
    expect(pickTile({ ...START, pitch: 10 }, 0, 1, ASPECT, level)).toBeNull();
  });

  it("allows for ground that rises", () => {
    const hill = (x: number) => (x > 2 ? 0.4 : 0);
    const flat = groundPoint(START, 0.4, 0, ASPECT, level);
    const risen = groundPoint(START, 0.4, 0, ASPECT, hill);
    expect(flat).not.toBeNull();
    expect(risen).not.toBeNull();
    // A ray that meets higher ground lands nearer the camera, which is further south.
    if ((flat?.x ?? 0) > 2) expect((risen?.z ?? 0) > (flat?.z ?? 0)).toBe(true);
  });
});
