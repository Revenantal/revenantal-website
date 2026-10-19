import { describe, expect, it } from "vitest";
import { manifestProblems } from "./manifest-check";
import type { ChannelManifest } from "./types";

const valid: ChannelManifest = {
  id: "tv-guide",
  name: "TV GUIDE",
  kind: "directory",
  bg: "#06103a",
  glow: "rgba(40,80,255,0.5)",
  safe: true,
  display: {
    scan: 0.6,
    glow: false,
    flicker: false,
    bloom: true,
    transition: "cut",
  },
  audio: {
    sounds: { blip: { src: "/assets/sounds/blip.m4a", gain: 0.4 } },
    loops: {
      music: {
        src: "/assets/music/guide.m4a",
        kind: "music",
        start: "on-active",
      },
    },
  },
  load: () => Promise.reject(new Error("not loaded")),
};

describe("manifest checks", () => {
  it("accepts a complete, valid manifest", () => {
    expect(manifestProblems(valid)).toEqual([]);
  });

  it("names each problem", () => {
    const broken = {
      ...valid,
      id: "TV Guide",
      name: " ",
      kind: "radio",
      bg: "",
      safe: "yes",
      display: {
        scan: 2,
        glow: -1,
        flicker: "on",
        bloom: 1,
        transition: "fade",
      },
      audio: {
        sounds: { remote: { src: "https://example.invalid/a.mp3", gain: 3 } },
        loops: {
          bed: { src: "/assets/bed.m4a", kind: "noise", start: "later" },
        },
      },
    } as unknown as ChannelManifest;
    expect(manifestProblems(broken)).toEqual([
      'invalid channel ID "TV Guide"',
      "name must not be empty",
      'unknown kind "radio"',
      "bg must be a colour",
      "safe must be a boolean",
      "display.scan must be false or 0..1",
      "display.glow must be false or 0..1",
      "display.flicker must be a boolean",
      "display.bloom must be a boolean",
      'display.transition must be "static" or "cut"',
      'audio "remote" must be a same-origin /assets/ file',
      'audio "remote" gain must be 0..1',
      'loop "bed" kind must be "music" or "ambient"',
      'loop "bed" start must be "on-active" or "manual"',
    ]);
  });
});
