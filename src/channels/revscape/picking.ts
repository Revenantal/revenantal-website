import { FOV, pose } from "./camera";
import type { CameraState } from "./camera";
import type { Tile } from "./grid";

type Vec = [number, number, number];

const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (a: Vec): Vec => {
  const length = Math.hypot(...a) || 1;
  return [a[0] / length, a[1] / length, a[2] / length];
};

/**
 * The ground point under a spot on the picture.
 *
 * @param camera - The camera as drawn.
 * @param ndcX - Across the picture, -1 (left) to 1 (right).
 * @param ndcY - Down the picture, -1 (bottom) to 1 (top).
 * @param aspect - Picture width over height.
 * @param heightAt - The ground's height at a point, so hills do not shift the answer.
 * @returns World x and z, or null if the spot is at or above the horizon.
 */
export function groundPoint(
  camera: CameraState,
  ndcX: number,
  ndcY: number,
  aspect: number,
  heightAt: (x: number, z: number) => number,
): { x: number; z: number } | null {
  const { position, target } = pose(camera);
  const forward = unit(sub(target, position));
  const right = unit(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const half = Math.tan((FOV * Math.PI) / 360);
  const dir: Vec = [
    forward[0] + right[0] * ndcX * half * aspect + up[0] * ndcY * half,
    forward[1] + right[1] * ndcX * half * aspect + up[1] * ndcY * half,
    forward[2] + right[2] * ndcX * half * aspect + up[2] * ndcY * half,
  ];
  if (dir[1] >= -1e-6) return null;
  let height = 0;
  let x = position[0];
  let z = position[2];
  // Two passes: the ground is not quite level, so refine the height where the ray lands.
  for (let pass = 0; pass < 3; pass += 1) {
    const t = (height - position[1]) / dir[1];
    x = position[0] + dir[0] * t;
    z = position[2] + dir[2] * t;
    height = heightAt(x, z);
  }
  return { x, z };
}

/**
 * The tile under a spot on the picture.
 *
 * @param camera - The camera as drawn.
 * @param ndcX - Across the picture, -1 (left) to 1 (right).
 * @param ndcY - Down the picture, -1 (bottom) to 1 (top).
 * @param aspect - Picture width over height.
 * @param heightAt - The ground's height at a point.
 * @returns The tile, or null if the spot is at or above the horizon.
 */
export function pickTile(
  camera: CameraState,
  ndcX: number,
  ndcY: number,
  aspect: number,
  heightAt: (x: number, z: number) => number,
): Tile | null {
  const point = groundPoint(camera, ndcX, ndcY, aspect, heightAt);
  return point ? { i: Math.floor(point.x), j: Math.floor(point.z) } : null;
}
