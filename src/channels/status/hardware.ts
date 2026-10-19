/**
 * Measured rack hardware: sprite files, unit heights and where each light or display sits.
 * Anchors are percent of the sprite's width and height (see docs/channels/10-status.md).
 */

const ASSETS = "/assets/status";

/** Sprite files for each piece of hardware. */
export const SPRITES = {
  cabTop: `${ASSETS}/rack-cab-top.webp`,
  cabMid: `${ASSETS}/rack-cab-mid.webp`,
  blank: `${ASSETS}/rack-blank.webp`,
  patch: `${ASSETS}/rack-patch.webp`,
  switch: `${ASSETS}/rack-switch.webp`,
  server2u: `${ASSETS}/rack-srv2u.webp`,
  tray: `${ASSETS}/rack-tray.webp`,
  ups: `${ASSETS}/rack-ups.webp`,
  server1u: `${ASSETS}/server-1u.webp`,
} as const;

/**
 * The rack is drawn at mockup size and zoomed so the servers fill the glass; the cabinet's
 * sides crop off the edges (owner request, 2026-10-19).
 */
export const ZOOM = 1.4;

/** The visible area in rack pixels, before the zoom. */
export const VIEW = { width: 760 / ZOOM, height: 570 / ZOOM } as const;

/** The cabinet in rack pixels: its left edge, width, top cap and repeating rail slice. */
export const CABINET = {
  left: (760 / ZOOM - 620) / 2,
  width: 620,
  top: 208,
  railPeriod: 183.12,
  /** Where the rack ears begin inside the cabinet, and the width units fill. */
  earLeft: 60,
  unitWidth: 500,
} as const;

/** The kinds of unit that make up the rack, top to bottom. */
export type UnitKind =
  "patch" | "switch" | "blank" | "display" | "server1u" | "server2u" | "ups";

/** Unit heights in channel pixels at the 500 px unit width, plus a 1 px gap below each. */
export const UNIT_HEIGHT: Record<UnitKind, number> = {
  patch: 52,
  switch: 62,
  blank: 50,
  display: 81,
  server1u: 55,
  server2u: 81,
  ups: 85,
};

/** Space between units. */
export const UNIT_GAP = 1;

/** A point on a sprite, in percent. */
export type Anchor = { x: number; y: number };

/** The measured anchors from the spec's table. */
export const ANCHORS = {
  server1u: {
    leds: [
      { x: 10.63, y: 33.5 },
      { x: 10.63, y: 51.4 },
      { x: 10.63, y: 69.5 },
    ],
    readout: { left: 80.8, top: 26, width: 9, height: 47 },
    display: { left: 15.5, top: 17, width: 61, height: 66 },
  },
  server2u: {
    leds: [
      { x: 11.35, y: 33.2 },
      { x: 11.35, y: 49.2 },
      { x: 11.35, y: 65 },
    ],
    display: { left: 16, top: 12, width: 43, height: 76 },
    trays: { left: 62, right: 8.6, top: 10, bottom: 10 },
  },
  display: {
    leds: [
      { x: 88.65, y: 33.2 },
      { x: 88.65, y: 49.2 },
    ],
    sign: { left: 8.5, right: 54.1, top: 12, bottom: 12 },
    lcd: { left: 64.5, top: 32, width: 14.5, height: 35 },
  },
  tray: { led: { x: 49.5, y: 7.8 } },
  switch: {
    led: { x: 8.16, y: 51 },
    ports: { left: 13, right: 7.5, top: 22, bottom: 20 },
  },
  patch: {
    label: { left: 9, top: 9 },
    jacks: { left: 8.6, right: 8.6, top: 40, bottom: 14 },
  },
  ups: {
    readout: { left: 11, top: 26, width: 16.6, height: 48 },
    button: { x: 32.2, y: 37.5 },
    meter: { left: 58, top: 36 },
  },
} as const;

/** Light colours. */
export const COLOURS = {
  up: "#39ff6e",
  slow: "#ffae1a",
  down: "#ff3b3b",
  activity: "#39a8ff",
  projects: "#4fb4ff",
  servers: "#ffae1a",
  power: "#39ff6e",
  unknown: null,
} as const;

/** Patch cable colours, one per used jack. */
export const CABLE_COLOURS = [
  "#c8141e",
  "#2a6ad8",
  "#2a6ad8",
  "#ffd400",
  "#39b54a",
  "#e8e8e8",
  "#c8141e",
  "#2a6ad8",
  "#ff7bd5",
  "#39b54a",
  "#e8e8e8",
  "#ffd400",
] as const;
