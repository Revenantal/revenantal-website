import { useEffect, useState } from "preact/hooks";
import styles from "./ListView.module.css";

/** Copy actions retain selectable text if clipboard access is unavailable. */
export type CopyButtonProps = {
  label: string;
  value: string;
  copiedLabel?: string;
};

/**
 * Copies a public username or opt-in server address with accessible feedback.
 *
 * @param props - Public value and readable button labels.
 * @param props.label - Accessible action label.
 * @param props.value - Public text to copy.
 * @param props.copiedLabel - Successful copy feedback.
 * @returns A button and selectable text with success/failure feedback.
 */
export function CopyButton({
  label,
  value,
  copiedLabel = "Copied",
}: CopyButtonProps) {
  const [status, setStatus] = useState<"ready" | "copied" | "failed">("ready");
  useEffect(() => {
    if (status !== "copied") return;
    const timeout = setTimeout(() => {
      setStatus("ready");
    }, 1400);
    return () => {
      clearTimeout(timeout);
    };
  }, [status]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  };
  return (
    <div className={styles.copy}>
      <button
        className={styles.button}
        type="button"
        onClick={() => {
          void copy();
        }}
        aria-label={`Copy ${label}`}
      >
        {label}
      </button>
      <code className={styles.value}>{value}</code>
      <span className={styles.meta} role="status">
        {status === "copied"
          ? copiedLabel
          : status === "failed"
            ? "Copy unavailable. Select the text to copy it."
            : ""}
      </span>
    </div>
  );
}
