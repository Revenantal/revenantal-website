import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import type { ChannelManifest } from "@channels/_shared/types";

/** Snow, roll bar and burst before a channel that uses the static transition. */
export const STATIC_MS = 460;

/** What the glass shows while the dial moves between channels. */
export type Tuning = {
  shown: number;
  switching: boolean;
  /** Shows a channel live while the knob is dragged; null ends the preview. */
  preview: (position: number | null) => void;
};

/**
 * Follows the tuned position. Into a channel whose transition is `static`, with the viewer's
 * FX switch on, the glass shows snow for 460 ms before the new picture; `cut`, FX off or
 * power off swap immediately. A newer tune cancels a pending one. While dragging, the
 * nearest channel shows live, and releasing on it settles with no static.
 *
 * @param channel - The tuned position from the store.
 * @param fx - Viewer FX switch (and not reduced motion).
 * @param power - Whether the TV is on.
 * @param manifestAt - Registry lookup for the target's transition.
 * @returns The position on the glass, whether static is showing, and the drag preview.
 */
export function useTuning(
  channel: number,
  fx: boolean,
  power: boolean,
  manifestAt: (position: number) => ChannelManifest | null,
): Tuning {
  const [state, setState] = useState({ shown: channel, switching: false });
  const lastRef = useRef(channel);
  const previewedRef = useRef<number | null>(null);
  const latestRef = useRef({ fx, power, manifestAt });
  useEffect(() => {
    latestRef.current = { fx, power, manifestAt };
  });

  useEffect(() => {
    if (lastRef.current === channel) return;
    lastRef.current = channel;
    const latest = latestRef.current;
    const settled = previewedRef.current === channel;
    previewedRef.current = null;
    const transition =
      latest.manifestAt(channel)?.display?.transition ?? "static";
    if (settled || !latest.power || !latest.fx || transition === "cut") {
      setState({ shown: channel, switching: false });
      return;
    }
    setState((current) => ({ shown: current.shown, switching: true }));
    const timer = window.setTimeout(() => {
      setState({ shown: channel, switching: false });
    }, STATIC_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [channel]);

  // Power off drops any pending static so the next power-on shows the tuned channel.
  useEffect(() => {
    if (!power) setState({ shown: lastRef.current, switching: false });
  }, [power]);

  const preview = useCallback((position: number | null) => {
    previewedRef.current = position ?? previewedRef.current;
    setState({ shown: position ?? lastRef.current, switching: false });
  }, []);

  return { ...state, preview };
}
