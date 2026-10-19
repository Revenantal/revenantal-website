import { useSyncExternalStore } from "preact/compat";

/** Viewports narrower than this always use List mode; the TV is not rendered. */
export const TV_MIN_WIDTH = "(min-width: 900px)";

/**
 * Subscribes to a CSS media query. Lives in the TV input layer, which owns window listeners.
 *
 * @param query - Media query text.
 * @returns Whether the query currently matches; false where matchMedia is unavailable.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window.matchMedia !== "function") return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => {
        list.removeEventListener("change", notify);
      };
    },
    () =>
      typeof window.matchMedia === "function" &&
      window.matchMedia(query).matches,
  );
}
