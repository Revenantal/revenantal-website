import type { ChannelManifest } from "../_shared/types";

/** CH 01 TV Guide: the home channel. Approved by the owner on 2026-10-19. */
export const manifest: ChannelManifest = {
  id: "tv-guide",
  name: "TV GUIDE",
  kind: "directory",
  bg: "#0f2170",
  glow: "rgba(70,100,230,0.5)",
  safe: false,
  display: {
    scan: 1,
    flicker: true,
    glow: 0.8,
    transition: "static",
  },
  // "Weather Forecast Type Beat" by YellowTree (CC BY 4.0), credited in content/credits.json.
  audio: {
    loops: {
      music: { src: "/assets/music/tv-guide.m4a", kind: "music", gain: 0.4 },
    },
  },
  load: async () => ({
    ChannelComponent: (await import("./ChannelComponent")).ChannelComponent,
  }),
};
