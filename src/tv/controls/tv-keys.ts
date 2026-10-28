import { useEffect, useRef } from "preact/hooks";

/** TV-wide key commands. */
export type TvKeyHandlers = {
  channel: (delta: number) => void;
  volume: (delta: number) => void;
};

const CHANNEL_KEYS: Record<string, number> = {
  ArrowUp: 1,
  ArrowRight: 1,
  ArrowDown: -1,
  ArrowLeft: -1,
};
const VOLUME_KEYS: Record<string, number> = { "+": 1, "=": 1, "-": -1, _: -1 };

function ownsKeys(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest("input, textarea, select, [role='slider']") !== null
  );
}

/**
 * Listens for the TV's keys while the TV is mounted: ↑/→ next channel, ↓/← previous,
 * +/− volume. Text fields, sliders and modified keys keep their own behaviour. While a
 * channel has captured the keyboard the arrows belong to it; volume still works.
 * Lives in the TV input layer, which owns window listeners.
 *
 * @param handlers - Channel and volume commands.
 * @param captured - Whether the tuned channel holds the keyboard.
 */
export function useTvKeys(handlers: TvKeyHandlers, captured = false) {
  const latestRef = useRef({ handlers, captured });
  useEffect(() => {
    latestRef.current = { handlers, captured };
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      if (ownsKeys(event.target)) return;
      const channel = latestRef.current.captured
        ? undefined
        : CHANNEL_KEYS[event.key];
      const volume = VOLUME_KEYS[event.key];
      if (channel !== undefined) {
        event.preventDefault();
        latestRef.current.handlers.channel(channel);
      } else if (volume !== undefined) {
        event.preventDefault();
        latestRef.current.handlers.volume(volume);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}
