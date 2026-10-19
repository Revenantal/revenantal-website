import { useEffect, useRef } from "preact/hooks";
import { positionFromHash } from "@data/persistence";

/**
 * Keeps `#chN` in step with the dial: the hash follows every channel change (replaceState, so
 * no history spam), and a changed hash re-tunes. Invalid hashes are ignored, never wrapped.
 * Lives in the TV input layer, which owns window listeners.
 *
 * @param channel - The tuned position.
 * @param slots - The dial's slot count.
 * @param onHash - Tunes to a position read from the hash.
 */
export function useChannelHash(
  channel: number,
  slots: number,
  onHash: (position: number) => void,
) {
  const onHashRef = useRef(onHash);
  useEffect(() => {
    onHashRef.current = onHash;
  });

  useEffect(() => {
    const hash = `#ch${String(channel)}`;
    if (window.location.hash === hash) return;
    const url = `${window.location.pathname}${window.location.search}${hash}`;
    window.history.replaceState(window.history.state, "", url);
  }, [channel]);

  useEffect(() => {
    const onChange = () => {
      const position = positionFromHash(window.location.hash, slots);
      if (position !== null) onHashRef.current(position);
    };
    window.addEventListener("hashchange", onChange);
    return () => {
      window.removeEventListener("hashchange", onChange);
    };
  }, [slots]);
}
