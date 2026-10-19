import type { ComponentChildren } from "preact";
import { STAGE } from "./geometry";
import { useRoomLayout } from "./use-room-layout";
import styles from "./Stage.module.css";

/** Stage contents are authored in fixed 1536×1024 stage pixels; the backdrop fills the room around them. */
export type StageProps = {
  children: ComponentChildren;
  backdrop?: ComponentChildren;
};

const px = (value: number) => `${value.toFixed(2)}px`;

/**
 * Places the fixed-size TV stage in the room as one unit. Layout values are exposed to the
 * backdrop as CSS variables: --stage-scale, --stage-left, --stage-top and --room-*.
 *
 * @param props - Stage contents and room backdrop.
 * @param props.children - Layers positioned in stage pixels.
 * @param props.backdrop - Room layers behind the stage.
 * @returns The room with the scaled stage.
 */
export function Stage({ children, backdrop }: StageProps) {
  const { ref, layout } = useRoomLayout();
  const vars = layout
    ? {
        "--stage-scale": String(layout.scale),
        "--stage-left": px(layout.stageLeft),
        "--stage-top": px(layout.stageTop),
        "--room-left": px(layout.room.left),
        "--room-top": px(layout.room.top),
        "--room-width": px(layout.room.width),
        "--room-height": px(layout.room.height),
      }
    : {};
  return (
    <div
      className={styles.room}
      ref={ref}
      style={vars}
      onDragStart={(event) => {
        event.preventDefault();
      }}
    >
      {layout ? backdrop : null}
      <div
        className={styles.stage}
        style={{
          width: `${String(STAGE.width)}px`,
          height: `${String(STAGE.height)}px`,
          transform: layout
            ? `translate(${px(layout.stageLeft)}, ${px(layout.stageTop)}) scale(${String(layout.scale)})`
            : "none",
          visibility: layout ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
