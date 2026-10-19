import { BlockList, isIP } from "node:net";

/** Ranges that never identify a public visitor. */
const NOT_PUBLIC = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  NOT_PUBLIC.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of [
  ["::", 127],
  ["64:ff9b::", 96],
  ["100::", 64],
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const)
  NOT_PUBLIC.addSubnet(network, prefix, "ipv6");

const familyOf = (address: string) =>
  isIP(address) === 6 ? ("ipv6" as const) : ("ipv4" as const);

/**
 * Normalises an address: strips an IPv4-mapped IPv6 prefix and rejects anything that is not
 * a single literal IP.
 *
 * @param value - Raw address text.
 * @returns The address, or null.
 */
export function normaliseAddress(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(trimmed)?.[1];
  const address = mapped ?? trimmed;
  return isIP(address) ? address : null;
}

/**
 * Whether an address belongs to a public visitor.
 *
 * @param address - A normalised IP address.
 * @returns False for private, loopback, link-local, documentation and other reserved ranges.
 */
export function isPublicAddress(address: string): boolean {
  // IPv4-mapped IPv6 is checked by its IPv4 form after normalising; any other spelling is refused.
  // (A ::ffff:0:0/96 rule would make BlockList match every IPv4 address.)
  if (/^::ffff:/i.test(address)) return false;
  return !NOT_PUBLIC.check(address, familyOf(address));
}

/**
 * Parses trusted peers: exact addresses or CIDR ranges, comma separated.
 *
 * @param value - The TRUSTED_PEERS setting.
 * @returns The peers; empty when unset, which trusts nobody.
 * @throws When an entry is not an address or range.
 */
export function parsePeers(value: string | undefined): BlockList {
  const peers = new BlockList();
  for (const entry of (value ?? "").split(",").map((part) => part.trim())) {
    if (!entry) continue;
    const [network = "", prefix] = entry.split("/");
    const family = isIP(network);
    if (!family) throw new Error(`Invalid trusted peer "${entry}".`);
    if (prefix === undefined) {
      peers.addAddress(network, familyOf(network));
      continue;
    }
    const bits = Number(prefix);
    if (!/^\d+$/.test(prefix) || bits > (family === 6 ? 128 : 32))
      throw new Error(`Invalid trusted peer "${entry}".`);
    peers.addSubnet(network, bits, familyOf(network));
  }
  return peers;
}

/**
 * The visitor's address: X-Real-IP, accepted only when the connection comes from a trusted
 * peer (the app Caddy), and only when it is one public address. Every other address header
 * is ignored. Anything missing or malformed fails closed.
 *
 * @param peer - The socket's remote address.
 * @param realIp - The X-Real-IP header value(s).
 * @param trusted - Trusted peers.
 * @returns The public visitor address, or null.
 */
export function clientAddress(
  peer: string | undefined,
  realIp: string | string[] | undefined,
  trusted: BlockList,
): string | null {
  const from = normaliseAddress(peer);
  if (!from || !trusted.check(from, familyOf(from))) return null;
  if (typeof realIp !== "string") return null;
  const address = normaliseAddress(realIp);
  return address && isPublicAddress(address) ? address : null;
}
