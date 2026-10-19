import styles from "./HintNote.module.css";

/** The note is shown, falling away, or gone. */
export type HintPhase = "waiting" | "shown" | "falling" | "gone";

/** Shown once on a first visit; the TV owns its timing. */
export type HintNoteProps = { phase: HintPhase; onDismiss: () => void };

const POSITION = { left: 1150, top: 150 };

/**
 * The taped paper note that points first-time visitors at the dial. Clicking it, or any
 * channel change, peels the tape and drops it off screen.
 *
 * @param props - Phase and dismiss action.
 * @param props.phase - Current note phase; renders only while shown or falling.
 * @param props.onDismiss - Dismisses the note for good.
 * @returns The note, or nothing.
 */
export function HintNote({ phase, onDismiss }: HintNoteProps) {
  if (phase !== "shown" && phase !== "falling") return null;
  const falling = phase === "falling";
  return (
    <div
      className={styles.note}
      data-falling={falling}
      role="note"
      style={{
        left: `${String(POSITION.left)}px`,
        top: `${String(POSITION.top)}px`,
      }}
    >
      <button
        type="button"
        className={styles.paper}
        aria-label="Tip: turn the dial to change channel. Click to dismiss."
        disabled={falling}
        onClick={onDismiss}
      >
        <span className={styles.tape} data-falling={falling} />
        turn the dial{" "}
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      </button>
    </div>
  );
}
