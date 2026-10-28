import type { ChannelManifest } from "../_shared/types";

/**
 * One key sound: a CC0 recording credited in content/credits.json.
 *
 * @param name - The file name without its extension.
 * @returns The manifest entry.
 */
const clack = (name: string) => ({
  src: `/assets/sounds/terminal/${name}.m4a`,
  gain: 0.825,
});

/** CH 03 Terminal: boot screen and revenantal.sh shell. Approved by the owner on 2026-10-28. */
export const manifest: ChannelManifest = {
  id: "terminal",
  name: "TERMINAL",
  kind: "directory",
  bg: "#000000",
  glow: "rgba(255, 85, 85, 0.35)",
  safe: true,
  display: {
    scan: 1,
    flicker: true,
    glow: 0.7,
  },
  audio: {
    sounds: {
      "key-1": clack("key-1"),
      "key-2": clack("key-2"),
      "key-3": clack("key-3"),
      "key-4": clack("key-4"),
      "key-5": clack("key-5"),
      "key-6": clack("key-6"),
      enter: clack("enter"),
      back: clack("back"),
    },
  },
  load: async () => ({
    ChannelComponent: (await import("./ChannelComponent")).ChannelComponent,
  }),
};
