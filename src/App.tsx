import styles from "./App.module.css";

/**
 * Renders the holding screen while the shared directory is being built.
 *
 * @returns The initial branded holding screen.
 */
export function App() {
  return (
    <main className={styles.screen}>
      <div className={styles.identity}>
        <p className={styles.model}>SOLID STATE · MODEL RV-404</p>
        <h1 className={styles.title}>revenantal</h1>
        <p className={styles.message}>Stay tuned.</p>
      </div>
    </main>
  );
}
