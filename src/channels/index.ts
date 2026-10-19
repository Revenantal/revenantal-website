import { createLineup } from "./_shared/lineup";
import type { ChannelRegistry } from "./_shared/types";
import { manifest as status } from "./status/manifest";
import { manifest as tvGuide } from "./tv-guide/manifest";

/**
 * The sole channel registry: explicit dial positions mapped to manifests. Missing keys and
 * null slots show NO SIGNAL; the highest key sets the dial's slot count. Launch positions:
 * TV Guide 1, Status 10, Credits 11 (not built yet).
 */
export const registry: ChannelRegistry = {
  1: tvGuide,
  10: status,
  11: null,
};

/** Approved launch positions; internal buttons can tune to them before the channel exists. */
export const LAUNCH_POSITIONS = {
  "tv-guide": 1,
  status: 10,
  credits: 11,
} as const;

/** The validated lineup the TV reads. */
export const lineup = createLineup(registry, { reserved: LAUNCH_POSITIONS });
