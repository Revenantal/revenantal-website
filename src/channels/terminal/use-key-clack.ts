import { useCallback, useRef } from "preact/hooks";
import type { ChannelProps } from "../_shared/types";
import { MIN_GAP_MS, keySoundFor, type KeyLike } from "./typing-sound";

/**
 * Plays a key sound for each keypress through the host's scoped player. Sounds are varied and
 * thinned as `keySoundFor` and `MIN_GAP_MS` decide, and nothing plays while the channel is
 * not on screen.
 *
 * @param active - Whether the channel is on screen.
 * @param play - The host's scoped sound player.
 * @returns A function to call with each key event.
 */
export function useKeyClack(
  active: boolean,
  play: ChannelProps["play"],
): (event: KeyLike) => void {
  const last = useRef<{ id: string | null; at: number }>({
    id: null,
    at: -Infinity,
  });
  return useCallback(
    (event: KeyLike) => {
      if (!active) return;
      const now = performance.now();
      if (now - last.current.at < MIN_GAP_MS) return;
      const sound = keySoundFor(event, Math.random, last.current.id);
      if (!sound) return;
      last.current.at = now;
      // Only the ordinary clicks rotate; Enter, Space and Backspace do not count as "last".
      if (sound.id.startsWith("key-")) last.current.id = sound.id;
      play(sound.id, sound.options);
    },
    [active, play],
  );
}
