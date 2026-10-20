import type { ChannelManifest } from "../_shared/types";

/** CH 07 XBOX: the original Halo main menu. Approved by the owner on 2026-10-20. */
export const manifest: ChannelManifest = {
  id: "xbox",
  name: "XBOX",
  kind: "toy",
  bg: "#000000",
  glow: "rgba(70,110,200,0.35)",
  safe: false,
  // Halo's menu music (Halo © Microsoft; loop by halome.nu), credited in content/credits.json.
  audio: {
    loops: {
      music: { src: "/assets/music/xbox.m4a", kind: "music", gain: 0.58 },
    },
  },
  load: async () => ({
    ChannelComponent: (await import("./ChannelComponent")).ChannelComponent,
  }),
};
