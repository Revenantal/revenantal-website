import { POWER_LED } from "../geometry";
import styles from "./PowerLed.module.css";

/** Power is owned by the store. */
export type PowerLedProps = {
  power: boolean;
  onPower: (power: boolean) => void;
};

const GLOW = 22;
const HIT = 44;

/**
 * The red power LED: lit while the TV is on, and a toggle button over it.
 *
 * @param props - Power state and action.
 * @param props.power - Whether the TV is on.
 * @param props.onPower - Turns the TV on or off.
 * @returns The LED glow and its button.
 */
export function PowerLed({ power, onPower }: PowerLedProps) {
  const square = (size: number) => ({
    left: `${String(POWER_LED.x - size / 2)}px`,
    top: `${String(POWER_LED.y - size / 2)}px`,
    width: `${String(size)}px`,
    height: `${String(size)}px`,
  });
  return (
    <>
      <div
        className={styles.glow}
        data-on={power}
        aria-hidden="true"
        style={square(GLOW)}
      />
      <button
        type="button"
        className={styles.zone}
        aria-label="Power"
        aria-pressed={power}
        style={square(HIT)}
        onClick={() => {
          onPower(!power);
        }}
      />
    </>
  );
}
