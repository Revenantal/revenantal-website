import type { ChannelManifest } from "../_shared/types";

/**
 * CH 06 Revscape: a low-poly 3D town in the style of classic RuneScape. Built in milestones;
 * M1 (look around) approved by the owner on 2026-10-28. Dev-only until the owner says it is
 * ready for position 6.
 */
export const manifest: ChannelManifest = {
  id: "revscape",
  name: "REVSCAPE",
  kind: "game",
  bg: "#000000",
  glow: "rgba(120, 160, 70, 0.35)",
  safe: false,
  display: {
    scan: 0.4,
    flicker: false,
    glow: 0.7,
  },
  load: async () => ({
    ChannelComponent: (await import("./ChannelComponent")).ChannelComponent,
  }),
};
