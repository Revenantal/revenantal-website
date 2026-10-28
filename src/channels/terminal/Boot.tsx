import type { JSX, TargetedKeyboardEvent } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { BOOT_DURATION_MS, bootFrame, type BootLine } from "./boot";
import styles from "./Terminal.module.css";

/** How often the boot clock advances, in ms. */
const TICK_MS = 50;

/** Keys that never skip the boot: they move focus or only modify other keys. */
const KEEP_KEYS = new Set([
  "Tab",
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

/** Props for the boot screen. */
export type BootProps = {
  /** The boot clock runs only while the channel is on screen. */
  active: boolean;
  /** Called when the boot ends. `focusInput` is true when the viewer was interacting with it. */
  onDone: (focusInput: boolean) => void;
};

/**
 * Joins the class names that are set.
 *
 * @param names - Class names, or undefined for none.
 * @returns One class string.
 */
function classes(...names: (string | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

function renderLine(line: BootLine, index: number): JSX.Element {
  // The logo rows are drawn larger than the text around them.
  const large = line[0]?.[1] === "logo";
  return (
    <div
      key={index}
      className={classes(
        styles["boot-line"],
        large ? styles["boot-logo"] : undefined,
      )}
    >
      {line.length === 0
        ? " "
        : line.map(([text, tone], part) => (
            <span
              key={part}
              className={tone ? styles[`tone-${tone}`] : undefined}
            >
              {text}
            </span>
          ))}
    </div>
  );
}

/**
 * The terminal's power-on screens: a BIOS-style self test, then a loading screen with a
 * progress bar. A click or any key skips it.
 *
 * @param props - Whether the channel is active, and the end-of-boot callback.
 * @param props.active - The boot clock runs only while this is true.
 * @param props.onDone - Called once, when the boot ends or is skipped.
 * @returns The boot overlay.
 */
export function Boot({ active, onDone }: BootProps): JSX.Element {
  const [elapsed, setElapsed] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setElapsed((time) => time + TICK_MS);
    }, TICK_MS);
    return () => {
      clearInterval(timer);
    };
  }, [active]);

  useEffect(() => {
    if (elapsed < BOOT_DURATION_MS || doneRef.current) return;
    doneRef.current = true;
    onDone(rootRef.current?.contains(document.activeElement) ?? false);
  }, [elapsed, onDone]);

  const skip = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone(true);
  };

  const onKeyDown = (event: TargetedKeyboardEvent<HTMLDivElement>) => {
    if (
      KEEP_KEYS.has(event.key) ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    skip();
  };

  const frame = bootFrame(elapsed);

  return (
    <div
      ref={rootRef}
      className={styles.boot}
      data-active={String(active)}
      role="button"
      tabIndex={0}
      onClick={skip}
      onKeyDown={onKeyDown}
    >
      <div aria-hidden="true">
        {frame.lines.map(renderLine)}
        <div className={classes(styles["boot-line"], styles.cursor)}> </div>
      </div>
      <div className={styles["boot-hint"]}>click or press Enter to skip</div>
    </div>
  );
}
