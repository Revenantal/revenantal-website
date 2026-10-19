import { panelGlow } from "./room-glow";
import styles from "./RoomGlow.module.css";

/** The spill takes its colour from the picture and its strength from the glow rules. */
export type RoomGlowProps = { color: string; opacity: number };

/**
 * Screen-coloured light thrown over the bezel and control panel.
 *
 * @param props - Spill colour and opacity.
 * @param props.color - Light colour of the current picture.
 * @param props.opacity - Spill strength from roomGlowOpacity.
 * @returns The spill layer, or nothing when the glow is off.
 */
export function RoomGlow({ color, opacity }: RoomGlowProps) {
  if (opacity <= 0) return null;
  return (
    <div
      className={styles.spill}
      aria-hidden="true"
      style={{
        "--glow": color,
        "--glow-panel": panelGlow(color),
        opacity: opacity.toFixed(3),
      }}
    />
  );
}
