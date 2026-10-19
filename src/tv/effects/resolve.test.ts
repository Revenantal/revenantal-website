import { describe, expect, it } from "vitest";
import type { DisplayProfile } from "@data/types";
import { NO_SIGNAL_PROFILE, resolveEffects } from "./resolve";
import type { ViewerSwitches } from "./resolve";

const allOn: ViewerSwitches = {
  scan: true,
  flicker: true,
  fx: true,
  glow: true,
};
const resolve = (
  profile: DisplayProfile | undefined,
  viewer: Partial<ViewerSwitches> = {},
  perf = 0,
  extra: { power?: boolean; reducedMotion?: boolean } = {},
) =>
  resolveEffects({
    viewer: { ...allOn, ...viewer },
    profile,
    power: extra.power ?? true,
    perf,
    reducedMotion: extra.reducedMotion ?? false,
  });

describe("display effect precedence", () => {
  it("defaults every effect on at full strength, except bloom, which channels opt into", () => {
    expect(resolve(undefined)).toMatchObject({
      scan: 1,
      flicker: true,
      glow: 1,
      bloom: false,
      static: true,
      limited: { scan: false, flicker: false, fx: false, glow: false },
    });
  });

  // viewer OFF > channel OFF > channel strength > default, for every combination.
  const scanValues: (number | false | undefined)[] = [
    undefined,
    1,
    0.35,
    0,
    false,
  ];
  for (const viewerOn of [true, false])
    for (const value of scanValues)
      it(`scan: viewer ${viewerOn ? "on" : "off"}, channel ${String(value)}`, () => {
        const result = resolve({ scan: value }, { scan: viewerOn });
        const expected = !viewerOn ? 0 : value === false ? 0 : (value ?? 1);
        expect(result.scan).toBe(expected);
        expect(result.limited.scan).toBe(viewerOn && expected < 1);
      });

  const glowValues: (number | false | undefined)[] = [
    undefined,
    0.8,
    0.5,
    false,
  ];
  for (const viewerOn of [true, false])
    for (const power of [true, false])
      for (const value of glowValues)
        it(`glow: viewer ${viewerOn ? "on" : "off"}, power ${power ? "on" : "off"}, channel ${String(value)}`, () => {
          const result = resolve({ glow: value }, { glow: viewerOn }, 0, {
            power,
          });
          const expected =
            !viewerOn || !power ? 0 : value === false ? 0 : (value ?? 1);
          expect(result.glow).toBe(expected);
          expect(result.limited.glow).toBe(viewerOn && power && expected < 1);
        });

  for (const viewerOn of [true, false])
    for (const channel of [undefined, true, false])
      for (const perf of [0, 1, 2])
        for (const reducedMotion of [false, true])
          it(`flicker: viewer ${String(viewerOn)}, channel ${String(channel)}, perf ${String(perf)}, reduced ${String(reducedMotion)}`, () => {
            const result = resolve(
              { flicker: channel },
              { flicker: viewerOn },
              perf,
              { reducedMotion },
            );
            const expected =
              viewerOn && channel !== false && perf < 2 && !reducedMotion;
            expect(result.flicker).toBe(expected);
            expect(result.limited.flicker).toBe(viewerOn && !expected);
          });

  for (const channel of [undefined, true, false])
    for (const perf of [0, 1, 2])
      it(`bloom: channel ${String(channel)}, perf ${String(perf)}`, () => {
        expect(resolve({ bloom: channel }, {}, perf).bloom).toBe(
          channel === true && perf < 1,
        );
      });

  for (const viewerOn of [true, false])
    for (const transition of [undefined, "static", "cut"] as const)
      for (const reducedMotion of [false, true])
        it(`static: viewer ${String(viewerOn)}, transition ${String(transition)}, reduced ${String(reducedMotion)}`, () => {
          const result = resolve({ transition }, { fx: viewerOn }, 0, {
            reducedMotion,
          });
          expect(result.static).toBe(
            viewerOn && transition !== "cut" && !reducedMotion,
          );
          expect(result.limited.fx).toBe(viewerOn && transition === "cut");
        });

  it("clamps out-of-range strengths and never turns an effect back on", () => {
    expect(resolve({ scan: 3, glow: -1 })).toMatchObject({ scan: 1, glow: 0 });
    expect(resolve({ scan: 1 }, { scan: false }).scan).toBe(0);
  });

  it("limits the glow on NO SIGNAL so its lamp lights", () => {
    expect(resolve(NO_SIGNAL_PROFILE)).toMatchObject({
      scan: 1,
      glow: 0.5,
      limited: { glow: true, scan: false },
    });
  });
});
