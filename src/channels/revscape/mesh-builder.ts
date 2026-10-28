/** An RGB colour with channels 0..1. */
export type Rgb = readonly [number, number, number];

/**
 * Turns a 0xRRGGBB number into channels 0..1.
 *
 * @param hex - The colour.
 * @returns Red, green and blue as 0..1.
 */
export function rgb(hex: number): Rgb {
  return [(hex >> 16) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
}

type Vec = readonly [number, number, number];

/**
 * Collects flat-shaded, vertex-coloured triangles. Three-free: the renderer turns the arrays
 * into geometry. Every shape is built from a few triangles, in the low-poly style of the town.
 */
export class MeshBuilder {
  readonly positions: number[] = [];
  readonly colors: number[] = [];

  /**
   * How many triangles have been added so far.
   *
   * @returns The count.
   */
  get triangles(): number {
    return this.positions.length / 9;
  }

  /**
   * Adds one triangle, wound anticlockwise seen from its front.
   *
   * @param a - First corner.
   * @param b - Second corner.
   * @param c - Third corner.
   * @param color - Its colour.
   */
  tri(a: Vec, b: Vec, c: Vec, color: Rgb) {
    this.positions.push(...a, ...b, ...c);
    this.colors.push(...color, ...color, ...color);
  }

  /**
   * Adds a quad as two triangles; corners go anticlockwise seen from the front.
   *
   * @param a - First corner.
   * @param b - Second corner.
   * @param c - Third corner.
   * @param d - Fourth corner.
   * @param color - Its colour.
   */
  quad(a: Vec, b: Vec, c: Vec, d: Vec, color: Rgb) {
    this.tri(a, b, c, color);
    this.tri(a, c, d, color);
  }

  /**
   * Adds a box with no bottom face.
   *
   * @param cx - Centre x.
   * @param y - Height of the base.
   * @param cz - Centre z.
   * @param w - Width along x.
   * @param h - Height.
   * @param d - Depth along z.
   * @param color - Its colour.
   * @param ry - Turn about the vertical axis, in radians.
   */
  box(
    cx: number,
    y: number,
    cz: number,
    w: number,
    h: number,
    d: number,
    color: Rgb,
    ry = 0,
  ) {
    const sin = Math.sin(ry);
    const cos = Math.cos(ry);
    const at = (lx: number, ly: number, lz: number): Vec => [
      cx + lx * cos + lz * sin,
      y + ly,
      cz - lx * sin + lz * cos,
    ];
    const x0 = -w / 2;
    const x1 = w / 2;
    const z0 = -d / 2;
    const z1 = d / 2;
    this.quad(
      at(x0, 0, z1),
      at(x1, 0, z1),
      at(x1, h, z1),
      at(x0, h, z1),
      color,
    );
    this.quad(
      at(x1, 0, z0),
      at(x0, 0, z0),
      at(x0, h, z0),
      at(x1, h, z0),
      color,
    );
    this.quad(
      at(x1, 0, z1),
      at(x1, 0, z0),
      at(x1, h, z0),
      at(x1, h, z1),
      color,
    );
    this.quad(
      at(x0, 0, z0),
      at(x0, 0, z1),
      at(x0, h, z1),
      at(x0, h, z0),
      color,
    );
    this.quad(
      at(x0, h, z1),
      at(x1, h, z1),
      at(x1, h, z0),
      at(x0, h, z0),
      color,
    );
  }

  /**
   * Adds one flat panel facing local +z, such as a door or window on a wall: two triangles.
   *
   * @param cx - Centre x.
   * @param y - Height of the bottom edge.
   * @param cz - Centre z.
   * @param w - Width along local x.
   * @param h - Height.
   * @param color - Its colour.
   * @param ry - Turn about the vertical axis, in radians.
   */
  panel(
    cx: number,
    y: number,
    cz: number,
    w: number,
    h: number,
    color: Rgb,
    ry = 0,
  ) {
    const sin = Math.sin(ry);
    const cos = Math.cos(ry);
    const at = (lx: number, ly: number): Vec => [
      cx + lx * cos,
      y + ly,
      cz - lx * sin,
    ];
    this.quad(at(-w / 2, 0), at(w / 2, 0), at(w / 2, h), at(-w / 2, h), color);
  }

  /**
   * Adds one flat rectangle lying on the ground, facing up: two triangles.
   *
   * @param cx - Centre x.
   * @param y - Height.
   * @param cz - Centre z.
   * @param w - Length along local x.
   * @param d - Width along local z.
   * @param color - Its colour.
   * @param ry - Turn about the vertical axis, in radians.
   */
  flat(
    cx: number,
    y: number,
    cz: number,
    w: number,
    d: number,
    color: Rgb,
    ry = 0,
  ) {
    const sin = Math.sin(ry);
    const cos = Math.cos(ry);
    const at = (lx: number, lz: number): Vec => [
      cx + lx * cos + lz * sin,
      y,
      cz - lx * sin + lz * cos,
    ];
    this.quad(
      at(-w / 2, d / 2),
      at(w / 2, d / 2),
      at(w / 2, -d / 2),
      at(-w / 2, -d / 2),
      color,
    );
  }

  /**
   * Adds a gable roof: two slopes, two end triangles, and an underside.
   *
   * @param cx - Centre x.
   * @param y - Height of the eaves.
   * @param cz - Centre z.
   * @param w - Width across the slope, along local x.
   * @param d - Length of the ridge, along local z.
   * @param h - Height of the ridge above the eaves.
   * @param color - Its colour.
   * @param ry - Turn about the vertical axis, in radians.
   */
  gable(
    cx: number,
    y: number,
    cz: number,
    w: number,
    d: number,
    h: number,
    color: Rgb,
    ry = 0,
  ) {
    const sin = Math.sin(ry);
    const cos = Math.cos(ry);
    const at = (lx: number, ly: number, lz: number): Vec => [
      cx + lx * cos + lz * sin,
      y + ly,
      cz - lx * sin + lz * cos,
    ];
    const over = 0.3;
    const x0 = -w / 2 - over;
    const x1 = w / 2 + over;
    const z0 = -d / 2 - over;
    const z1 = d / 2 + over;
    const shade = (f: number): Rgb => [
      color[0] * f,
      color[1] * f,
      color[2] * f,
    ];
    this.quad(
      at(x0, 0, z1),
      at(0, h, z1),
      at(0, h, z0),
      at(x0, 0, z0),
      shade(0.9),
    );
    this.quad(
      at(x1, 0, z0),
      at(0, h, z0),
      at(0, h, z1),
      at(x1, 0, z1),
      shade(1.05),
    );
    this.tri(at(x1, 0, z1), at(0, h, z1), at(x0, 0, z1), shade(0.8));
    this.tri(at(x0, 0, z0), at(0, h, z0), at(x1, 0, z0), shade(0.8));
  }

  /**
   * Adds an upright cone or tapered cylinder with a flat top and no bottom.
   *
   * @param cx - Centre x.
   * @param y - Height of the base.
   * @param cz - Centre z.
   * @param bottom - Radius at the base.
   * @param top - Radius at the top (0 for a point).
   * @param h - Height.
   * @param sides - How many sides.
   * @param color - Its colour.
   */
  cone(
    cx: number,
    y: number,
    cz: number,
    bottom: number,
    top: number,
    h: number,
    sides: number,
    color: Rgb,
  ) {
    const ring = (radius: number, height: number, i: number): Vec => {
      const angle = (i / sides) * Math.PI * 2;
      return [
        cx + Math.cos(angle) * radius,
        y + height,
        cz + Math.sin(angle) * radius,
      ];
    };
    for (let i = 0; i < sides; i += 1) {
      const shade =
        0.85 +
        0.25 * Math.abs(Math.cos(((i + 0.5) / sides) * Math.PI * 2 - 0.8));
      const tint: Rgb = [color[0] * shade, color[1] * shade, color[2] * shade];
      const a = ring(bottom, 0, i);
      const b = ring(bottom, 0, i + 1);
      const c = ring(top, h, i + 1);
      const e = ring(top, h, i);
      if (top > 0) this.quad(a, e, c, b, tint);
      else this.tri(a, e, b, tint);
      if (top > 0) this.tri([cx, y + h, cz], c, e, color);
    }
  }

  /**
   * Adds a flat tile of ground with its four corner heights.
   *
   * @param x - West edge.
   * @param z - North edge.
   * @param heights - Corner heights: north-west, north-east, south-west, south-east.
   * @param color - Its colour.
   */
  tile(
    x: number,
    z: number,
    heights: readonly [number, number, number, number],
    color: Rgb,
  ) {
    const nw: Vec = [x, heights[0], z];
    const ne: Vec = [x + 1, heights[1], z];
    const sw: Vec = [x, heights[2], z + 1];
    const se: Vec = [x + 1, heights[3], z + 1];
    this.tri(nw, sw, ne, color);
    this.tri(ne, sw, se, color);
  }
}
