import type { ChannelManifest } from "../_shared/types";

/** CH 11 Credits: the movie-style credits roll. Approved by the owner on 2026-10-19. */
export const manifest: ChannelManifest = {
  id: "credits",
  name: "CREDITS",
  kind: "credits",
  bg: "#000000",
  glow: "rgba(255,255,255,0.18)",
  safe: true,
  // "Epic Finale (loop)" by X3nus (CC BY 4.0), credited in content/credits.json.
  audio: {
    loops: {
      music: { src: "/assets/music/credits.m4a", kind: "music", gain: 0.58 },
    },
  },
  load: async () => ({
    ChannelComponent: (await import("./ChannelComponent")).ChannelComponent,
  }),
};
