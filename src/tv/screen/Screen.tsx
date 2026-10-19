import type { ChannelManifest, ChannelProps } from "@channels/_shared/types";
import { BLOOM_FILTER } from "../effects/BloomFilter";
import { CHANNEL, SCREEN } from "../geometry";
import { ChannelFrame } from "./ChannelFrame";
import type { ChannelFrameProps } from "./ChannelFrame";
import { NoSignal } from "./NoSignal";
import { PowerOff } from "./PowerOff";
import { Snow } from "./Snow";
import { StaticBurst } from "./StaticBurst";
import styles from "./Screen.module.css";

/** How the picture last came on: a quick boot on page load, or a full warm-up. */
export type Boot = { kind: "load" | "warm" | "none"; key: number };

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
  /** Restart key and kind of the power-on animation. */
  boot?: Boot;
  /** Increments each time the viewer turns the TV off, replaying the collapse. */
  offKey?: number;
  /** Drag-tuning distance from the nearest detent, 0 (on it) to 1 (halfway between). */
  detune?: number;
  /** Phosphor bloom on the picture. */
  bloom?: boolean;
  /** Creates each mounted channel's sound scope. */
  createAudioScope?: ChannelFrameProps["createAudioScope"];
};

// Title-safe channels are inset and slightly smaller; full-bleed ones fill the glass.
const FULL = { left: 0, top: 0, scale: SCREEN.width / CHANNEL.width };
const SAFE = { left: 52, top: 38, scale: 1.3 };

/**
 * The picture's CSS filter: phosphor bloom when allowed, plus drag-tuning blur and contrast loss.
 *
 * @param bloom - Whether the bloom filter applies.
 * @param detune - Drag distance from the nearest detent, 0..1.
 * @returns A CSS filter value, or undefined for none.
 */
export function pictureFilter(bloom: boolean, detune: number) {
  const filters = [
    bloom ? BLOOM_FILTER : "",
    detune > 0
      ? `blur(${(detune * 3).toFixed(2)}px) contrast(${(1 - detune * 0.35).toFixed(2)})`
      : "",
  ].filter(Boolean);
  return filters.length ? filters.join(" ") : undefined;
}

/**
 * The channel host inside the glass: 760×570 channel space scaled into the screen, with the
 * static burst between channels, NO SIGNAL for empty positions, and one scoped frame per
 * tuned channel (remounted on each tune so old callbacks and loads are discarded). It also
 * plays the power-on boot or warm-up, the power-off collapse, and drag-tuning distortion.
 *
 * @param props - Power, tuning state, registry entry, channel props and TV actions.
 * @param props.power - Whether the TV is on.
 * @param props.shown - The position on the glass.
 * @param props.switching - Whether the static burst is showing.
 * @param props.visible - Whether the tab is visible.
 * @param props.manifest - The shown position's manifest, or null.
 * @param props.props - Shared channel props from the TV.
 * @param props.broadcast - This channel's playlist, or null.
 * @param props.onTune - Tunes to a channel ID for the scoped host.
 * @param props.onPowerOff - Turns the TV off for the scoped host.
 * @param props.boot - Power-on animation to play.
 * @param props.offKey - Power-off collapse counter.
 * @param props.detune - Drag distance from the nearest detent.
 * @param props.bloom - Whether the phosphor bloom filter applies.
 * @param props.createAudioScope - Creates each channel's sound scope.
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
  boot = { kind: "none", key: 0 },
  offKey = 0,
  detune = 0,
  bloom = false,
  createAudioScope,
}: ScreenProps) {
  if (!power) return offKey > 0 ? <PowerOff key={offKey} /> : null;
  const frame = manifest?.safe && !switching ? SAFE : FULL;
  const running = visible;
  const tuning = {
    filter: pictureFilter(bloom, detune),
    transform:
      detune > 0
        ? `translateX(${(detune * 7 * (shown % 2 ? 1 : -1)).toFixed(1)}px)`
        : undefined,
  };
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
      <div className={styles.degauss} data-boot={boot.kind} key={boot.key}>
        <div className={styles.tube} data-boot={boot.kind}>
          <div style={tuning}>
            {switching ? (
              <StaticBurst running={running} />
            ) : manifest ? (
              <ChannelFrame
                key={shown}
                manifest={manifest}
                props={{ ...props, broadcast, active: visible && detune === 0 }}
                onTune={onTune}
                onPowerOff={onPowerOff}
                createAudioScope={createAudioScope}
              />
            ) : (
              <NoSignal key={shown} running={running} />
            )}
          </div>
        </div>
      </div>
      {detune > 0 ? (
        <div
          className={styles.detune}
          style={{ opacity: (0.15 + detune * 0.75).toFixed(2) }}
        >
          <Snow interval={55} running={running} />
        </div>
      ) : null}
    </div>
  );
}
