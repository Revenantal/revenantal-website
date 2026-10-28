/** The orbit camera: where it looks, from which side, how high and how far. Three-free. */
export type CameraState = {
  /** Degrees. 0 looks north (towards -z) from the south; increases clockwise seen from above. */
  yaw: number;
  /** Degrees above the ground, 25 (low, scenic) to 65 (almost top-down). */
  pitch: number;
  /** Distance from the target, in tiles. */
  dist: number;
  /** The ground point it orbits. */
  x: number;
  z: number;
};

/** The camera's vertical field of view, in degrees. */
export const FOV = 46;
/** Lowest camera pitch, in degrees: low and scenic. */
export const PITCH_MIN = 25;
/** Highest camera pitch, in degrees: almost top-down. */
export const PITCH_MAX = 65;
/** Closest the camera may zoom, in tiles. */
export const DIST_MIN = 10;
/** Furthest the camera may zoom, in tiles. */
export const DIST_MAX = 22;

/** Where the camera starts: south of the fountain, looking north at 40°. */
export const START: Readonly<CameraState> = {
  yaw: 0,
  pitch: 40,
  dist: 18,
  x: 0,
  z: 0,
};

const DRAG_YAW = 0.5; // degrees per pixel
const DRAG_PITCH = 0.3;
const WHEEL_ZOOM = 0.01; // tiles per wheel delta unit
const KEY_YAW = 110; // degrees per second held
const KEY_PITCH = 60;
const KEY_ZOOM = 10; // tiles per second held

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

/**
 * Wraps an angle into -180..180.
 *
 * @param degrees - Any angle.
 * @returns The equivalent angle in -180..180.
 */
export function wrapDegrees(degrees: number): number {
  const wrapped = (((degrees + 180) % 360) + 360) % 360;
  return wrapped - 180;
}

/**
 * Keeps a camera inside its limits and over the town.
 *
 * @param state - A camera state.
 * @param limit - The furthest the target may stray from the centre, in tiles.
 * @returns The state with pitch, distance and target clamped and yaw wrapped.
 */
export function limit(state: CameraState, limit: number): CameraState {
  return {
    yaw: wrapDegrees(state.yaw),
    pitch: clamp(state.pitch, PITCH_MIN, PITCH_MAX),
    dist: clamp(state.dist, DIST_MIN, DIST_MAX),
    x: clamp(state.x, -limit, limit),
    z: clamp(state.z, -limit, limit),
  };
}

/**
 * A mouse drag: horizontal turns, vertical tilts. Dragging up raises the camera.
 *
 * @param state - The wanted camera state.
 * @param dx - Pixels dragged right.
 * @param dy - Pixels dragged down.
 * @returns The new wanted state, before limits.
 */
export function drag(state: CameraState, dx: number, dy: number): CameraState {
  return {
    ...state,
    yaw: state.yaw - dx * DRAG_YAW,
    pitch: state.pitch - dy * DRAG_PITCH,
  };
}

/**
 * A wheel turn: scrolling away zooms out.
 *
 * @param state - The wanted camera state.
 * @param deltaY - The wheel's vertical delta, positive away from the user.
 * @returns The new wanted state, before limits.
 */
export function wheel(state: CameraState, deltaY: number): CameraState {
  return { ...state, dist: state.dist + deltaY * WHEEL_ZOOM };
}

/** Held keys that move the camera. */
export type HeldKeys = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  zoomIn: boolean;
  zoomOut: boolean;
};

/** No camera key held. */
export const NO_KEYS: Readonly<HeldKeys> = {
  left: false,
  right: false,
  up: false,
  down: false,
  zoomIn: false,
  zoomOut: false,
};

/**
 * Applies held keys for one frame: ←/→ turn, ↑/↓ tilt, Page Up/Down zoom.
 *
 * @param state - The wanted camera state.
 * @param keys - Which keys are held.
 * @param seconds - The frame length in seconds.
 * @returns The new wanted state, before limits.
 */
export function applyKeys(
  state: CameraState,
  keys: HeldKeys,
  seconds: number,
): CameraState {
  const turn = Number(keys.right) - Number(keys.left);
  const tilt = Number(keys.up) - Number(keys.down);
  const zoom = Number(keys.zoomOut) - Number(keys.zoomIn);
  return {
    ...state,
    yaw: state.yaw + turn * KEY_YAW * seconds,
    pitch: state.pitch + tilt * KEY_PITCH * seconds,
    dist: state.dist + zoom * KEY_ZOOM * seconds,
  };
}

/**
 * Whether any camera key is held.
 *
 * @param keys - Which keys are held.
 * @returns True if at least one is.
 */
export function anyKey(keys: HeldKeys): boolean {
  return Object.values(keys).some(Boolean);
}

const SETTLED = 0.01;

/**
 * Moves the shown camera towards the wanted one, easing so it glides instead of jumping.
 * Yaw takes the short way round. With `snap` (reduced motion) it arrives at once.
 *
 * @param shown - The camera as drawn.
 * @param wanted - The camera the viewer asked for.
 * @param seconds - The frame length in seconds.
 * @param snap - Jump straight to the wanted state.
 * @returns The next shown camera, and whether it has arrived.
 */
export function ease(
  shown: CameraState,
  wanted: CameraState,
  seconds: number,
  snap: boolean,
): { state: CameraState; settled: boolean } {
  if (snap) return { state: { ...wanted }, settled: true };
  const t = 1 - Math.exp(-12 * seconds);
  const yawGap = wrapDegrees(wanted.yaw - shown.yaw);
  const next: CameraState = {
    yaw: shown.yaw + yawGap * t,
    pitch: shown.pitch + (wanted.pitch - shown.pitch) * t,
    dist: shown.dist + (wanted.dist - shown.dist) * t,
    x: shown.x + (wanted.x - shown.x) * t,
    z: shown.z + (wanted.z - shown.z) * t,
  };
  const settled =
    Math.abs(yawGap) < SETTLED * 10 &&
    Math.abs(wanted.pitch - next.pitch) < SETTLED * 10 &&
    Math.abs(wanted.dist - next.dist) < SETTLED &&
    Math.abs(wanted.x - next.x) < SETTLED &&
    Math.abs(wanted.z - next.z) < SETTLED;
  return { state: settled ? { ...wanted } : next, settled };
}

/** Where to put a three.js camera: its position and the point it looks at. */
export type Pose = {
  position: [number, number, number];
  target: [number, number, number];
};

/**
 * The camera's world position and look-at point.
 *
 * @param state - The camera state.
 * @returns A pose a renderer can use.
 */
export function pose(state: CameraState): Pose {
  const yaw = (state.yaw * Math.PI) / 180;
  const pitch = (state.pitch * Math.PI) / 180;
  const flat = state.dist * Math.cos(pitch);
  return {
    position: [
      state.x + Math.sin(yaw) * flat,
      state.dist * Math.sin(pitch),
      state.z + Math.cos(yaw) * flat,
    ],
    target: [state.x, 0, state.z],
  };
}
