import type { ChannelManifest } from "../../types";

/** A minimal game channel that uses PRESS START; tests and documentation only. */
export const sampleGameManifest: ChannelManifest = {
  id: "sample-game",
  name: "SAMPLE GAME",
  kind: "game",
  bg: "#101010",
  glow: "rgba(255,42,54,0.4)",
  safe: false,
  display: { scan: 0.5, transition: "static" },
  load: async () => ({
    ChannelComponent: (await import("./SampleGame")).ChannelComponent,
  }),
};
