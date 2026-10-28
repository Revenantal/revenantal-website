/** One building's footprint and look. Positions are tile units, centred on the fountain. */
export type Plot = {
  /** The project's ID, or "server-hall". */
  id: string;
  kind: "project" | "hall";
  x: number;
  z: number;
  /** Footprint after turning, so overlap checks need no trigonometry. */
  width: number;
  depth: number;
  /** Turn so the door faces the square: 0, π/2, π or -π/2. */
  ry: number;
  /** Wall height of the box, before the roof. */
  wall: number;
  wallColor: number;
  roofColor: number;
};

/** The whole layout, ready to turn into meshes. */
export type Town = {
  /** Half the world's width: tiles run from -half to +half on both axes. */
  half: number;
  /** Half the width of the dirt lane along each axis. */
  lane: number;
  fountain: { x: number; z: number; radius: number };
  plots: Plot[];
  trees: { x: number; z: number; scale: number }[];
};

/** Spacing of the plots, in tiles. */
export const CELL = 7;
/** Half the width of the dirt lanes, in tiles. */
export const LANE = 1.5;
/** Radius of the fountain, in tiles. */
export const FOUNTAIN_RADIUS = 2;
const MIN_HALF = 20;

const WALLS = [0xb8a888, 0xa8a8a8, 0xbcae90, 0xa89a80, 0xb0a090];
const ROOFS = [0x7a4a22, 0x8e2a1e, 0x6a4a2a, 0x5a5a66, 0x8a5a2e];
const HALL_WALL = 0x8e8e94;
const HALL_ROOF = 0x3e3e4a;

/**
 * A small stable hash, so a project always looks the same.
 *
 * @param text - Any string.
 * @returns An unsigned 32-bit number.
 */
export function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/**
 * A seeded random sequence in 0..1 (mulberry32), so trees and ground never change.
 *
 * @param seed - Any integer.
 * @returns A function giving the next number each call.
 */
export function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Plot cells either side of the lanes, nearest the fountain first.
 *
 * @param count - How many plots are needed.
 * @returns Cell centres, with enough to hold them all.
 */
function cells(count: number): { x: number; z: number }[] {
  const reach = Math.max(1, Math.ceil(Math.sqrt(count / 4)));
  const all: { x: number; z: number }[] = [];
  for (let i = -reach; i <= reach; i += 1)
    for (let j = -reach; j <= reach; j += 1)
      if (i !== 0 && j !== 0) all.push({ x: i * CELL, z: j * CELL });
  const angle = (cell: { x: number; z: number }) =>
    (Math.atan2(cell.z, cell.x) + 2 * Math.PI) % (2 * Math.PI);
  return all.sort(
    (a, b) =>
      Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z) || angle(a) - angle(b),
  );
}

/**
 * Which way a building turns so its door faces the square.
 *
 * @param x - The building's x.
 * @param z - The building's z.
 * @returns Turn about the vertical axis, in radians.
 */
function facing(x: number, z: number): number {
  if (Math.abs(x) > Math.abs(z)) return x > 0 ? -Math.PI / 2 : Math.PI / 2;
  return z < 0 ? 0 : Math.PI;
}

function plotFor(
  id: string,
  kind: Plot["kind"],
  cell: { x: number; z: number },
): Plot {
  const h = hash(id);
  const ry = facing(cell.x, cell.z);
  const sideways = Math.abs(Math.sin(ry)) > 0.5;
  const wide = kind === "hall" ? 6 : 4 + (h % 3);
  const deep = kind === "hall" ? 4 : 4 + ((h >> 3) % 2);
  return {
    id,
    kind,
    x: cell.x,
    z: cell.z,
    width: sideways ? deep : wide,
    depth: sideways ? wide : deep,
    ry,
    wall: kind === "hall" ? 2.8 : 2 + ((h >> 5) % 4) * 0.2,
    wallColor:
      kind === "hall" ? HALL_WALL : (WALLS[(h >> 7) % WALLS.length] ?? 0),
    roofColor:
      kind === "hall" ? HALL_ROOF : (ROOFS[(h >> 11) % ROOFS.length] ?? 0),
  };
}

/**
 * Lays the town out. The Server Hall takes the nearest plot, then each project in order
 * spirals outward, so the world grows with the project list.
 *
 * @param projectIds - Project IDs in display order.
 * @returns The layout.
 */
export function layoutTown(projectIds: readonly string[]): Town {
  const spots = cells(projectIds.length + 1);
  const plots: Plot[] = [];
  const hallCell = spots[0];
  if (hallCell) plots.push(plotFor("server-hall", "hall", hallCell));
  projectIds.forEach((id, index) => {
    const cell = spots[index + 1];
    if (cell) plots.push(plotFor(id, "project", cell));
  });
  const reach = plots.reduce(
    (far, plot) =>
      Math.max(
        far,
        Math.abs(plot.x) + plot.width,
        Math.abs(plot.z) + plot.depth,
      ),
    0,
  );
  const half = Math.max(MIN_HALF, Math.ceil((reach + 6) / 2) * 2);

  const trees: Town["trees"] = [];
  const next = random(7);
  const clear = (x: number, z: number, margin: number) =>
    Math.abs(x) > LANE + margin &&
    Math.abs(z) > LANE + margin &&
    plots.every(
      (plot) =>
        Math.abs(x - plot.x) > plot.width / 2 + margin &&
        Math.abs(z - plot.z) > plot.depth / 2 + margin,
    );
  const wanted = Math.round(half * 1.1);
  for (
    let tries = 0;
    trees.length < wanted && tries < wanted * 20;
    tries += 1
  ) {
    const x = Math.round((next() * 2 - 1) * (half - 1));
    const z = Math.round((next() * 2 - 1) * (half - 1));
    if (clear(x, z, 1.5)) trees.push({ x, z, scale: 0.9 + next() * 0.4 });
  }
  return {
    half,
    lane: LANE,
    fountain: { x: 0, z: 0, radius: FOUNTAIN_RADIUS },
    plots,
    trees,
  };
}
