import { useLayoutEffect, useRef, useState } from "preact/hooks";
import type { RoomLayout } from "./geometry";
import { roomLayout } from "./geometry";

/**
 * Measures the element that hosts the stage and places the TV in the room for its size.
 * Observes only that element, so no window-level listener is added.
 *
 * @returns A ref for the host element and the current layout, or null before measuring.
 */
export function useRoomLayout() {
  const ref = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<RoomLayout | null>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const { clientWidth, clientHeight } = element;
      setLayout(
        clientWidth > 0 && clientHeight > 0
          ? roomLayout(clientWidth, clientHeight)
          : null,
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);
  return { ref, layout };
}
