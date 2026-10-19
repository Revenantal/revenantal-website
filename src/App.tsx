import styles from "./App.module.css";
import { useEffect, useState } from "preact/hooks";
import { useSyncExternalStore } from "preact/compat";
import type { AppStore } from "@data/store";
import { ListView } from "@list/ListView";
import { startPageClock } from "@tv/controls/page-clock";
import { TV_MIN_WIDTH, useMediaQuery } from "@tv/controls/media-query";
import { TvView } from "@tv/TvView";
import { unlockTvAudio } from "@tv/tv-audio";

/** Application composition receives its one shared store from the entry point. */
export type AppProps = { store: AppStore };

// TV → List: the picture collapses, the TV fades from 0.5 s, and List fades in at 0.9 s.
const TV_OUT_MS = 900;
// List → TV: List fades out in 0.25 s, then the TV warms up.
const LIST_OUT_MS = 250;

type Mode = "tv" | "list";

/**
 * Chooses TV or List mode and runs the transitions between them. The TV shows on windows at
 * least 900 px wide while it is switched on; otherwise List mode is the site.
 *
 * @param props - The single application store.
 * @param props.store - The shared application store.
 * @returns The TV, the directory, or a contained loading/error state.
 */
export function App({ store }: AppProps) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const wide = useMediaQuery(TV_MIN_WIDTH);
  useEffect(() => startPageClock(store.tick), [store]);
  const view = store.getView();

  const wanted: Mode = wide && snapshot.power ? "tv" : "list";
  const [shown, setShown] = useState<Mode>(wanted);
  const [leaving, setLeaving] = useState(false);
  const [arrived, setArrived] = useState<{ from: Mode | null }>({
    from: null,
  });
  useEffect(() => {
    if (wanted === shown) {
      setLeaving(false);
      return;
    }
    // Narrow windows switch at once; there is no TV to animate out.
    if (!wide) {
      setShown(wanted);
      setLeaving(false);
      return;
    }
    setLeaving(true);
    const timer = window.setTimeout(
      () => {
        setArrived({ from: shown });
        setShown(wanted);
        setLeaving(false);
      },
      shown === "tv" ? TV_OUT_MS : LIST_OUT_MS,
    );
    return () => {
      window.clearTimeout(timer);
    };
  }, [wanted, shown, wide]);

  if (shown === "tv")
    return (
      <div className={styles.mode} data-leaving={leaving} data-mode="tv">
        <TvView
          snapshot={snapshot}
          view={view}
          actions={store}
          startup={arrived.from === "list" ? "warm" : "load"}
        />
      </div>
    );
  if (snapshot.site && view)
    return (
      <div className={styles.mode} data-leaving={leaving} data-mode="list">
        <ListView
          site={snapshot.site}
          view={view}
          now={snapshot.now}
          focusOnMount={arrived.from === "tv"}
          onTurnOn={
            wide
              ? () => {
                  unlockTvAudio();
                  store.setPower(true);
                }
              : undefined
          }
        />
      </div>
    );
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
