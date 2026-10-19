import { useEffect, useRef } from "preact/hooks";

const SETTLE_MS = 1200;
const SAMPLE_MS = 1500;
const MIN_FPS = 42;

/**
 * Counts frames once the TV has settled. Below 42 fps the effects step down a level (1 drops
 * bloom, 2 also drops flicker) and it measures again. Silent and session-only; it runs only
 * while the TV is on and the tab is visible.
 *
 * @param active - TV on and tab visible.
 * @param perf - Current fallback level, 0..2.
 * @param setPerf - Raises the fallback level.
 */
export function usePerfMonitor(
  active: boolean,
  perf: number,
  setPerf: (perf: number) => void,
) {
  const setPerfRef = useRef(setPerf);
  useEffect(() => {
    setPerfRef.current = setPerf;
  });
  useEffect(() => {
    if (!active || perf >= 2 || typeof requestAnimationFrame !== "function")
      return;
    let frame = 0;
    let frames = 0;
    let start = 0;
    const count = (time: number) => {
      if (start === 0) start = time;
      frames += 1;
      if (time - start < SAMPLE_MS) {
        frame = requestAnimationFrame(count);
        return;
      }
      const fps = (frames * 1000) / (time - start);
      if (fps < MIN_FPS) setPerfRef.current(perf + 1);
    };
    const timer = window.setTimeout(() => {
      frame = requestAnimationFrame(count);
    }, SETTLE_MS);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [active, perf]);
}
