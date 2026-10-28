import { createLineup } from "./_shared/lineup";
import type { ChannelRegistry } from "./_shared/types";
import { manifest as credits } from "./credits/manifest";
import { manifest as revscape } from "./revscape/manifest";
import { manifest as status } from "./status/manifest";
import { manifest as terminal } from "./terminal/manifest";
import { manifest as tvGuide } from "./tv-guide/manifest";
import { manifest as xbox } from "./xbox/manifest";

/**
 * Whether the dev-only Revscape channel is registered at position 6 (owner decision,
 * 2026-10-28): in the dev server, or in a build made with `VITE_REVSCAPE_PREVIEW=1`
 * (`pnpm size:revscape`). Production builds leave position 6 as NO SIGNAL and drop the channel.
 */
const PREVIEW =
  import.meta.env.DEV || import.meta.env.VITE_REVSCAPE_PREVIEW === "1";

/**
 * The sole channel registry: explicit dial positions mapped to manifests. Missing keys and
 * null slots show NO SIGNAL; the highest key sets the dial's slot count. Launch positions:
 * TV Guide 1, Status 10, Credits 11; XBOX 7, Terminal 3 (Phase 4).
 */
export const registry: ChannelRegistry = {
  1: tvGuide,
  3: terminal,
  ...(PREVIEW ? { 6: revscape } : {}),
  7: xbox,
  10: status,
  11: credits,
};

/** Approved launch positions; internal buttons can tune to them before the channel exists. */
export const LAUNCH_POSITIONS = {
  "tv-guide": 1,
  status: 10,
  credits: 11,
} as const;

/** The validated lineup the TV reads. */
export const lineup = createLineup(registry, { reserved: LAUNCH_POSITIONS });
