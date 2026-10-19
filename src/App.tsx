import styles from "./App.module.css";
import { useEffect } from "preact/hooks";
import { useSyncExternalStore } from "preact/compat";
import type { AppStore } from "@data/store";
import { ListView } from "@list/ListView";
import { startPageClock } from "@tv/controls/page-clock";
import { TV_MIN_WIDTH, useMediaQuery } from "@tv/controls/media-query";
import { TvView } from "@tv/TvView";

// The TV is previewed with ?tv until power and TV/List transitions land (task 2.7).
const tvPreview = new URLSearchParams(window.location.search).has("tv");

/** Application composition receives its one shared store from the entry point. */
export type AppProps = { store: AppStore };

/**
 * Connects the shared store to the TV preview or the responsive directory and its loading states.
 *
 * @param props - The single application store.
 * @param props.store - The shared application store.
 * @returns The directory, or a contained loading/error state.
 */
export function App({ store }: AppProps) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const wide = useMediaQuery(TV_MIN_WIDTH);
  useEffect(() => startPageClock(store.tick), [store]);
  const view = store.getView();
  if (tvPreview && wide) return <TvView snapshot={snapshot} actions={store} />;
  if (snapshot.site && view)
    return <ListView site={snapshot.site} view={view} now={snapshot.now} />;
  return (
    <main className={styles.screen}>
      <div className={styles.identity}>
        <p className={styles.model}>SOLID STATE · MODEL RV-404</p>
        <h1 className={styles.title}>revenantal</h1>
        <p className={styles.message} role="status">
          {snapshot.error
            ? "The listings are unavailable. Please try again later."
            : "Finding the listings…"}
        </p>
      </div>
    </main>
  );
}
