/** A positioned box in stage pixels. */
export type Box = { left: number; top: number; width: number; height: number };

/** A circular control in stage pixels. */
export type Circle = { x: number; y: number; radius: number };

/** The fixed authoring size of the TV photo; the stage scales as one unit. */
export const STAGE = { width: 1536, height: 1024 } as const;

/** Channels are authored at this size and scaled into the glass. */
export const CHANNEL = { width: 760, height: 570 } as const;

/** The glass opening behind the transparent screen hole in the frame. */
export const SCREEN: Box = { left: 96, top: 88, width: 1092, height: 816 };

/** Dial knob sprite: 112 px square, pointer at −33.3° in the photo. */
export const DIAL: Circle & { sprite: number; photoAngle: number } = {
  x: 1391,
  y: 211,
  radius: 56,
  sprite: 112,
  photoAngle: -33.3,
};

/** Volume knob: ridged ring sprite with a separate cap on top. */
export const VOLUME = { x: 1392, y: 370, ring: 74, cap: 54 } as const;

/** Button stack area on the control panel. */
export const BUTTONS = { centreX: 1386, top: 424, bottom: 614 } as const;

/** Settings door, hinged on its bottom edge. */
export const DOOR: Box = { left: 1284, top: 618, width: 204, height: 73 };

/** Power LED centre. */
export const POWER_LED = { x: 1455, y: 908 } as const;

/** Chrome spec-plate badge on the bottom strip. */
export const BADGE: Box = { left: 496, top: 964, width: 290, height: 42 };

/**
 * Scale that fits the stage inside a viewport, centred with letterboxing.
 *
 * @param width - Available width in CSS pixels.
 * @param height - Available height in CSS pixels.
 * @returns The uniform scale factor; 0 for an empty viewport.
 */
export function stageScale(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 0;
  return Math.min(width / STAGE.width, height / STAGE.height);
}

/**
 * Converts a box to absolute-position CSS properties.
 *
 * @param box - Stage-pixel box.
 * @returns Inline style values in pixels.
 */
export function boxStyle(box: Box) {
  return {
    left: `${String(box.left)}px`,
    top: `${String(box.top)}px`,
    width: `${String(box.width)}px`,
    height: `${String(box.height)}px`,
  };
}
