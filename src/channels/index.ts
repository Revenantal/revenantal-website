import { createLineup } from "./_shared/lineup";
import type { ChannelRegistry } from "./_shared/types";

/**
 * The sole channel registry: explicit dial positions mapped to manifests. Missing keys and
 * null slots show NO SIGNAL; the highest key sets the dial's slot count. No channel is
 * approved yet, so the launch positions are empty: TV Guide 1, Status 10, Credits 11.
 */
export const registry: ChannelRegistry = { 11: null };

/** The validated lineup the TV reads. */
export const lineup = createLineup(registry, {
  // Phase 2 only: allow an empty lineup until the first channel is approved and registered.
  allowNoChannels: true,
  reserved: { "tv-guide": 1, status: 10, credits: 11 },
});
