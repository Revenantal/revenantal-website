import { SCREEN, STAGE } from "./geometry";
import styles from "./RoomBackdrop.module.css";

/** The room is lit by whatever the screen shows. */
export type RoomBackdropProps = { color: string; opacity: number };

// Screen centre relative to the stage centre, in stage pixels.
const offsetX = SCREEN.left + SCREEN.width / 2 - STAGE.width / 2;
const offsetY = SCREEN.top + SCREEN.height / 2 - STAGE.height / 2;

/**
 * The dark room around the cabinet: a faintly lit wall, screen light spilling past the
 * cabinet, and a vignette. It fills the letterbox area at any window shape.
 *
 * @param props - Spill colour and strength, shared with the room glow.
 * @param props.color - Light colour of the current picture.
 * @param props.opacity - Spill strength from roomGlowOpacity.
 * @returns Decorative backdrop layers.
 */
export function RoomBackdrop({ color, opacity }: RoomBackdropProps) {
  return (
    <div
      className={styles.backdrop}
      aria-hidden="true"
      style={{
        "--glow": color,
        "--spill": opacity.toFixed(3),
        "--screen-x": `${String(offsetX)}px`,
        "--screen-y": `${String(offsetY)}px`,
      }}
    >
      <div className={styles.wall} />
      {opacity > 0 ? <div className={styles.spill} /> : null}
      <div className={styles.vignette} />
    </div>
  );
}
