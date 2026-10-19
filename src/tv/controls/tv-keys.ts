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
 * +/− volume. Text fields, sliders and modified keys keep their own behaviour.
 * Lives in the TV input layer, which owns window listeners.
 *
 * @param handlers - Channel and volume commands.
 */
export function useTvKeys(handlers: TvKeyHandlers) {
  const latestRef = useRef(handlers);
  useEffect(() => {
    latestRef.current = handlers;
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
      const channel = CHANNEL_KEYS[event.key];
      const volume = VOLUME_KEYS[event.key];
      if (channel !== undefined) {
        event.preventDefault();
        latestRef.current.channel(channel);
      } else if (volume !== undefined) {
        event.preventDefault();
        latestRef.current.volume(volume);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}
