import { useEffect, useRef } from "preact/hooks";
import type { RefObject } from "preact";

/** Pixels per second the listings drift upward. */
export const SCROLL_SPEED = 16;

/**
 * Moves the track to an offset.
 *
 * @param track - The moving list.
 * @param offset - Pixels scrolled.
 */
export function placeTrack(track: HTMLElement, offset: number) {
  track.style.transform = offset ? `translateY(${(-offset).toFixed(1)}px)` : "";
}

/**
 * Drifts the listings upward with one transform on the track, driven by
 * requestAnimationFrame, and wraps after `loopHeight` (the track holds two copies). Runs only
 * while `running`; the offset is kept, so pausing and resuming continue where it stopped.
 *
 * @param trackRef - The moving list.
 * @param loopHeight - Height of one copy of the rows, or 0 when the rows fit (no scrolling).
 * @param running - Whether to move: active, full motion, not hovered or focused.
 * @returns The current offset, which focus handling may move to reveal a row.
 */
export function useAutoScroll(
  trackRef: RefObject<HTMLElement | null>,
  loopHeight: number,
  running: boolean,
) {
  const offsetRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (loopHeight <= 0) {
      offsetRef.current = 0;
      placeTrack(track, 0);
      return;
    }
    placeTrack(track, offsetRef.current);
    if (!running) return;
    let frame = 0;
    let last: number | null = null;
    const step = (time: number) => {
      if (last !== null) {
        offsetRef.current += ((time - last) / 1000) * SCROLL_SPEED;
        if (offsetRef.current >= loopHeight) offsetRef.current -= loopHeight;
        placeTrack(track, offsetRef.current);
      }
      last = time;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [trackRef, loopHeight, running]);

  return offsetRef;
}
