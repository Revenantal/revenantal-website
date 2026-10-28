import { MeshBuilder, rgb } from "./mesh-builder";

/** The triangles of one part, ready for a renderer. */
export type Part = { positions: Float32Array; colors: Float32Array };

/** The player's body in parts, so the limbs can swing about their joints. */
export type Figure = {
  /** Torso, head and hat, standing on the ground. */
  body: Part;
  /** A leg hanging from the origin; place it at the hip. */
  leg: Part;
  /** An arm hanging from the origin; place it at the shoulder. */
  arm: Part;
};

/** Where the hips sit above the ground, and how far out from the middle. */
export const HIP = { y: 0.5, x: 0.12 } as const;
/** Where the shoulders sit above the ground, and how far out from the middle. */
export const SHOULDER = { y: 1.05, x: 0.34 } as const;

const SHIRT = rgb(0xc8141e);
const TROUSERS = rgb(0x3a2a1a);
const SKIN = rgb(0xe0aa80);
const HAT = rgb(0x3a2414);

function part(builder: MeshBuilder): Part {
  return {
    positions: new Float32Array(builder.positions),
    colors: new Float32Array(builder.colors),
  };
}

/**
 * Builds the player: a blocky figure in the same low-poly style as the town, about 70
 * triangles in all. Local +z is the front.
 *
 * @returns The three parts.
 */
export function buildFigure(): Figure {
  const body = new MeshBuilder();
  body.box(0, HIP.y, 0, 0.5, 0.55, 0.3, SHIRT);
  body.box(0, 1.05, 0, 0.32, 0.32, 0.32, SKIN);
  body.box(0, 1.37, 0, 0.34, 0.1, 0.34, HAT);
  const leg = new MeshBuilder();
  leg.box(0, -0.5, 0, 0.18, 0.5, 0.18, TROUSERS);
  const arm = new MeshBuilder();
  arm.box(0, -0.5, 0, 0.14, 0.5, 0.14, SHIRT);
  return { body: part(body), leg: part(leg), arm: part(arm) };
}

/**
 * The yellow X that marks where the player is heading: two crossed bars flat on the ground.
 *
 * @returns Four triangles centred on the origin, just above y = 0.
 */
export function buildMarker(): Part {
  const builder = new MeshBuilder();
  const yellow = rgb(0xffe000);
  builder.flat(0, 0.03, 0, 0.8, 0.14, yellow, Math.PI / 4);
  builder.flat(0, 0.03, 0, 0.8, 0.14, yellow, -Math.PI / 4);
  return part(builder);
}
