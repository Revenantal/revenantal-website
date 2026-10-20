import { createServer } from "node:http";
import { parsePeers } from "./src/client-address.ts";
import { createForecastSource } from "./src/forecast.ts";
import { createHandler } from "./src/handler.ts";
import { createClientLimiter } from "./src/limits.ts";
import { openLocator } from "./src/locate.ts";
import { createRadarSource } from "./src/radar.ts";
import { parsePeerHosts, trustedPeers } from "./src/trusted-peers.ts";
import { createUpstream } from "./src/upstream.ts";

// The private weather service. Configuration comes only from the environment:
// PORT, TRUSTED_PEERS (the app Caddy's exact address or range), TRUSTED_PEER_HOSTS (its
// service name, looked up every 30 seconds) and DBIP_PATH.
const port = Number(process.env.PORT ?? "8090");
const trust = trustedPeers(
  parsePeers(process.env.TRUSTED_PEERS),
  parsePeerHosts(process.env.TRUSTED_PEER_HOSTS),
);
await trust.refresh();
setInterval(() => void trust.refresh(), 30_000).unref();
const locate = openLocator(process.env.DBIP_PATH ?? "/app/dbip-city-lite.mmdb");
const upstream = createUpstream();
const counts = new Map<string, number>();

const handler = createHandler({
  trusted: trust.peers,
  locate,
  forecast: createForecastSource(upstream),
  radar: createRadarSource(upstream),
  forecastLimit: createClientLimiter(10),
  radarLimit: createClientLimiter(120),
  counts,
});

const server = createServer((request, response) => {
  handler(request, response).catch(() => {
    if (!response.headersSent)
      response.writeHead(500, { "Cache-Control": "private, no-store" });
    response.end();
  });
});
server.headersTimeout = 10_000;
server.requestTimeout = 15_000;
server.listen(port, () => {
  // Startup facts only: no addresses, places or request details are ever logged.
  console.log(
    JSON.stringify({ event: "started", port, cityDatabase: locate !== null }),
  );
});

// Aggregate counts once an hour, then reset.
setInterval(() => {
  if (counts.size === 0) return;
  console.log(
    JSON.stringify({ event: "counts", counts: Object.fromEntries(counts) }),
  );
  counts.clear();
}, 3_600_000).unref();

for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
