import type { ChannelManifest } from "../_shared/types";

/** CH 01 TV Guide: the home channel. Approved by the owner on 2026-10-19. */
export const manifest: ChannelManifest = {
  id: "tv-guide",
  name: "TV GUIDE",
  kind: "directory",
  bg: "#0f2170",
  glow: "rgba(70,100,230,0.5)",
  safe: false,
  // No bloom: its filter renders the picture small and enlarges it, blurring the text.
  display: {
    scan: 1,
    flicker: true,
    glow: 0.8,
    bloom: false,
    transition: "static",
  },
  load: async () => ({
    ChannelComponent: (await import("./ChannelComponent")).ChannelComponent,
  }),
};
