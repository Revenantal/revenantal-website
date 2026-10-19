/**
 * Dial maths for an unnumbered knob over N slots. Positions are 1..N; the knob's
 * accumulated turn (degrees, clockwise) keeps wraparound from spinning back a whole turn.
 */

/**
 * Degrees per detent.
 *
 * @param slots - Number of dial slots, at least 1.
 * @returns 360 / slots.
 */
export function stepAngle(slots: number): number {
  return 360 / slots;
}

/**
 * Wraps any integer step count onto a position 1..slots.
 *
 * @param steps - Unbounded step count (position 1 is step 1).
 * @param slots - Number of dial slots.
 * @returns The wrapped position.
 */
export function wrapPosition(steps: number, slots: number): number {
  return ((((steps - 1) % slots) + slots) % slots) + 1;
}

/**
 * The shortest way round from one position to another. Half-turn ties go forward.
 *
 * @param from - Current position.
 * @param to - Target position.
 * @param slots - Number of dial slots.
 * @returns Signed detent count.
 */
export function shortestDelta(from: number, to: number, slots: number): number {
  const forward = (((to - from) % slots) + slots) % slots;
  return forward > slots / 2 ? forward - slots : forward;
}

/**
 * The accumulated knob turn after tuning to a new position the short way.
 *
 * @param turn - Current accumulated turn in degrees.
 * @param from - Current position.
 * @param to - Target position.
 * @param slots - Number of dial slots.
 * @returns The new accumulated turn.
 */
export function turnTo(
  turn: number,
  from: number,
  to: number,
  slots: number,
): number {
  return turn + shortestDelta(from, to, slots) * stepAngle(slots);
}

/**
 * Pointer angle around a centre, in degrees clockwise from 12 o'clock.
 *
 * @param dx - Pointer x minus centre x.
 * @param dy - Pointer y minus centre y (screen coordinates, down is positive).
 * @returns Angle in (−180, 180].
 */
export function pointerAngle(dx: number, dy: number): number {
  return (Math.atan2(dx, -dy) * 180) / Math.PI;
}

/**
 * Picks the equivalent of a raw pointer angle nearest the knob's current turn,
 * so dragging continues smoothly across 12 o'clock.
 *
 * @param raw - Pointer angle from pointerAngle.
 * @param turn - Current accumulated turn.
 * @returns The unwrapped drag angle.
 */
export function unwrapAngle(raw: number, turn: number): number {
  let angle = Math.round(turn / 360) * 360 + raw;
  while (angle - turn > 180) angle -= 360;
  while (turn - angle > 180) angle += 360;
  return angle;
}

/**
 * The detent nearest a drag angle, and how far off it the knob sits.
 *
 * @param angle - Unwrapped drag angle.
 * @param slots - Number of dial slots.
 * @returns The nearest position, its snapped turn, and the offset from it in detents (0..0.5).
 */
export function nearestDetent(angle: number, slots: number) {
  const step = stepAngle(slots);
  const steps = Math.round(angle / step);
  return {
    position: wrapPosition(steps, slots),
    turn: steps * step,
    offset: Math.abs(angle / step - steps),
  };
}
