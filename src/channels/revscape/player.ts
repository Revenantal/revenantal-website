import { findPath } from "./path";
import type { Grid, Tile } from "./grid";

/** One game tick: a walker covers one tile. */
export const TICK_MS = 600;

const TURN_RATE = 14; // how quickly the body turns, per second
const SWING_RATE = 10;

/** The walking player. All positions are tiles; a tile's centre is its corner plus 0.5. */
export type Player = {
  /** The tile the player stands on, or has just left. */
  tile: Tile;
  /** The tile being walked to this tick, with how far through the tick they are. */
  step: { to: Tile; progress: number } | null;
  /** The tiles still to walk after the current step. */
  path: Tile[];
  /** The click the player is heading for, shown as the X. */
  goal: Tile | null;
  /** Which way the body faces, in radians; local +z points (sin, cos). */
  facing: number;
  /** Where it is turning to. */
  heading: number;
  /** The walk cycle: advances by π each tick. */
  phase: number;
  /** How hard the arms and legs swing, 0 (still) to 1. */
  swing: number;
};

/**
 * A player standing on a tile.
 *
 * @param tile - Where they stand.
 * @returns A new, idle player.
 */
export function createPlayer(tile: Tile): Player {
  return {
    tile: { ...tile },
    step: null,
    path: [],
    goal: null,
    facing: 0,
    heading: 0,
    phase: 0,
    swing: 0,
  };
}

/**
 * Whether the player is walking.
 *
 * @param player - The player.
 * @returns True while a step or route remains.
 */
export function isMoving(player: Player): boolean {
  return player.step !== null || player.path.length > 0;
}

/**
 * Sends the player to a tile. Mid-step they finish the step they are on, then take the new
 * route from where it ends.
 *
 * @param player - The player, changed in place.
 * @param grid - The walkable tiles.
 * @param goal - The tile clicked.
 * @returns True if they now have somewhere to go; false for a blocked, unreachable or current tile.
 */
export function walkTo(player: Player, grid: Grid, goal: Tile): boolean {
  const from = player.step ? player.step.to : player.tile;
  if (grid.isBlocked(goal.i, goal.j)) return false;
  const path = findPath(grid, from, goal);
  if (!path) return false;
  if (path.length === 0 && !player.step) return false;
  player.path = path;
  player.goal = { ...goal };
  return true;
}

function startStep(player: Player) {
  const to = player.path.shift();
  if (!to) return;
  player.step = { to, progress: 0 };
  player.heading = Math.atan2(to.i - player.tile.i, to.j - player.tile.j);
}

/**
 * Moves the player on by `ms` of game time: one tile per tick, however the frames arrive.
 *
 * @param player - The player, changed in place.
 * @param ms - Milliseconds since the last update.
 */
export function updatePlayer(player: Player, ms: number) {
  let left = Math.max(0, ms);
  while (left > 0) {
    if (!player.step) {
      if (player.path.length === 0) break;
      startStep(player);
    }
    const step = player.step;
    if (!step) break;
    const need = (1 - step.progress) * TICK_MS;
    if (left < need - 1e-6) {
      step.progress += left / TICK_MS;
      left = 0;
    } else {
      left -= need;
      player.tile = step.to;
      player.step = null;
      if (player.path.length === 0) {
        player.goal = null;
        break;
      }
    }
  }
}

/**
 * Smooths the turn and the limb swing, which follow real time rather than the tick.
 *
 * @param player - The player, changed in place.
 * @param seconds - Seconds since the last frame.
 */
export function animatePlayer(player: Player, seconds: number) {
  const turn = 1 - Math.exp(-TURN_RATE * seconds);
  const gap = Math.atan2(
    Math.sin(player.heading - player.facing),
    Math.cos(player.heading - player.facing),
  );
  player.facing += gap * turn;
  const moving = isMoving(player);
  player.swing +=
    ((moving ? 1 : 0) - player.swing) * (1 - Math.exp(-SWING_RATE * seconds));
  if (moving) player.phase += (seconds * 1000 * Math.PI) / TICK_MS;
}

/**
 * Where the player is drawn. With `glide` they slide between tile centres; without it
 * (reduced motion) they stay on a tile until the tick moves them to the next.
 *
 * @param player - The player.
 * @param glide - Slide between tiles.
 * @returns World x and z.
 */
export function position(
  player: Player,
  glide: boolean,
): { x: number; z: number } {
  const { tile, step } = player;
  if (!step || !glide) return { x: tile.i + 0.5, z: tile.j + 0.5 };
  return {
    x: tile.i + 0.5 + (step.to.i - tile.i) * step.progress,
    z: tile.j + 0.5 + (step.to.j - tile.j) * step.progress,
  };
}
