/** What the screen currently shows, as far as the room light is concerned. */
export type Picture = {
  /** Picture background colour, `#rrggbb`. */
  background: string;
  /** Light colour thrown into the room, any CSS colour. */
  glow: string;
  /** Channel glow preference: 0..1, or false to turn it off. */
  level: number | false;
};

/** The empty tube before any channel is built. */
export const NO_SIGNAL: Picture = {
  background: "#2a2a2a",
  glow: "rgba(200, 200, 200, 0.25)",
  level: 0.5,
};

function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map(
    (channel) => {
      const c = channel / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    },
  );
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/**
 * The glow colour at the fixed alpha used for the light on the control panel.
 *
 * @param glow - An `rgba(r, g, b, a)` colour.
 * @returns The same colour with alpha 0.22; other formats are returned unchanged.
 */
export function panelGlow(glow: string): string {
  return glow.replace(/[\d.]+\s*\)$/, "0.22)");
}

/**
 * Opacity of the room spill: viewer switch × channel preference × picture brightness.
 *
 * @param picture - The current picture.
 * @param enabled - Viewer GLOW switch and power both on.
 * @returns Spill opacity, 0 when off.
 */
export function roomGlowOpacity(picture: Picture, enabled: boolean): number {
  if (!enabled || picture.level === false) return 0;
  const brightness = Math.min(
    1.3,
    0.55 + Math.sqrt(luminance(picture.background)) * 1.3,
  );
  return picture.level * brightness;
}
