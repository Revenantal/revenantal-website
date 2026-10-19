import type { ChannelManifest } from "../../types";

/** A minimal directory channel that follows the contract; tests and documentation only. */
export const sampleManifest: ChannelManifest = {
  id: "sample",
  name: "SAMPLE",
  kind: "directory",
  bg: "#101010",
  glow: "rgba(255,42,54,0.4)",
  safe: true,
  display: { scan: 0.5, transition: "static" },
  audio: { sounds: { blip: { src: "/assets/sounds/blip.m4a", gain: 0.5 } } },
  load: async () => ({
    ChannelComponent: (await import("./SampleChannel")).ChannelComponent,
  }),
};
