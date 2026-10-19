import type { ComponentChildren } from "preact";
import { Badge } from "./Badge";
import { RoomGlow } from "./RoomGlow";
import { SCREEN, STAGE, boxStyle } from "./geometry";
import type { Picture } from "./room-glow";
import styles from "./Cabinet.module.css";

/** The cabinet frames whatever the screen shows and lights the room from it. */
export type CabinetProps = {
  picture: Picture;
  /** Room spill strength from roomGlowOpacity. */
  glowOpacity: number;
  /** Flicker makes the room light breathe. */
  breathe?: boolean;
  children?: ComponentChildren;
  controls?: ComponentChildren;
};

const ASSETS = "/assets/tv";

/**
 * Photo layers of the TV: glass, frame, controls, room glow and badge.
 *
 * @param props - Current picture, glow switch, screen contents and controls.
 * @param props.picture - What the screen shows, for its colour and the room light.
 * @param props.glowOpacity - Room spill strength.
 * @param props.breathe - Whether the room light breathes with the flicker.
 * @param props.children - Screen contents, clipped to the glass.
 * @param props.controls - Control sprites and hit zones, lit by the room glow.
 * @returns The cabinet in stage pixels.
 */
export function Cabinet({
  picture,
  glowOpacity,
  breathe = false,
  children,
  controls,
}: CabinetProps) {
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
        draggable={false}
        width={STAGE.width}
        height={STAGE.height}
        style={boxStyle({ left: 0, top: 0, ...STAGE })}
      />
      {controls}
      <RoomGlow color={picture.glow} opacity={glowOpacity} breathe={breathe} />
      <Badge />
    </>
  );
}
