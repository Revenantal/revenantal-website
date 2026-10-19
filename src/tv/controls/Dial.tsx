import { useEffect, useRef, useState } from "preact/hooks";
import type { TargetedPointerEvent, TargetedWheelEvent } from "preact";
import { DIAL } from "../geometry";
import {
  nearestDetent,
  pointerAngle,
  stepAngle,
  turnTo,
  unwrapAngle,
  wrapPosition,
} from "./dial-math";
import styles from "./Dial.module.css";

/** The dial reads the current position and asks the store to tune. */
export type DialProps = {
  position: number;
  slots: number;
  label: string;
  onTune: (position: number) => void;
  /** Live drag preview: the nearest position and offset from its detent, or null when released. */
  onDrag?: (preview: { position: number; offset: number } | null) => void;
};

const WHEEL_MS = 140;
const DEAD_ZONE = 6;
const HIT = 110;

/**
 * The unnumbered channel knob: click for next, scroll ±1, drag to tune, arrow keys.
 *
 * @param props - Current position, slot count, accessible label and tune actions.
 * @param props.position - Current dial position.
 * @param props.slots - Number of dial slots, including blanks.
 * @param props.label - What the dial is tuned to, for the accessible name.
 * @param props.onTune - Requests a new position through the store.
 * @param props.onDrag - Receives live drag previews for the screen.
 * @returns The knob sprite and its hit zone.
 */
export function Dial({ position, slots, label, onTune, onDrag }: DialProps) {
  const [turn, setTurn] = useState(position * stepAngle(slots));
  const [dragAngle, setDragAngle] = useState<number | null>(null);
  const shownRef = useRef(position);
  const dragRef = useRef<{ start: number; moved: boolean } | null>(null);
  const draggedRef = useRef(false);
  const lastWheelRef = useRef(0);

  useEffect(() => {
    if (shownRef.current === position) return;
    setTurn((current) => turnTo(current, shownRef.current, position, slots));
    shownRef.current = position;
  }, [position, slots]);

  const step = (delta: number) => {
    onTune(wrapPosition(position + delta, slots));
  };

  const angleOf = (event: PointerEvent) => {
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    return pointerAngle(
      event.clientX - (box.left + box.width / 2),
      event.clientY - (box.top + box.height / 2),
    );
  };

  const onPointerDown = (event: TargetedPointerEvent<HTMLButtonElement>) => {
    dragRef.current = { start: angleOf(event), moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: TargetedPointerEvent<HTMLButtonElement>) => {
    const current = dragRef.current;
    if (!current) return;
    const raw = angleOf(event);
    if (
      !current.moved &&
      Math.abs(((raw - current.start + 540) % 360) - 180) < DEAD_ZONE
    )
      return;
    dragRef.current = { ...current, moved: true };
    const angle = unwrapAngle(raw, dragAngle ?? turn);
    setDragAngle(angle);
    const near = nearestDetent(angle, slots);
    onDrag?.({ position: near.position, offset: near.offset });
  };

  const endDrag = (cancelled: boolean) => {
    const current = dragRef.current;
    dragRef.current = null;
    if (!current?.moved || dragAngle === null) return;
    draggedRef.current = true;
    const near = nearestDetent(dragAngle, slots);
    setDragAngle(null);
    onDrag?.(null);
    if (cancelled) return;
    setTurn(near.turn);
    shownRef.current = near.position;
    if (near.position !== position) onTune(near.position);
  };

  const onClick = () => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    step(1);
  };

  const onWheel = (event: TargetedWheelEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const now = event.timeStamp;
    if (now - lastWheelRef.current < WHEEL_MS) return;
    lastWheelRef.current = now;
    step(event.deltaY > 0 ? 1 : -1);
  };

  const rotation = (dragAngle ?? turn) - DIAL.photoAngle;
  return (
    <>
      <img
        className={styles.knob}
        src="/assets/tv/knob.webp"
        alt=""
        draggable={false}
        style={{
          left: `${String(DIAL.x - DIAL.sprite / 2)}px`,
          top: `${String(DIAL.y - DIAL.sprite / 2)}px`,
          width: `${String(DIAL.sprite)}px`,
          height: `${String(DIAL.sprite)}px`,
          transform: `rotate(${rotation.toFixed(2)}deg)`,
          transition: dragAngle === null ? undefined : "none",
        }}
      />
      <button
        type="button"
        className={styles.zone}
        aria-label={`Channel dial, tuned to ${label}. Click for next, scroll or use the arrow keys to turn.`}
        style={{
          left: `${String(DIAL.x - HIT / 2)}px`,
          top: `${String(DIAL.y - HIT / 2)}px`,
          width: `${String(HIT)}px`,
          height: `${String(HIT)}px`,
        }}
        onClick={onClick}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => {
          endDrag(false);
        }}
        onPointerCancel={() => {
          endDrag(true);
        }}
      />
    </>
  );
}
