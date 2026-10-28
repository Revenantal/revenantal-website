import { useEffect } from "preact/hooks";
import styles from "./CaptureOverlay.module.css";

/**
 * Joins the class names that apply.
 *
 * @param names - Class names, or false to leave one out.
 * @returns One class attribute value.
 */
function classes(...names: (string | false | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

/** Props for the shared PRESS START overlay. */
export type CaptureOverlayProps = {
  /** Whether the channel currently holds the keyboard (`ChannelProps.captured`). */
  captured: boolean;
  /** Asks the host for the keyboard (`ChannelProps.requestCapture`). */
  onStart: () => void;
  /** What the keys do once captured, for example "Arrows or WASD to move". */
  hint?: string;
  /**
   * A small strip along the bottom instead of a full screen, for channels whose mouse
   * controls work without the keyboard. The "ESC to release" tag takes the same place along the bottom.
   */
  compact?: boolean;
};

/**
 * The PRESS START screen every game channel shows before it takes the keyboard, and the
 * small "ESC to release" tag afterwards. Starting needs a click, Enter or Space on the
 * button; the host then takes the keys off the dial. Place it inside the channel's
 * `position: relative` root.
 *
 * @param props - Capture state and the start callback.
 * @param props.captured - Whether the channel holds the keyboard.
 * @param props.onStart - Requests capture from the host.
 * @param props.hint - What the keys do while captured.
 * @param props.compact - A bottom strip instead of a full screen.
 * @returns The PRESS START button, or the release tag.
 */
export function CaptureOverlay({
  captured,
  onStart,
  hint = "Arrow keys, WASD and Space play",
  compact = false,
}: CaptureOverlayProps) {
  if (captured)
    return (
      <>
        <div
          className={classes(styles.tag, compact && styles["tag-strip"])}
          aria-hidden="true"
        >
          ESC to release
        </div>
        <p className={styles["sr-only"]} role="status">
          Keyboard captured. Press Escape to release it.
        </p>
      </>
    );
  return (
    <button
      type="button"
      className={classes(styles.start, compact && styles.strip)}
      onClick={onStart}
    >
      <span className={styles.title}>PRESS START</span>
      <span className={styles.hint}>{hint}</span>
      <span className={styles["sr-only"]}>
        Click, or press Enter or Space, to take the keyboard.
      </span>
    </button>
  );
}

/** An element ref, such as the result of `useRef`. */
type Surface = { current: HTMLElement | null };

/**
 * Moves focus onto the game surface when it captures the keyboard, so key presses reach the
 * channel's own handlers. The surface needs `tabIndex={-1}` (or 0) and its own key handler.
 *
 * @param surface - The element that handles the game keys.
 * @param captured - `ChannelProps.captured`.
 */
export function useCaptureFocus(surface: Surface, captured: boolean) {
  useEffect(() => {
    if (captured) surface.current?.focus({ preventScroll: true });
  }, [surface, captured]);
}
