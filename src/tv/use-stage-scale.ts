import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { stageScale } from "./geometry";

/**
 * Measures the element that hosts the stage and returns the scale that fits it.
 * Observes only that element, so no window-level listener is added.
 *
 * @returns A ref for the host element and the current stage scale.
 */
export function useStageScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      setScale(stageScale(element.clientWidth, element.clientHeight));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);
  return { ref, scale };
}
