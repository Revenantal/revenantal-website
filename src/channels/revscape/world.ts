import { MeshBuilder, rgb } from "./mesh-builder";
import type { Rgb } from "./mesh-builder";
import { FOUNTAIN_RADIUS, hash, random } from "./town";
import type { Plot, Town } from "./town";

/** How many tiles wide each separately drawn chunk of the world is. */
export const CHUNK = 10;

/** One drawable piece of the world; it is skipped when out of view. */
export type Chunk = {
  positions: Float32Array;
  colors: Float32Array;
  triangles: number;
  /** Centre and radius, for culling. */
  centre: [number, number, number];
  radius: number;
};

const PATH = rgb(0x8f7350);
const TRUNK = rgb(0x5a3a1a);
const LEAVES = [rgb(0x2f5a1a), rgb(0x3c7024), rgb(0x335f1c)];
const DOOR = rgb(0x3a2410);
const WINDOW = rgb(0x16202a);
const STONE = rgb(0x8a8a90);
const WATER = rgb(0x3f78b8);
const PILLAR = rgb(0xa0a0a8);
const WOOD = rgb(0x6a4a28);
const CRATE = rgb(0x8a5a2a);
const CLOTH = rgb(0xc8141e);

const tint = (color: Rgb, factor: number): Rgb => [
  color[0] * factor,
  color[1] * factor,
  color[2] * factor,
];

/**
 * Ground height at a tile corner: flat across the plots, gently rolling beyond them.
 *
 * @param x - Corner x in tiles.
 * @param z - Corner z in tiles.
 * @param flat - Radius within which the ground stays flat.
 * @returns Height in tiles.
 */
export function groundHeight(x: number, z: number, flat: number): number {
  const edge = Math.max(Math.abs(x), Math.abs(z)) - flat;
  if (edge <= 0) return 0;
  const noise = random(hash(`${String(x)},${String(z)}`))();
  return noise * 0.4 * Math.min(1, edge / 4);
}

function addHouse(builder: MeshBuilder, plot: Plot) {
  const { x, z, ry, wall } = plot;
  const sin = Math.sin(ry);
  const cos = Math.cos(ry);
  const front = (plot.ry % Math.PI === 0 ? plot.depth : plot.width) / 2;
  const wide = plot.ry % Math.PI === 0 ? plot.width : plot.depth;
  const deep = plot.ry % Math.PI === 0 ? plot.depth : plot.width;
  const wallColor = rgb(plot.wallColor);
  builder.box(x, 0, z, wide, wall, deep, wallColor, ry);
  builder.gable(x, wall, z, wide, deep, 1.5, rgb(plot.roofColor), ry);
  const onFront = (side: number, along: number): [number, number] => [
    x + sin * (front + 0.02) + cos * along * side,
    z + cos * (front + 0.02) - sin * along * side,
  ];
  const [dx, dz] = onFront(0, 0);
  builder.panel(dx, 0, dz, 0.9, 1.5, DOOR, ry);
  for (const side of [-1, 1]) {
    const [wx, wz] = onFront(side, 1.4);
    builder.panel(wx, 1.0, wz, 0.6, 0.55, WINDOW, ry);
  }
  if (plot.kind === "hall") {
    // A chimney marks the Server Hall.
    builder.box(
      x + cos * 1.2,
      wall + 0.6,
      z - sin * 1.2,
      0.5,
      1.6,
      0.5,
      rgb(0x55555c),
      ry,
    );
  }
}

function addTree(
  builder: MeshBuilder,
  x: number,
  z: number,
  scale: number,
  pick: number,
) {
  builder.box(x, 0, z, 0.3 * scale, 1.1 * scale, 0.3 * scale, TRUNK);
  const leaf = LEAVES[pick % LEAVES.length] ?? LEAVES[0] ?? TRUNK;
  builder.cone(x, 0.8 * scale, z, 1.0 * scale, 0, 1.4 * scale, 6, leaf);
  builder.cone(
    x,
    1.7 * scale,
    z,
    0.75 * scale,
    0,
    1.2 * scale,
    6,
    tint(leaf, 1.1),
  );
}

function addFountain(builder: MeshBuilder, town: Town) {
  const { x, z } = town.fountain;
  builder.cone(
    x,
    0,
    z,
    FOUNTAIN_RADIUS * 0.85,
    FOUNTAIN_RADIUS * 0.8,
    0.5,
    10,
    STONE,
  );
  builder.cone(
    x,
    0.5,
    z,
    FOUNTAIN_RADIUS * 0.7,
    FOUNTAIN_RADIUS * 0.7,
    0.04,
    10,
    WATER,
  );
  builder.cone(x, 0.5, z, 0.25, 0.18, 1.3, 6, PILLAR);
}

function addProps(builder: MeshBuilder) {
  // A market stall, crates and a short fence in the open corners of the square.
  builder.box(3, 0, -3, 1.8, 1.0, 1.0, CRATE);
  builder.box(3, 1.0, -3, 2.0, 0.08, 1.2, CLOTH);
  builder.box(2.1, 0, -2.6, 0.08, 1.0, 0.08, WOOD);
  builder.box(3.9, 0, -2.6, 0.08, 1.0, 0.08, WOOD);
  builder.box(-3, 0, -3, 0.6, 0.6, 0.6, tint(CRATE, 1.1));
  builder.box(-2.5, 0, -3.6, 0.5, 0.5, 0.5, CRATE);
  for (let i = 0; i < 5; i += 1)
    builder.box(1.6 + i * 0.4, 0, 3.4, 0.12, 0.8, 0.12, WOOD);
  builder.box(2.4, 0.55, 3.4, 1.8, 0.08, 0.08, WOOD);
}

/**
 * Builds the town into chunks of a few tiles each, so the renderer can skip those out of
 * view. All of it is flat-shaded triangles with vertex colours.
 *
 * @param town - The layout.
 * @returns The drawable chunks.
 */
export function buildWorld(town: Town): Chunk[] {
  const builders = new Map<string, MeshBuilder>();
  const at = (x: number, z: number) => {
    const key = `${String(Math.floor(x / CHUNK))},${String(Math.floor(z / CHUNK))}`;
    let builder = builders.get(key);
    if (!builder) {
      builder = new MeshBuilder();
      builders.set(key, builder);
    }
    return builder;
  };

  const flat = Math.max(
    ...town.plots.map((p) => Math.max(Math.abs(p.x), Math.abs(p.z)) + 4),
    8,
  );
  const noise = random(3);
  for (let i = -town.half; i < town.half; i += 1) {
    for (let j = -town.half; j < town.half; j += 1) {
      const lane =
        Math.abs(i + 0.5) <= town.lane || Math.abs(j + 0.5) <= town.lane;
      const grass: Rgb = [
        0.26 + noise() * 0.05,
        0.42 + noise() * 0.08,
        0.13 + noise() * 0.04,
      ];
      const shade = 0.9 + noise() * 0.15;
      at(i + 0.5, j + 0.5).tile(
        i,
        j,
        [
          groundHeight(i, j, flat),
          groundHeight(i + 1, j, flat),
          groundHeight(i, j + 1, flat),
          groundHeight(i + 1, j + 1, flat),
        ],
        tint(lane ? PATH : grass, lane ? shade : 1),
      );
    }
  }
  for (const plot of town.plots) addHouse(at(plot.x, plot.z), plot);
  town.trees.forEach((tree, index) => {
    addTree(at(tree.x, tree.z), tree.x, tree.z, tree.scale, index);
  });
  addFountain(at(town.fountain.x, town.fountain.z), town);
  addProps(at(0, 0));

  const chunks: Chunk[] = [];
  for (const builder of builders.values()) {
    const positions = new Float32Array(builder.positions);
    const lows = [Infinity, Infinity, Infinity];
    const highs = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i += 3)
      for (let axis = 0; axis < 3; axis += 1) {
        const value = positions[i + axis] ?? 0;
        lows[axis] = Math.min(lows[axis] ?? value, value);
        highs[axis] = Math.max(highs[axis] ?? value, value);
      }
    const centre: [number, number, number] = [
      ((lows[0] ?? 0) + (highs[0] ?? 0)) / 2,
      ((lows[1] ?? 0) + (highs[1] ?? 0)) / 2,
      ((lows[2] ?? 0) + (highs[2] ?? 0)) / 2,
    ];
    const radius = Math.hypot(
      (highs[0] ?? 0) - centre[0],
      (highs[1] ?? 0) - centre[1],
      (highs[2] ?? 0) - centre[2],
    );
    chunks.push({
      positions,
      colors: new Float32Array(builder.colors),
      triangles: builder.triangles,
      centre,
      radius,
    });
  }
  return chunks;
}
