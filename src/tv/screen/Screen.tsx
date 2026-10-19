import type { ChannelManifest, ChannelProps } from "@channels/_shared/types";
import { CHANNEL, SCREEN } from "../geometry";
import { ChannelFrame } from "./ChannelFrame";
import { NoSignal } from "./NoSignal";
import { StaticBurst } from "./StaticBurst";
import styles from "./Screen.module.css";

/** The glass shows static, NO SIGNAL or the tuned channel. */
export type ScreenProps = {
  power: boolean;
  shown: number;
  switching: boolean;
  visible: boolean;
  manifest: ChannelManifest | null;
  props: Omit<ChannelProps, "host" | "active" | "broadcast">;
  broadcast: ChannelProps["broadcast"];
  onTune: (id: string) => boolean;
  onPowerOff: () => void;
};

// Title-safe channels are inset and slightly smaller; full-bleed ones fill the glass.
const FULL = { left: 0, top: 0, scale: SCREEN.width / CHANNEL.width };
const SAFE = { left: 52, top: 38, scale: 1.3 };

/**
 * The channel host inside the glass: 760×570 channel space scaled into the screen, with the
 * static burst between channels, NO SIGNAL for empty positions, and one scoped frame per
 * tuned channel (remounted on each tune so old callbacks and loads are discarded).
 *
 * @param props - Power, tuning state, registry entry, channel props and TV actions.
 * @param props.power - Whether the TV is on; off shows the bare tube.
 * @param props.shown - The position on the glass.
 * @param props.switching - Whether the static burst is showing.
 * @param props.visible - Whether the tab is visible.
 * @param props.manifest - The shown position's manifest, or null.
 * @param props.props - Shared channel props from the TV.
 * @param props.broadcast - This channel's playlist, or null.
 * @param props.onTune - Tunes to a channel ID for the scoped host.
 * @param props.onPowerOff - Turns the TV off for the scoped host.
 * @returns The screen contents.
 */
export function Screen({
  power,
  shown,
  switching,
  visible,
  manifest,
  props,
  broadcast,
  onTune,
  onPowerOff,
}: ScreenProps) {
  if (!power) return null;
  const frame = manifest?.safe && !switching ? SAFE : FULL;
  const running = visible;
  return (
    <div
      className={styles.space}
      style={{
        left: `${String(frame.left)}px`,
        top: `${String(frame.top)}px`,
        width: `${String(CHANNEL.width)}px`,
        height: `${String(CHANNEL.height)}px`,
        transform: `scale(${String(frame.scale)})`,
      }}
    >
      {switching ? (
        <StaticBurst running={running} />
      ) : manifest ? (
        <ChannelFrame
          key={shown}
          manifest={manifest}
          props={{ ...props, broadcast, active: visible }}
          onTune={onTune}
          onPowerOff={onPowerOff}
        />
      ) : (
        <NoSignal key={shown} running={running} />
      )}
    </div>
  );
}
