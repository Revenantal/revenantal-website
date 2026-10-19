import type { DisplayProfile } from "@data/types";

/** The viewer's settings-door switches that affect the picture. */
export type ViewerSwitches = {
  scan: boolean;
  flicker: boolean;
  fx: boolean;
  glow: boolean;
};

/** Effects as they apply to what is on the glass right now. */
export type Effects = {
  /** Scanline opacity, 0..1. */
  scan: number;
  flicker: boolean;
  /** Room glow level, 0..1, before picture brightness. */
  glow: number;
  bloom: boolean;
  /** Whether tuning into this picture plays the static burst. */
  static: boolean;
  /** Switches the channel or performance fallback currently limits; drives the amber lamps. */
  limited: { scan: boolean; flicker: boolean; fx: boolean; glow: boolean };
};

/** The empty tube: full scanlines and flicker, half the room glow. */
export const NO_SIGNAL_PROFILE: DisplayProfile = {
  scan: 1,
  flicker: true,
  glow: 0.5,
};

/** Effects input: switches, the shown channel's profile and the TV state. */
export type EffectsInput = {
  viewer: ViewerSwitches;
  profile: DisplayProfile | undefined;
  power: boolean;
  /** Performance fallback level: 0 full, 1 no bloom, 2 no bloom or flicker. */
  perf: number;
  reducedMotion: boolean;
};

/**
 * Resolves display effects in the fixed order viewer OFF > channel OFF > channel strength >
 * default. A channel can turn an effect off or down, never back on. Reduced motion and the
 * performance fallback can only remove effects.
 *
 * @param input - Viewer switches, channel profile, power, performance level and motion setting.
 * @param input.viewer - The viewer's switches.
 * @param input.profile - The shown channel's display profile.
 * @param input.power - Whether the TV is on.
 * @param input.perf - Performance fallback level.
 * @param input.reducedMotion - Whether the viewer prefers reduced motion.
 * @returns The effects to draw and which switches are being limited.
 */
export function resolveEffects({
  viewer,
  profile = {},
  power,
  perf,
  reducedMotion,
}: EffectsInput): Effects {
  const scan = viewer.scan
    ? profile.scan === false
      ? 0
      : clamp(profile.scan ?? 1)
    : 0;
  const channelFlicker = profile.flicker !== false;
  const flicker =
    viewer.flicker && channelFlicker && perf < 2 && !reducedMotion;
  const glow =
    viewer.glow && power
      ? profile.glow === false
        ? 0
        : clamp(profile.glow ?? 1)
      : 0;
  const cut = (profile.transition ?? "static") === "cut";
  return {
    scan,
    flicker,
    glow,
    bloom: profile.bloom !== false && perf < 1,
    static: viewer.fx && !cut && !reducedMotion,
    limited: {
      scan: viewer.scan && scan < 1,
      flicker: viewer.flicker && !flicker,
      fx: viewer.fx && cut,
      glow: viewer.glow && power && glow < 1,
    },
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
