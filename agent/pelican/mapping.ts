import { isIP } from "node:net";
import type { LiveServer, ServerOverride } from "../../src/data/types.ts";
import { resourcesSchema } from "./schemas.ts";
import type { PanelServer, QueryResult, QueryTargets } from "./schemas.ts";
/** Previous private counters permit rate calculation across successful adjacent samples. */
export type CounterSample = {
  at: number;
  uptime: number;
  rx: number;
  tx: number;
};
/** Private collection result keeps counters separate from its public server projection. */
export type MappedServer = { server: LiveServer; counter?: CounterSample };
/**
 * Identifies supported local query protocols from an optional egg name or display metadata.
 * @param server - Validated private server metadata.
 * @returns Display game and an optional LAN query protocol.
 */
export function identifyGame(server: PanelServer): {
  game: string;
  query?: string;
} {
  const hint = server.relationships.egg?.attributes.name ?? server.name;
  if (/factorio/i.test(hint)) return { game: "Factorio" };
  if (/minecraft|paper|forge|fabric|pixelmon/i.test(hint))
    return { game: "Minecraft", query: "minecraftvanilla" };
  return { game: server.relationships.egg?.attributes.name ?? "Game server" };
}
/**
 * Resolves an actual allocation address; labels and wildcard bindings are never published.
 * @param server - Validated server metadata.
 * @returns Numeric connect address, if the allocation is usable.
 */
export function allocationAddress(server: PanelServer): string | undefined {
  const allocation = server.relationships.allocations.data.find(
    (item) => item.attributes.is_default,
  )?.attributes;
  if (
    !allocation ||
    !isIP(allocation.ip) ||
    ["0.0.0.0", "::"].includes(allocation.ip)
  )
    return undefined;
  return (
    (isIP(allocation.ip) === 6 ? "[" + allocation.ip + "]" : allocation.ip) +
    ":" +
    String(allocation.port)
  );
}
/**
 * Builds a private query target only for a discovered server and a supported local protocol.
 * @param server - Discovered metadata.
 * @param targets - Private routing overrides, required for wildcard allocations.
 * @param policy - Shared optional server policy.
 * @returns A bounded local query request or null when unsupported/unconfigured.
 */
export function queryTarget(
  server: PanelServer,
  targets: QueryTargets,
  policy?: ServerOverride,
): { host: string; port: number; type: string } | null {
  const allocation = server.relationships.allocations.data.find(
    (item) => item.attributes.is_default,
  )?.attributes;
  const override = targets[server.identifier];
  const host =
    override?.host ??
    (allocation &&
    isIP(allocation.ip) &&
    !["0.0.0.0", "::"].includes(allocation.ip)
      ? allocation.ip
      : undefined);
  const type =
    override?.gamedig ?? policy?.gamedig ?? identifyGame(server).query;
  const port = override?.port ?? allocation?.port;
  if (
    !host ||
    !port ||
    !type ||
    !["minecraftvanilla", "minecraftbedrock", "protocol-valve"].includes(type)
  )
    return null;
  return { host, port, type };
}
/**
 * Converts one validated resource observation into the strictly public server fields.
 * @param metadata - Private identity, limits and allocation metadata.
 * @param raw - Untrusted resource response; null means the query failed.
 * @param now - Observation time in milliseconds.
 * @param previous - Previous adjacent successful counters, kept only in memory.
 * @param policy - Current display/address policy.
 * @param query - Optional sanitized game query result.
 * @returns Public fields plus private counters for the next sample.
 */
export function mapServer(
  metadata: PanelServer,
  raw: unknown,
  now: number,
  previous?: CounterSample,
  policy?: ServerOverride,
  query?: QueryResult,
): MappedServer {
  const server: LiveServer = {
    id: metadata.identifier,
    name: policy?.name ?? metadata.name,
    game: identifyGame(metadata).game,
    state: "unknown",
  };
  const address = allocationAddress(metadata);
  if (policy?.showAddress && address) server.address = address;
  const parsed = resourcesSchema.safeParse(raw);
  const maintenance =
    metadata.is_node_under_maintenance ||
    metadata.is_suspended ||
    metadata.is_installing ||
    ["suspended", "installing", "install_failed", "restoring_backup"].includes(
      metadata.status ?? "",
    );
  if (!parsed.success) {
    if (maintenance) server.state = "maintenance";
    return { server };
  }
  const stats = parsed.data.attributes;
  const resource = stats.resources;
  server.state =
    maintenance || stats.is_suspended
      ? "maintenance"
      : ["running", "starting", "stopping", "offline"].includes(
            stats.current_state,
          )
        ? (stats.current_state as LiveServer["state"])
        : "unknown";
  if (server.state !== "running") return { server };
  // Wings reports uptime in milliseconds and cumulative network bytes, not bytes per second.
  server.uptimeSec = resource.uptime / 1000;
  server.cpuPct = resource.cpu_absolute;
  server.memMb = resource.memory_bytes / 1048576;
  server.memLimitMb = metadata.limits.memory;
  const counter: CounterSample = {
    at: now,
    uptime: resource.uptime,
    rx: resource.network_rx_bytes,
    tx: resource.network_tx_bytes,
  };
  const elapsed = previous ? (now - previous.at) / 1000 : 0;
  if (
    previous &&
    elapsed > 0 &&
    elapsed <= 300 &&
    counter.uptime > previous.uptime &&
    Math.abs(counter.uptime - previous.uptime - elapsed * 1000) <= 5000 &&
    counter.rx >= previous.rx &&
    counter.tx >= previous.tx
  ) {
    server.netRxBps = (counter.rx - previous.rx) / elapsed;
    server.netTxBps = (counter.tx - previous.tx) / elapsed;
  }
  if (query) {
    if (query.numplayers !== undefined) server.players = query.numplayers;
    if (query.maxplayers !== undefined) server.maxPlayers = query.maxplayers;
    if (query.ping !== undefined) server.pingMs = query.ping;
    if (query.password !== undefined) server.passworded = query.password;
  }
  return { server, counter };
}
