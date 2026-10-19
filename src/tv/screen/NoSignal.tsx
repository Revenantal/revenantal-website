import { Snow } from "./Snow";
import styles from "./Screen.module.css";

/**
 * An empty dial position: animated snow behind a black NO SIGNAL card.
 *
 * @param props - Animation state.
 * @param props.running - Whether the snow animates.
 * @returns The NO SIGNAL picture in channel space.
 */
export function NoSignal({ running }: { running: boolean }) {
  return (
    <div className={styles.picture} data-anim="on">
      <Snow interval={70} running={running} opacity={0.85} />
      <div className={styles.card}>NO SIGNAL</div>
    </div>
  );
}
