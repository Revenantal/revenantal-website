import { useSyncExternalStore } from "preact/compat";

/**
 * Whether the tab is visible. Channels pause while it is hidden; this TV input-layer hook
 * owns the document listener so channels never add their own.
 *
 * @returns True while the document is visible.
 */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    (notify) => {
      document.addEventListener("visibilitychange", notify);
      return () => {
        document.removeEventListener("visibilitychange", notify);
      };
    },
    () => document.visibilityState !== "hidden",
  );
}
