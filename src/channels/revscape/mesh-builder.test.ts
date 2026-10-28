import { describe, expect, it } from "vitest";
import { MeshBuilder, rgb } from "./mesh-builder";

type Vec = [number, number, number];

/**
 * Every triangle's centre and unit normal, from its winding.
 *
 * @param builder - The built mesh.
 * @returns One entry per triangle.
 */
function faces(builder: MeshBuilder): { centre: Vec; normal: Vec }[] {
  const out: { centre: Vec; normal: Vec }[] = [];
  const p = builder.positions;
  for (let i = 0; i < p.length; i += 9) {
    const a: Vec = [p[i] ?? 0, p[i + 1] ?? 0, p[i + 2] ?? 0];
    const b: Vec = [p[i + 3] ?? 0, p[i + 4] ?? 0, p[i + 5] ?? 0];
    const c: Vec = [p[i + 6] ?? 0, p[i + 7] ?? 0, p[i + 8] ?? 0];
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n: Vec = [
      (u[1] ?? 0) * (v[2] ?? 0) - (u[2] ?? 0) * (v[1] ?? 0),
      (u[2] ?? 0) * (v[0] ?? 0) - (u[0] ?? 0) * (v[2] ?? 0),
      (u[0] ?? 0) * (v[1] ?? 0) - (u[1] ?? 0) * (v[0] ?? 0),
    ];
    const length = Math.hypot(...n) || 1;
    out.push({
      centre: [
        (a[0] + b[0] + c[0]) / 3,
        (a[1] + b[1] + c[1]) / 3,
        (a[2] + b[2] + c[2]) / 3,
      ],
      normal: [n[0] / length, n[1] / length, n[2] / length],
    });
  }
  return out;
}

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const white = rgb(0xffffff);

describe("rgb", () => {
  it("splits a hex colour into 0..1 channels", () => {
    expect(rgb(0xff8000)).toEqual([1, 128 / 255, 0]);
  });
});

describe("MeshBuilder windings face outward", () => {
  it("boxes, turned or not", () => {
    for (const ry of [0, Math.PI / 2, 0.7]) {
      const builder = new MeshBuilder();
      builder.box(3, 0, -2, 2, 1, 3, white, ry);
      expect(builder.triangles).toBe(10);
      for (const face of faces(builder)) {
        const outward: Vec = [
          face.centre[0] - 3,
          face.centre[1] - 0.5,
          face.centre[2] + 2,
        ];
        expect(dot(face.normal, outward)).toBeGreaterThan(0);
      }
    }
  });

  it("gable roofs: slopes and ends point away from the middle, slopes also up", () => {
    const builder = new MeshBuilder();
    builder.gable(0, 2, 0, 4, 5, 1.5, white);
    expect(builder.triangles).toBe(6);
    for (const face of faces(builder)) {
      const outward: Vec = [
        face.centre[0],
        face.centre[1] - 2.4,
        face.centre[2],
      ];
      expect(dot(face.normal, outward)).toBeGreaterThan(0);
    }
  });

  it("cones, flat tops and points", () => {
    const flat = new MeshBuilder();
    flat.cone(0, 0, 0, 1, 0.8, 2, 8, white);
    expect(flat.triangles).toBe(8 * 3);
    for (const face of faces(flat)) {
      const outward: Vec = [face.centre[0], face.centre[1] - 1, face.centre[2]];
      expect(dot(face.normal, outward)).toBeGreaterThan(0);
    }
    const point = new MeshBuilder();
    point.cone(0, 0, 0, 1, 0, 2, 6, white);
    expect(point.triangles).toBe(6);
    for (const face of faces(point)) {
      expect(face.normal[1]).toBeGreaterThan(0);
      expect(
        dot(face.normal, [face.centre[0], 0, face.centre[2]]),
      ).toBeGreaterThan(0);
    }
  });

  it("panels face forward, turned or not", () => {
    for (const ry of [0, Math.PI / 2, Math.PI]) {
      const builder = new MeshBuilder();
      builder.panel(1, 0, 2, 0.9, 1.5, white, ry);
      expect(builder.triangles).toBe(2);
      for (const face of faces(builder)) {
        expect(face.normal[0]).toBeCloseTo(Math.sin(ry), 5);
        expect(face.normal[2]).toBeCloseTo(Math.cos(ry), 5);
      }
    }
  });

  it("ground tiles face up", () => {
    const builder = new MeshBuilder();
    builder.tile(2, 3, [0, 0.1, 0.2, 0.3], white);
    expect(builder.triangles).toBe(2);
    for (const face of faces(builder))
      expect(face.normal[1]).toBeGreaterThan(0.9);
  });

  it("gives every vertex a colour", () => {
    const builder = new MeshBuilder();
    builder.box(0, 0, 0, 1, 1, 1, white);
    expect(builder.colors.length).toBe(builder.positions.length);
  });
});
