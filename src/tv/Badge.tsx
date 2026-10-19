import { BADGE, boxStyle } from "./geometry";
import styles from "./Badge.module.css";

/**
 * The chrome two-line spec plate on the cabinet's bottom strip.
 *
 * @returns The decorative badge; the page heading carries the name for assistive technology.
 */
export function Badge() {
  return (
    <div className={styles.plate} style={boxStyle(BADGE)} aria-hidden="true">
      <div className={styles.inset}>
        <span className={styles.name}>REVENANTAL</span>
        <span className={styles.model}>SOLID STATE · MODEL RV-404</span>
      </div>
    </div>
  );
}
