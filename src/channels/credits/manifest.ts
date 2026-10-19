import type { ChannelManifest } from "../_shared/types";

/** CH 11 Credits: the movie-style credits roll. Approved by the owner on 2026-10-19. */
export const manifest: ChannelManifest = {
  id: "credits",
  name: "CREDITS",
  kind: "credits",
  bg: "#000000",
  glow: "rgba(255,255,255,0.18)",
  safe: true,
  display: { scan: false, flicker: false, glow: 0.3, transition: "cut" },
  load: async () => ({
    ChannelComponent: (await import("./ChannelComponent")).ChannelComponent,
  }),
};
