import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import { BlockList, isIP } from "node:net";
import type { Project } from "../../src/data/types.ts";

const blocked = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  blocked.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
  ["2001:db8::", 32],
] as const)
  blocked.addSubnet(network, prefix, "ipv6");

/**
 * Rejects private, local, reserved and documentation addresses before server-side HEAD requests.
 *
 * @param address - A resolved numeric IPv4 or IPv6 address.
 * @returns Whether this address may receive a public project check.
 */
export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  return (
    family !== 0 && !blocked.check(address, family === 4 ? "ipv4" : "ipv6")
  );
}

/**
 * Checks one public project using a pinned DNS result, a deadline and no redirects.
 *
 * @param project - A validated visible directory project.
 * @returns Its measured public status; invalid targets fail the source rather than being contacted.
 */
export async function checkProject(
  project: Project,
): Promise<{ state: "up" | "slow" | "down"; ms?: number }> {
  const url = new URL(project.url);
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    !["", "80", "443"].includes(url.port)
  )
    throw new Error("Invalid project target.");
  const started = performance.now();
  let addresses;
  try {
    addresses = await Promise.race([
      lookup(url.hostname.replace(/^\[|\]$/g, ""), { all: true }),
      new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error("Lookup timeout."));
        }, 5000);
        timer.unref();
      }),
    ]);
  } catch {
    return { state: "down" };
  }
  if (
    addresses.length === 0 ||
    addresses.some((entry) => !isPublicAddress(entry.address))
  )
    throw new Error("Project target is not public.");
  const address = addresses[0];
  if (!address) throw new Error("No public address.");
  const remaining = Math.max(
    1,
    Math.floor(5000 - (performance.now() - started)),
  );
  return new Promise((resolve) => {
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(
      url,
      {
        method: "HEAD",
        lookup: (_host, options, done) => {
          if (options.all) done(null, [address]);
          else done(null, address.address, address.family);
        },
        signal: AbortSignal.timeout(remaining),
      },
      (response) => {
        response.resume();
        const ms = Math.round(performance.now() - started);
        const good =
          (response.statusCode ?? 500) >= 200 &&
          (response.statusCode ?? 500) < 400;
        resolve({ state: good ? (ms < 1500 ? "up" : "slow") : "down", ms });
      },
    );
    request.on("error", () => {
      resolve({ state: "down" });
    });
    request.end();
  });
}
