import { Cabinet } from "./Cabinet";
import { NO_SIGNAL, roomGlowOpacity } from "./room-glow";
import { RoomBackdrop } from "./RoomBackdrop";
import { Stage } from "./Stage";
import styles from "./TvView.module.css";

/**
 * The TV mode shell. Controls, channels, effects and audio arrive in later phase 2 tasks;
 * until then the glass shows the empty NO SIGNAL tube.
 *
 * @returns The letterboxed TV.
 */
export function TvView() {
  const glow = true; // Viewer GLOW switch arrives with the settings door (2.3/2.5).
  return (
    <main className={styles.tv}>
      <h1 className={styles["sr-only"]}>revenantal</h1>
      <Stage
        backdrop={
          <RoomBackdrop
            color={NO_SIGNAL.glow}
            opacity={roomGlowOpacity(NO_SIGNAL, glow)}
          />
        }
      >
        <Cabinet picture={NO_SIGNAL} glow={glow} />
      </Stage>
    </main>
  );
}
