import { CHANNEL, SCREEN } from "./geometry";
import styles from "./Osd.module.css";

/** Which on-screen display is showing, if any. */
export type OsdState =
  | { kind: "channel"; label: string; name: string; blink?: boolean }
  | { kind: "volume"; volume: number }
  | null;

/**
 * Green on-screen display drawn in channel space over the picture: the channel number and
 * name, or the volume bars. Decorative; TvView announces changes in a live region.
 *
 * @param props - What to show.
 * @param props.osd - Channel or volume display, or null for none.
 * @returns The OSD layer, or nothing.
 */
export function Osd({ osd }: { osd: OsdState }) {
  if (!osd) return null;
  return (
    <div
      className={styles.space}
      aria-hidden="true"
      style={{
        width: `${String(CHANNEL.width)}px`,
        height: `${String(CHANNEL.height)}px`,
        transform: `scale(${String(SCREEN.width / CHANNEL.width)})`,
      }}
    >
      {osd.kind === "channel" ? (
        <div className={styles.channel}>
          <div className={styles.number} data-blink={Boolean(osd.blink)}>
            {osd.label}
          </div>
          <div className={styles.name}>{osd.name}</div>
        </div>
      ) : (
        <div className={styles.volume}>
          <div className={styles.word}>{osd.volume ? "VOLUME" : "MUTE"}</div>
          <div className={styles.bars}>
            {Array.from({ length: 10 }, (_, index) => (
              <span
                key={index}
                className={index < osd.volume ? styles.on : styles.off}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
