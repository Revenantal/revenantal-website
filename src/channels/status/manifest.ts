import type { ChannelManifest } from "../_shared/types";

/** CH 10 Status: the server rack. Approved by the owner on 2026-10-19. */
export const manifest: ChannelManifest = {
  id: "status",
  name: "STATUS",
  kind: "directory",
  bg: "#0e141c",
  glow: "rgba(79,180,255,0.35)",
  safe: false,
  display: { scan: false, flicker: false, glow: 0.4, transition: "cut" },
  load: async () => ({
    ChannelComponent: (await import("./ChannelComponent")).ChannelComponent,
  }),
};
