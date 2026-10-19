import type { ComponentChildren } from "preact";
import { STAGE } from "./geometry";
import { useStageScale } from "./use-stage-scale";
import styles from "./Stage.module.css";

/** Stage contents are authored in fixed 1536×1024 stage pixels. */
export type StageProps = { children: ComponentChildren };

/**
 * Fits the fixed-size TV stage into the window as one unit, centred and letterboxed.
 *
 * @param props - Stage contents.
 * @param props.children - Layers positioned in stage pixels.
 * @returns The letterboxed, scaled stage.
 */
export function Stage({ children }: StageProps) {
  const { ref, scale } = useStageScale();
  return (
    <div className={styles.room} ref={ref}>
      <div
        className={styles.stage}
        style={{
          width: `${String(STAGE.width)}px`,
          height: `${String(STAGE.height)}px`,
          transform: `translate(-50%, -50%) scale(${String(scale)})`,
          visibility: scale > 0 ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
