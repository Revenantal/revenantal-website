import { CHANNEL, SCREEN } from "../geometry";
import styles from "./ScreenEffects.module.css";

/** Overlay effects drawn over the picture, in channel space. */
export type ScreenEffectsProps = {
  /** Scanline opacity, 0..1. */
  scan: number;
  flicker: boolean;
  /** Title-safe channels get a heavier edge falloff. */
  safe: boolean;
  /** Whether the tube is lit; the always-on layers stay even when off. */
  power: boolean;
};

/**
 * The CRT surface: scanlines (fading between strengths), a faint flicker, the vignette and
 * glass dust. Decorative and click-through; channels below keep their own input.
 *
 * @param props - Effect strengths from resolveEffects.
 * @param props.scan - Scanline opacity.
 * @param props.flicker - Whether the flicker runs.
 * @param props.safe - Whether the shown channel is title-safe.
 * @param props.power - Whether the tube is lit.
 * @returns The overlay layers.
 */
export function ScreenEffects({
  scan,
  flicker,
  safe,
  power,
}: ScreenEffectsProps) {
  return (
    <>
      <div
        className={styles.space}
        aria-hidden="true"
        style={{
          width: `${String(CHANNEL.width)}px`,
          height: `${String(CHANNEL.height)}px`,
          transform: `scale(${String(SCREEN.width / CHANNEL.width)})`,
        }}
      >
        <div
          className={styles.scanlines}
          style={{ opacity: power ? scan : 0 }}
        />
        {power && flicker ? <div className={styles.flicker} /> : null}
        <div className={styles.vignette} data-safe={safe} />
      </div>
      <svg
        className={styles.dust}
        width={SCREEN.width}
        height={SCREEN.height}
        aria-hidden="true"
      >
        <filter id="glass-dust">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.4"
            numOctaves={1}
            seed={11}
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  10 0 0 0 -8.2"
          />
        </filter>
        <rect
          width={SCREEN.width}
          height={SCREEN.height}
          filter="url(#glass-dust)"
        />
      </svg>
    </>
  );
}
