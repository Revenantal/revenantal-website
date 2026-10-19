import type { SourceState } from "@data/freshness";
import styles from "./ListView.module.css";

/** Shared source-age label with no stale values implied to be current. */
export type SourceAgeProps = { source: SourceState; now: Date; label?: string };

/**
 * Labels an individual source with its own observation age.
 *
 * @param props - Validated source freshness and the shared viewer clock.
 * @param props.source - Observation freshness.
 * @param props.now - The shared viewer clock.
 * @param props.label - Optional source label.
 * @returns A readable source age or unavailable label.
 */
export function SourceAge({ source, now, label }: SourceAgeProps) {
  if (!source.observedAt || source.state === "unavailable")
    return (
      <p className={styles.meta}>{label ? `${label}: ` : ""}Unavailable</p>
    );
  const elapsed = Math.max(0, now.getTime() - Date.parse(source.observedAt));
  const minutes = Math.floor(elapsed / 60_000);
  const age = minutes === 0 ? "just now" : `${String(minutes)} min ago`;
  return (
    <p className={styles.meta}>
      {label ? `${label}: ` : ""}
      {source.state === "stale" ? "Stale · observed " : "Updated "}
      <time
        dateTime={source.observedAt}
        title={new Date(source.observedAt).toLocaleString()}
      >
        {age}
      </time>
    </p>
  );
}
