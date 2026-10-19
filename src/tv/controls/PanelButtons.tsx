import { useEffect, useRef, useState } from "preact/hooks";
import type { PanelButton } from "@data/types";
import { BUTTONS } from "../geometry";
import styles from "./PanelButtons.module.css";

/** Buttons come from content; tune buttons ask the TV to change channel by ID. */
export type PanelButtonsProps = {
  buttons: PanelButton[];
  onTune: (channel: string) => void;
  onAnnounce: (message: string) => void;
  /** Press and release, for the button's sounds. */
  onPress?: (phase: "down" | "up") => void;
};

const HOUSING = { width: 142, height: 63 };
// The face sits inside the housing at these fractions of its size.
const FACE = { left: 0.1056, top: 0.1587, width: 0.8028, height: 0.6825 };
const FACES = { cream: "face0", grey: "face1", dark: "face2" } as const;
const COPIED_MS = 1400;

/**
 * Stack geometry: buttons re-space within the panel area and shrink to fit (four at 72%).
 *
 * @param count - Number of buttons.
 * @returns Pitch between rows, scale and first-row offset in stage pixels.
 */
export function stackLayout(count: number) {
  const area = BUTTONS.bottom - BUTTONS.top;
  const pitch = Math.min(64, area / Math.max(count, 1));
  const scale = Math.min(1, (pitch - 2) / HOUSING.height);
  return { pitch, scale, top: BUTTONS.top + (area - count * pitch) / 2 };
}

/**
 * The cabinet's push buttons: links open in a new tab, copy buttons copy their value and
 * show their copied label, and tune buttons change channel. The face sinks when pressed.
 *
 * @param props - Buttons from content and TV actions.
 * @param props.buttons - Panel buttons from site.json.
 * @param props.onTune - Tunes to a channel ID.
 * @param props.onAnnounce - Announces copy results in the TV's live region.
 * @param props.onPress - Reports press and release for sound.
 * @returns The button stack.
 */
export function PanelButtons({
  buttons,
  onTune,
  onAnnounce,
  onPress,
}: PanelButtonsProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
    },
    [],
  );
  const { pitch, scale, top } = stackLayout(buttons.length);
  const width = HOUSING.width * scale;
  const height = HOUSING.height * scale;

  const copy = async (button: PanelButton) => {
    const value = button.copyValue ?? "";
    try {
      await navigator.clipboard.writeText(value);
      window.clearTimeout(timerRef.current);
      setCopied(button.label);
      onAnnounce(`Copied ${value}`);
      timerRef.current = window.setTimeout(() => {
        setCopied(null);
      }, COPIED_MS);
    } catch {
      onAnnounce(`Copy failed. The username is ${value}`);
    }
  };

  return (
    <>
      {buttons.map((button, index) => {
        const box = {
          left: `${String(BUTTONS.centreX - width / 2)}px`,
          top: `${String(top + index * pitch + (pitch - height) / 2)}px`,
          width: `${String(width)}px`,
          height: `${String(height)}px`,
        };
        const label =
          copied === button.label && button.copiedLabel
            ? button.copiedLabel
            : button.label;
        const face = (
          <span className={styles.face} data-face={button.face}>
            <img
              src={`/assets/tv/${FACES[button.face]}.webp`}
              alt=""
              draggable={false}
            />
            <span
              className={styles.label}
              style={{ fontSize: `${(15 * scale).toFixed(1)}px` }}
            >
              {label}
            </span>
          </span>
        );
        const pressHandlers = {
          onPointerDown: () => {
            onPress?.("down");
          },
          onPointerUp: () => {
            onPress?.("up");
          },
        };
        const faceBox = {
          left: `${String(FACE.left * 100)}%`,
          top: `${String(FACE.top * 100)}%`,
          width: `${String(FACE.width * 100)}%`,
          height: `${String(FACE.height * 100)}%`,
        };
        return (
          <div className={styles.housing} style={box} key={button.label}>
            <img
              className={styles.photo}
              src="/assets/tv/housing.webp"
              alt=""
              draggable={false}
            />
            {button.href ? (
              <a
                className={styles.press}
                style={faceBox}
                href={button.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${button.label} (opens in a new tab)`}
                {...pressHandlers}
              >
                {face}
              </a>
            ) : (
              <button
                type="button"
                className={styles.press}
                style={faceBox}
                {...pressHandlers}
                aria-label={
                  button.action === "copy"
                    ? `${label}: copy username`
                    : `${label}: tune to channel`
                }
                onClick={() => {
                  if (button.action === "copy") void copy(button);
                  else if (button.channel) onTune(button.channel);
                }}
              >
                {face}
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}
