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
 * The room photo behind the TV. Its painted TV is covered by the real stage:
 * stage point (x, y) sits at room pixel anchor + (point − cabinet centre) × pixelsPerStage.
 */
export const ROOM = {
  width: 1536,
  height: 1024,
  pixelsPerStage: 0.651,
  anchorX: 772,
  anchorY: 426,
  cabinetX: 767.5,
  cabinetY: 508.5,
} as const;

/** The TV never shrinks below this stage scale to show more room. */
export const MIN_ROOM_SCALE = 0.65;

/** Where the stage and the room photo sit in the window, in CSS pixels. */
export type RoomLayout = {
  scale: number;
  stageLeft: number;
  stageTop: number;
  room: Box;
};

/**
 * Places the TV in the room. The room photo covers the window with the real TV over its
 * painted one; on small windows the TV grows back toward full height so it stays usable.
 * The stage is always fully visible.
 *
 * @param width - Window width in CSS pixels.
 * @param height - Window height in CSS pixels.
 * @returns Stage scale and offsets, and the room photo's box.
 */
export function roomLayout(width: number, height: number): RoomLayout {
  const fit = stageScale(width, height);
  const cover = Math.max(width / ROOM.width, height / ROOM.height);
  const scale = Math.min(
    fit,
    Math.max(cover * ROOM.pixelsPerStage, MIN_ROOM_SCALE),
  );
  const roomScale = scale / ROOM.pixelsPerStage;
  const roomWidth = ROOM.width * roomScale;
  const roomHeight = ROOM.height * roomScale;
  let roomLeft = (width - roomWidth) / 2;
  let roomTop = (height - roomHeight) / 2;
  const originX = ROOM.anchorX - ROOM.cabinetX * ROOM.pixelsPerStage;
  const originY = ROOM.anchorY - ROOM.cabinetY * ROOM.pixelsPerStage;
  let stageLeft = roomLeft + originX * roomScale;
  let stageTop = roomTop + originY * roomScale;
  const clamp = (value: number, max: number) =>
    Math.min(Math.max(value, 0), Math.max(max, 0));
  const dx = clamp(stageLeft, width - STAGE.width * scale) - stageLeft;
  const dy = clamp(stageTop, height - STAGE.height * scale) - stageTop;
  stageLeft += dx;
  stageTop += dy;
  roomLeft += dx;
  roomTop += dy;
  return {
    scale,
    stageLeft,
    stageTop,
    room: {
      left: roomLeft,
      top: roomTop,
      width: roomWidth,
      height: roomHeight,
    },
  };
}

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
