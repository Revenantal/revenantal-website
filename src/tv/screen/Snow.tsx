import { useEffect, useId, useState } from "preact/hooks";
import { CHANNEL } from "../geometry";

/** Animated analogue snow in channel space. */
export type SnowProps = {
  /** Milliseconds between frames. */
  interval: number;
  /** Animate only while the glass is visible and the tab is shown. */
  running: boolean;
  opacity?: number;
};

/**
 * Greyscale noise from an SVG turbulence filter, reseeded every few frames. Stops when not
 * running so hidden tabs and the off TV do no work.
 *
 * @param props - Frame interval, running state and opacity.
 * @param props.interval - Milliseconds between reseeds.
 * @param props.running - Whether to animate.
 * @param props.opacity - Layer opacity, default 1.
 * @returns The snow layer.
 */
export function Snow({ interval, running, opacity = 1 }: SnowProps) {
  const id = useId();
  const [seed, setSeed] = useState(1);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSeed((current) => (current * 7919 + 13) % 997);
    }, interval);
    return () => {
      window.clearInterval(timer);
    };
  }, [interval, running]);
  return (
    <svg
      width={CHANNEL.width}
      height={CHANNEL.height}
      style={{ display: "block", opacity }}
      aria-hidden="true"
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={seed}
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect
        width={CHANNEL.width}
        height={CHANNEL.height}
        filter={`url(#${id})`}
      />
    </svg>
  );
}
