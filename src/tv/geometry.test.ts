import { describe, expect, it } from "vitest";
import {
  BADGE,
  DIAL,
  DOOR,
  SCREEN,
  STAGE,
  MIN_ROOM_SCALE,
  boxStyle,
  roomLayout,
  stageScale,
} from "./geometry";
import { NO_SIGNAL, panelGlow, roomGlowOpacity } from "./room-glow";

describe("stage geometry", () => {
  it("fits the stage by its tighter side", () => {
    expect(stageScale(1536, 1024)).toBe(1);
    expect(stageScale(1280, 650)).toBeCloseTo(650 / 1024);
    expect(stageScale(3072, 1024)).toBe(1);
    expect(stageScale(0, 900)).toBe(0);
  });

  it("keeps every part inside the stage", () => {
    for (const box of [SCREEN, DOOR, BADGE]) {
      expect(box.left + box.width).toBeLessThanOrEqual(STAGE.width);
      expect(box.top + box.height).toBeLessThanOrEqual(STAGE.height);
    }
    expect(DIAL.x + DIAL.radius).toBeLessThanOrEqual(STAGE.width);
  });

  it("formats boxes as pixel styles", () => {
    expect(boxStyle(DOOR)).toEqual({
      left: "1284px",
      top: "618px",
      width: "204px",
      height: "73px",
    });
  });
});

describe("room layout", () => {
  const inside = (width: number, height: number) => {
    const layout = roomLayout(width, height);
    expect(layout.stageLeft).toBeGreaterThanOrEqual(-0.001);
    expect(layout.stageTop).toBeGreaterThanOrEqual(-0.001);
    expect(layout.stageLeft + STAGE.width * layout.scale).toBeLessThanOrEqual(
      width + 0.001,
    );
    expect(layout.stageTop + STAGE.height * layout.scale).toBeLessThanOrEqual(
      height + 0.001,
    );
    return layout;
  };

  it("lets the room fill a 16:9 window around a smaller TV", () => {
    const layout = inside(1920, 1080);
    expect(layout.scale).toBeLessThan(stageScale(1920, 1080));
    expect(layout.room.left).toBeLessThanOrEqual(0);
    expect(layout.room.top).toBeLessThanOrEqual(0);
    expect(layout.room.left + layout.room.width).toBeGreaterThanOrEqual(1920);
    expect(layout.room.top + layout.room.height).toBeGreaterThanOrEqual(1080);
  });

  it("grows the TV back to full height on small windows", () => {
    const layout = inside(1280, 650);
    expect(layout.scale).toBeCloseTo(stageScale(1280, 650));
    expect(layout.scale).toBeLessThanOrEqual(MIN_ROOM_SCALE);
  });

  it("never lets the TV overflow, even on ultrawide windows", () => {
    for (const [width, height] of [
      [3440, 1440],
      [1440, 900],
      [2560, 1600],
      [1000, 1400],
    ] as const)
      inside(width, height);
  });
});

describe("room glow", () => {
  it("scales with the channel level and picture brightness", () => {
    const opacity = roomGlowOpacity(NO_SIGNAL, true);
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(0.5 * 1.3);
    expect(
      roomGlowOpacity({ ...NO_SIGNAL, background: "#ffffff", level: 1 }, true),
    ).toBe(1.3);
  });

  it("is off when the viewer or channel turns it off", () => {
    expect(roomGlowOpacity(NO_SIGNAL, false)).toBe(0);
    expect(roomGlowOpacity({ ...NO_SIGNAL, level: false }, true)).toBe(0);
  });

  it("uses a fixed alpha for the panel light", () => {
    expect(panelGlow("rgba(60,90,220,0.5)")).toBe("rgba(60,90,220,0.22)");
    expect(panelGlow("#fff")).toBe("#fff");
  });
});
