import { DOOR } from "../geometry";
import styles from "./SettingsDoor.module.css";

/** The five viewer switches behind the door. */
export type Switch = "scan" | "flicker" | "fx" | "snd" | "glow";

/** The door reads viewer settings and limits; every change goes through store actions. */
export type SettingsDoorProps = {
  open: boolean;
  settings: Record<Switch, boolean>;
  limited: Partial<Record<Switch, boolean>>;
  creditsAvailable: boolean;
  onDoor: (open: boolean) => void;
  onToggle: (name: Switch) => void;
  onCredits: () => void;
};

const SWITCHES: { name: Switch; label: string; short: string }[] = [
  { name: "scan", label: "Scanlines", short: "SCAN" },
  { name: "flicker", label: "Flicker", short: "FLK" },
  { name: "fx", label: "Static effects", short: "FX" },
  { name: "snd", label: "Sound", short: "SND" },
  { name: "glow", label: "Room glow", short: "GLOW" },
];
const CLOSE_STRIP = 20;

/**
 * The flip-down settings door. Closed, it is one button over the door; open, the door swings
 * down on its bottom hinges to show the switches and the Credits button, and its bottom edge
 * closes it again. Switches are only reachable while the door is open.
 *
 * @param props - Door state, settings, limits and actions.
 * @param props.open - Whether the door is open.
 * @param props.settings - Viewer switch states.
 * @param props.limited - Switches the current channel limits, shown by an amber lamp.
 * @param props.creditsAvailable - Whether the Credits channel is registered.
 * @param props.onDoor - Opens or closes the door.
 * @param props.onToggle - Flips one switch.
 * @param props.onCredits - Tunes to the Credits channel.
 * @returns The door, its compartment and controls.
 */
export function SettingsDoor({
  open,
  settings,
  limited,
  creditsAvailable,
  onDoor,
  onToggle,
  onCredits,
}: SettingsDoorProps) {
  const px = (value: number) => `${String(value)}px`;
  return (
    <>
      <button
        type="button"
        className={styles.zone}
        aria-label="Settings door"
        aria-expanded={open}
        style={{
          left: px(DOOR.left),
          width: px(DOOR.width),
          top: px(open ? DOOR.top + DOOR.height - CLOSE_STRIP / 2 : DOOR.top),
          height: px(open ? CLOSE_STRIP : DOOR.height),
        }}
        onClick={() => {
          onDoor(!open);
        }}
      />
      <div
        className={styles.compartment}
        aria-hidden={!open}
        style={{
          left: px(DOOR.left + 6),
          top: px(DOOR.top + 8),
          width: px(DOOR.width - 12),
          height: px(DOOR.height - 14),
          visibility: open ? "visible" : "hidden",
        }}
      >
        {SWITCHES.map(({ name, label, short }) => {
          const on = settings[name];
          const limit = Boolean(limited[name]);
          return (
            <button
              key={name}
              type="button"
              className={styles.switch}
              aria-label={`${short}: ${label}, ${on ? "ON" : "OFF"}${limit ? ", limited by this channel" : ""}`}
              onClick={() => {
                onToggle(name);
              }}
            >
              <span className={styles.track}>
                <span className={styles.lever} data-on={on} />
              </span>
              <span className={styles.short}>{short}</span>
              <span className={styles.lamp} data-lit={limit} />
            </button>
          );
        })}
        <button
          type="button"
          className={styles.switch}
          aria-label={
            creditsAvailable
              ? "CRD: Credits"
              : "CRD: Credits, not available yet"
          }
          disabled={!creditsAvailable}
          onClick={onCredits}
        >
          <span className={styles.info} aria-hidden="true" />
          <span className={styles.short}>CRD</span>
        </button>
      </div>
      <div
        className={styles.hinge}
        style={{
          left: px(DOOR.left),
          top: px(DOOR.top),
          width: px(DOOR.width),
          height: px(DOOR.height),
        }}
      >
        <img
          className={styles.door}
          data-open={open}
          src="/assets/tv/door.webp"
          alt=""
          draggable={false}
        />
      </div>
    </>
  );
}
