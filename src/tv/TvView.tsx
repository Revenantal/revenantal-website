import { Cabinet } from "./Cabinet";
import { NO_SIGNAL } from "./room-glow";
import { Stage } from "./Stage";
import styles from "./TvView.module.css";

/**
 * The TV mode shell. Controls, channels, effects and audio arrive in later phase 2 tasks;
 * until then the glass shows the empty NO SIGNAL tube.
 *
 * @returns The letterboxed TV.
 */
export function TvView() {
  return (
    <main className={styles.tv}>
      <h1 className={styles["sr-only"]}>revenantal</h1>
      <Stage>
        <Cabinet picture={NO_SIGNAL} glow />
      </Stage>
    </main>
  );
}
