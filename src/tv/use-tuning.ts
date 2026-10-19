import { useEffect, useRef, useState } from "preact/hooks";
import type { ChannelManifest } from "@channels/_shared/types";

/** Snow, roll bar and burst before a channel that uses the static transition. */
export const STATIC_MS = 460;

/** What the glass shows while the dial moves between channels. */
export type Tuning = { shown: number; switching: boolean };

/**
 * Follows the tuned position. Into a channel whose transition is `static`, with the viewer's
 * FX switch on, the glass shows snow for 460 ms before the new picture; `cut`, FX off or
 * power off swap immediately. A newer tune cancels a pending one.
 *
 * @param channel - The tuned position from the store.
 * @param fx - Viewer FX switch.
 * @param power - Whether the TV is on.
 * @param manifestAt - Registry lookup for the target's transition.
 * @returns The position on the glass and whether static is showing.
 */
export function useTuning(
  channel: number,
  fx: boolean,
  power: boolean,
  manifestAt: (position: number) => ChannelManifest | null,
): Tuning {
  const [tuning, setTuning] = useState<Tuning>({
    shown: channel,
    switching: false,
  });
  const lastRef = useRef(channel);
  const latestRef = useRef({ fx, power, manifestAt });
  useEffect(() => {
    latestRef.current = { fx, power, manifestAt };
  });

  useEffect(() => {
    if (lastRef.current === channel) return;
    lastRef.current = channel;
    const latest = latestRef.current;
    const transition =
      latest.manifestAt(channel)?.display?.transition ?? "static";
    if (!latest.power || !latest.fx || transition === "cut") {
      setTuning({ shown: channel, switching: false });
      return;
    }
    setTuning((current) => ({ shown: current.shown, switching: true }));
    const timer = window.setTimeout(() => {
      setTuning({ shown: channel, switching: false });
    }, STATIC_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [channel]);

  // Power off drops any pending static so the next power-on shows the tuned channel.
  useEffect(() => {
    if (!power) setTuning({ shown: lastRef.current, switching: false });
  }, [power]);

  return tuning;
}
