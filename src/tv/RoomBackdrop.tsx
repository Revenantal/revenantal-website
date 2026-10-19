import { SCREEN } from "./geometry";
import styles from "./RoomBackdrop.module.css";

/** The room is lit by whatever the screen shows. */
export type RoomBackdropProps = { color: string; opacity: number };

/**
 * The dark room around the TV: the room photo, screen light spilling onto it and a
 * vignette. Positioned from the layout variables that Stage sets.
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
        "--screen-x": `${String(SCREEN.left + SCREEN.width / 2)}px`,
        "--screen-y": `${String(SCREEN.top + SCREEN.height / 2)}px`,
      }}
    >
      <img
        className={styles.photo}
        src="/assets/tv/room.webp"
        alt=""
        draggable={false}
        width={1536}
        height={1024}
      />
      {opacity > 0 ? <div className={styles.spill} /> : null}
      <div className={styles.vignette} />
    </div>
  );
}
