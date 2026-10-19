import { describe, expect, it } from "vitest";
import {
  BADGE,
  DIAL,
  DOOR,
  SCREEN,
  STAGE,
  boxStyle,
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
