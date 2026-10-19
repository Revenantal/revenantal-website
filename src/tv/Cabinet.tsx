import type { ComponentChildren } from "preact";
import { Badge } from "./Badge";
import { RoomGlow } from "./RoomGlow";
import { DIAL, DOOR, SCREEN, STAGE, VOLUME, boxStyle } from "./geometry";
import type { Picture } from "./room-glow";
import { roomGlowOpacity } from "./room-glow";
import styles from "./Cabinet.module.css";

/** The cabinet frames whatever the screen shows and lights the room from it. */
export type CabinetProps = {
  picture: Picture;
  glow: boolean;
  children?: ComponentChildren;
};

const ASSETS = "/assets/tv";

function square(x: number, y: number, size: number) {
  return boxStyle({
    left: x - size / 2,
    top: y - size / 2,
    width: size,
    height: size,
  });
}

/**
 * Photo layers of the TV: glass, frame, static control sprites, room glow and badge.
 *
 * @param props - Current picture, glow switch and screen contents.
 * @param props.picture - What the screen shows, for its colour and the room light.
 * @param props.glow - Viewer GLOW switch combined with power.
 * @param props.children - Screen contents, clipped to the glass.
 * @returns The cabinet in stage pixels.
 */
export function Cabinet({ picture, glow, children }: CabinetProps) {
  return (
    <>
      <div
        className={styles.screen}
        style={{ ...boxStyle(SCREEN), background: picture.background }}
      >
        {children}
      </div>
      <img
        className={styles.photo}
        src={`${ASSETS}/frame.webp`}
        alt=""
        width={STAGE.width}
        height={STAGE.height}
        style={boxStyle({ left: 0, top: 0, ...STAGE })}
      />
      <img
        className={styles.photo}
        src={`${ASSETS}/door.webp`}
        alt=""
        style={boxStyle(DOOR)}
      />
      <img
        className={styles.photo}
        src={`${ASSETS}/vol.webp`}
        alt=""
        style={square(VOLUME.x, VOLUME.y, VOLUME.ring)}
      />
      <img
        className={styles.photo}
        src={`${ASSETS}/cap.webp`}
        alt=""
        style={square(VOLUME.x, VOLUME.y, VOLUME.cap)}
      />
      <img
        className={styles.photo}
        src={`${ASSETS}/knob.webp`}
        alt=""
        style={square(DIAL.x, DIAL.y, DIAL.sprite)}
      />
      <RoomGlow color={picture.glow} opacity={roomGlowOpacity(picture, glow)} />
      <Badge />
    </>
  );
}
