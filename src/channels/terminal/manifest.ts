import type { ChannelManifest } from "../_shared/types";

/** CH 03 Terminal: revenantal.sh phosphor shell. Approved by the owner on 2026-10-28. */
export const manifest: ChannelManifest = {
  id: "terminal",
  name: "TERMINAL",
  kind: "directory",
  bg: "#070303",
  glow: "rgba(255, 42, 54, 0.4)",
  safe: true,
  display: {
    scan: 1,
    flicker: true,
    glow: 0.7,
  },
  load: async () => ({
    ChannelComponent: (await import("./ChannelComponent")).ChannelComponent,
  }),
};
