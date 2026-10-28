import { describe, expect, it } from "vitest";
import type { Grid } from "./grid";
import {
  TICK_MS,
  animatePlayer,
  createPlayer,
  isMoving,
  position,
  updatePlayer,
  walkTo,
} from "./player";

const open: Grid = {
  half: 20,
  isBlocked: (i, j) =>
    i < -20 || i >= 20 || j < -20 || j >= 20 || (i === 3 && j === -6),
};

describe("walkTo", () => {
  it("starts a walk to an open tile, and refuses blocked, unreachable and current tiles", () => {
    const player = createPlayer({ i: 0, j: 0 });
    expect(walkTo(player, open, { i: 3, j: -6 })).toBe(false);
    expect(walkTo(player, open, { i: 99, j: 0 })).toBe(false);
    expect(walkTo(player, open, { i: 0, j: 0 })).toBe(false);
    expect(isMoving(player)).toBe(false);
    expect(walkTo(player, open, { i: 5, j: 5 })).toBe(true);
    expect(player.goal).toEqual({ i: 5, j: 5 });
    expect(isMoving(player)).toBe(true);
  });
});

describe("updatePlayer", () => {
  it("moves one tile per tick", () => {
    const player = createPlayer({ i: 0, j: 0 });
    walkTo(player, open, { i: 5, j: 0 });
    updatePlayer(player, TICK_MS - 1);
    expect(player.tile).toEqual({ i: 0, j: 0 });
    updatePlayer(player, 1);
    expect(player.tile).toEqual({ i: 1, j: 0 });
    updatePlayer(player, TICK_MS * 2);
    expect(player.tile).toEqual({ i: 3, j: 0 });
  });

  it("covers the same ground however the frames arrive", () => {
    const route = { i: 8, j: 6 };
    const slow = createPlayer({ i: 0, j: 0 });
    const fast = createPlayer({ i: 0, j: 0 });
    const lump = createPlayer({ i: 0, j: 0 });
    for (const player of [slow, fast, lump]) walkTo(player, open, route);
    for (let t = 0; t < 3000; t += 16) updatePlayer(slow, 16);
    for (let t = 0; t < 3000; t += 1) updatePlayer(fast, 1);
    updatePlayer(lump, 3000);
    expect(slow.tile).toEqual(fast.tile);
    expect(slow.tile).toEqual(lump.tile);
    // 3000 ms is five ticks: five steps along a route of eight.
    expect(Math.max(Math.abs(lump.tile.i), Math.abs(lump.tile.j))).toBe(5);
  });

  it("stops on arrival and clears the goal", () => {
    const player = createPlayer({ i: 0, j: 0 });
    walkTo(player, open, { i: 2, j: 0 });
    updatePlayer(player, TICK_MS * 10);
    expect(player.tile).toEqual({ i: 2, j: 0 });
    expect(player.goal).toBeNull();
    expect(isMoving(player)).toBe(false);
    expect(player.step).toBeNull();
  });

  it("does nothing with no route, or a negative or zero time", () => {
    const player = createPlayer({ i: 1, j: 1 });
    updatePlayer(player, 5000);
    expect(player.tile).toEqual({ i: 1, j: 1 });
    walkTo(player, open, { i: 4, j: 1 });
    updatePlayer(player, -50);
    updatePlayer(player, 0);
    expect(player.tile).toEqual({ i: 1, j: 1 });
    expect(player.step).toBeNull();
  });

  it("finishes the step it is on, then takes the new route", () => {
    const player = createPlayer({ i: 0, j: 0 });
    walkTo(player, open, { i: 6, j: 0 });
    updatePlayer(player, TICK_MS * 1.5);
    expect(player.tile).toEqual({ i: 1, j: 0 });
    expect(player.step?.to).toEqual({ i: 2, j: 0 });
    expect(walkTo(player, open, { i: 2, j: 5 })).toBe(true);
    expect(player.goal).toEqual({ i: 2, j: 5 });
    updatePlayer(player, TICK_MS * 0.5);
    expect(player.tile).toEqual({ i: 2, j: 0 });
    updatePlayer(player, TICK_MS * 10);
    expect(player.tile).toEqual({ i: 2, j: 5 });
  });

  it("can be sent back to the tile it is walking to", () => {
    const player = createPlayer({ i: 0, j: 0 });
    walkTo(player, open, { i: 6, j: 0 });
    updatePlayer(player, TICK_MS * 0.5);
    expect(walkTo(player, open, { i: 1, j: 0 })).toBe(true);
    updatePlayer(player, TICK_MS * 10);
    expect(player.tile).toEqual({ i: 1, j: 0 });
    expect(player.goal).toBeNull();
  });

  it("turns towards where it is going", () => {
    const player = createPlayer({ i: 0, j: 0 });
    walkTo(player, open, { i: 3, j: 3 });
    updatePlayer(player, 10);
    // Heading south-east: x and z both grow.
    expect(Math.sin(player.heading)).toBeGreaterThan(0.5);
    expect(Math.cos(player.heading)).toBeGreaterThan(0.5);
  });
});

describe("animatePlayer", () => {
  it("eases the turn by the short way round and swings the limbs only while walking", () => {
    const player = createPlayer({ i: 0, j: 0 });
    player.facing = 3;
    player.heading = -3;
    animatePlayer(player, 0.05);
    expect(player.facing).toBeGreaterThan(3);
    expect(player.swing).toBe(0);
    walkTo(player, open, { i: 4, j: 0 });
    animatePlayer(player, 0.1);
    expect(player.swing).toBeGreaterThan(0);
    expect(player.phase).toBeGreaterThan(0);
    const phase = player.phase;
    animatePlayer(player, TICK_MS / 1000);
    expect(player.phase - phase).toBeCloseTo(Math.PI, 5);
  });
});

describe("position", () => {
  it("glides between tile centres, or stays on the tile without glide", () => {
    const player = createPlayer({ i: 2, j: 3 });
    expect(position(player, true)).toEqual({ x: 2.5, z: 3.5 });
    walkTo(player, open, { i: 5, j: 3 });
    updatePlayer(player, TICK_MS / 2);
    expect(position(player, true).x).toBeCloseTo(3);
    expect(position(player, true).z).toBeCloseTo(3.5);
    expect(position(player, false)).toEqual({ x: 2.5, z: 3.5 });
  });
});
