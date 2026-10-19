import { Snow } from "./Snow";
import styles from "./Screen.module.css";

/**
 * The 460 ms burst between channels: bright snow with a rolling bar.
 *
 * @param props - Animation state.
 * @param props.running - Whether the snow animates.
 * @returns The static picture in channel space.
 */
export function StaticBurst({ running }: { running: boolean }) {
  return (
    <div className={styles.picture} data-anim="static">
      <Snow interval={55} running={running} />
      <div className={styles.roll} />
    </div>
  );
}
