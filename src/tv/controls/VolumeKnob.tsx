import { useRef } from "preact/hooks";
import type {
  TargetedKeyboardEvent,
  TargetedMouseEvent,
  TargetedPointerEvent,
  TargetedWheelEvent,
} from "preact";
import { VOLUME } from "../geometry";
import styles from "./VolumeKnob.module.css";

/** Volume is 0–10, owned by the store. */
export type VolumeKnobProps = {
  volume: number;
  onChange: (volume: number) => void;
};

const WHEEL_MS = 140;
const DRAG_PX = 14;
const HIT = 94;
const DEGREES_PER_STEP = 27;

/**
 * The volume knob: click the left or right half, scroll, drag up or down, or use the keys.
 * The ring's index notch turns ±135°; the cap stays still.
 *
 * @param props - Current volume and change action.
 * @param props.volume - Volume 0–10.
 * @param props.onChange - Requests a new volume through the store.
 * @returns The knob sprites and its slider hit zone.
 */
export function VolumeKnob({ volume, onChange }: VolumeKnobProps) {
  const dragRef = useRef<{ y: number; acc: number; moved: boolean } | null>(
    null,
  );
  const draggedRef = useRef(false);
  const lastWheelRef = useRef(0);
  const set = (next: number) => {
    const clamped = Math.max(0, Math.min(10, next));
    if (clamped !== volume) onChange(clamped);
  };

  const onKeyDown = (event: TargetedKeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowUp: volume + 1,
      ArrowRight: volume + 1,
      ArrowDown: volume - 1,
      ArrowLeft: volume - 1,
      PageUp: volume + 2,
      PageDown: volume - 2,
      Home: 0,
      End: 10,
    };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    set(next);
  };

  const onClick = (event: TargetedMouseEvent<HTMLDivElement>) => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    const box = event.currentTarget.getBoundingClientRect();
    set(volume + (event.clientX < box.left + box.width / 2 ? -1 : 1));
  };

  const onWheel = (event: TargetedWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.timeStamp - lastWheelRef.current < WHEEL_MS) return;
    lastWheelRef.current = event.timeStamp;
    set(volume + (event.deltaY < 0 ? 1 : -1));
  };

  const onPointerDown = (event: TargetedPointerEvent<HTMLDivElement>) => {
    dragRef.current = { y: event.clientY, acc: 0, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: TargetedPointerEvent<HTMLDivElement>) => {
    const current = dragRef.current;
    if (!current) return;
    const acc = current.acc + current.y - event.clientY;
    const steps = Math.trunc(acc / DRAG_PX);
    dragRef.current = {
      y: event.clientY,
      acc: acc - steps * DRAG_PX,
      moved: current.moved || steps !== 0,
    };
    if (steps !== 0) set(volume + steps);
  };

  const onPointerUp = () => {
    if (dragRef.current?.moved) draggedRef.current = true;
    dragRef.current = null;
  };

  const box = (size: number) => ({
    left: `${String(VOLUME.x - size / 2)}px`,
    top: `${String(VOLUME.y - size / 2)}px`,
    width: `${String(size)}px`,
    height: `${String(size)}px`,
  });
  return (
    <>
      <img
        className={styles.ring}
        src="/assets/tv/vol.webp"
        alt=""
        style={{
          ...box(VOLUME.ring),
          transform: `rotate(${String((volume - 5) * DEGREES_PER_STEP)}deg)`,
        }}
      />
      <img
        className={styles.cap}
        src="/assets/tv/cap.webp"
        alt=""
        style={box(VOLUME.cap)}
      />
      <div
        className={styles.zone}
        role="slider"
        tabIndex={0}
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={volume}
        aria-valuetext={volume === 0 ? "Muted" : `${String(volume)} of 10`}
        style={box(HIT)}
        onKeyDown={onKeyDown}
        onClick={onClick}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </>
  );
}
