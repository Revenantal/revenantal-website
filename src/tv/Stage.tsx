import type { ComponentChildren } from "preact";
import { STAGE } from "./geometry";
import { useStageScale } from "./use-stage-scale";
import styles from "./Stage.module.css";

/** Stage contents are authored in fixed 1536×1024 stage pixels; the backdrop fills the room around them. */
export type StageProps = {
  children: ComponentChildren;
  backdrop?: ComponentChildren;
};

/**
 * Fits the fixed-size TV stage into the window as one unit, centred and letterboxed.
 *
 * @param props - Stage contents and room backdrop.
 * @param props.children - Layers positioned in stage pixels.
 * @param props.backdrop - Room layers behind the stage, sized from the `--stage-scale` variable.
 * @returns The letterboxed, scaled stage.
 */
export function Stage({ children, backdrop }: StageProps) {
  const { ref, scale } = useStageScale();
  return (
    <div
      className={styles.room}
      ref={ref}
      style={{ "--stage-scale": String(scale) }}
    >
      {backdrop}
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
