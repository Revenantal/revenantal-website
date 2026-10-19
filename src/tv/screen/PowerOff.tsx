import styles from "./PowerOff.module.css";

/**
 * Switching the tube off: the picture collapses to a bright line, then a point, and a soft
 * afterglow dot fades over 3.2 s on the dark glass.
 *
 * @returns The collapse overlay, covering the glass.
 */
export function PowerOff() {
  return (
    <div className={styles.glass} aria-hidden="true">
      <div className={styles.flash} />
      <div className={styles.afterglow} />
    </div>
  );
}
