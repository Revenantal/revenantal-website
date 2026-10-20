import { lookup } from "node:dns/promises";

/** Anything that says whether a connecting address is trusted; a BlockList qualifies. */
export type PeerCheck = {
  check: (address: string, family: "ipv4" | "ipv6") => boolean;
};

/** Resolves a host name to its addresses. */
export type Resolve = (host: string) => Promise<{ address: string }[]>;

const HOST =
  /^(?=.{1,253}$)[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;

/**
 * Parses trusted peer host names, comma separated: service names such as `site`.
 *
 * @param value - The TRUSTED_PEER_HOSTS setting.
 * @returns The names; none when unset.
 * @throws When an entry is not a valid host name.
 */
export function parsePeerHosts(value: string | undefined): string[] {
  const hosts = (value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  for (const host of hosts)
    if (!HOST.test(host))
      throw new Error(`Invalid trusted peer host "${host}".`);
  return hosts;
}

/**
 * Trusted peers from fixed addresses plus host names that are looked up again on each
 * refresh, so a restarted container's new address is followed. A name that does not resolve
 * trusts nobody.
 *
 * @param fixed - Fixed addresses and ranges (from TRUSTED_PEERS).
 * @param hosts - Host names (from TRUSTED_PEER_HOSTS).
 * @param resolve - Name lookup; the system resolver by default.
 * @returns The combined check and a refresh to run on start and periodically.
 */
export function trustedPeers(
  fixed: PeerCheck,
  hosts: string[],
  resolve: Resolve = (host) => lookup(host, { all: true }),
): { peers: PeerCheck; refresh: () => Promise<void> } {
  let resolved = new Set<string>();
  return {
    peers: {
      check: (address, family) =>
        fixed.check(address, family) || resolved.has(address),
    },
    async refresh() {
      const next = new Set<string>();
      for (const host of hosts) {
        try {
          for (const { address } of await resolve(host)) next.add(address);
        } catch {
          // Unresolvable for now: nothing is trusted for it until it resolves.
        }
      }
      resolved = next;
    },
  };
}
