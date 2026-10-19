# Pelican Collection

Pelican is publicly reachable. The existing ten-minute live job calls its Client API directly; there is no separate agent, SSH transfer or servers.json input. Code lives in jobs/live/pelican/.

## Collection

1. PELICAN_URL and PELICAN_KEY configure the restricted status-bot Client API account at runtime. Requests use HTTPS, omit browser cookies, reject redirects and bound response size/time.
2. GET /api/client/?include=egg discovers all assigned servers, following validated pagination. The owner manages assignments manually with zero selected subuser permissions, verified on Panel 1.0.0-beta38.
3. Loop through discovered UUIDs and read /api/client/servers/{uuid}/resources, with at most four servers in flight. Shared content/servers.json controls names, visibility, protocol overrides and address publication.
4. For a running server with a supported protocol, combine the single GAME_QUERY_HOST setting with that server's primary allocation port. The owner confirmed games.revenantal.com as the shared hostname; changing it later is a runtime configuration change. Never infer the host from SFTP metadata or a descriptive allocation alias.
5. Query player counts, maximum players, ping and password presence using GameDig in a bounded child process. The supported protocols are Minecraft Java, Minecraft Bedrock, Valve and Factorio. Panel credentials are not inherited by query children; player names and raw query data never leave them.
6. Return sanitized servers directly to the live job, which writes live.json atomically. Browser visitors fetch only that static snapshot.

Pelican's standard resource response has no player counts. Looping over it yields state/resources; game query results supply the additional fields. Public panel access does not prove public game-query reachability. A failed query omits those fields and never changes a running Pelican server to offline. Unknown games remain resource-only until a verified protocol override is supplied.

## Factorio

GameDig's Factorio adapter queries Factorio's public multiplayer listing service using the resolved game address and allocation port. A server must be listed there for this method to work. It returns counts and password presence; raw player identities are stripped. Its measured ping is a listing-service request time, so do not expose it as game-server ping. No RCON access, command permission or game-server password is required.

Source: [GameDig Factorio adapter](https://github.com/gamedig/node-gamedig/blob/master/protocols/factorio.js). Other games use their direct status/query protocols. Use the same scheduled host rather than adding a service to the Wings machine.

## Units and Freshness

Wings uptime is milliseconds and converts to seconds. Memory bytes convert to MiB; the panel memory limit is already MiB. cpu_absolute is already percentage of one core, and may exceed 100. Raw cumulative network bytes are never presented as bytes/second.

Private numeric baselines persist in /data/pelican-state.json across scheduled executions. Calculate an average rate only across running samples at most fifteen minutes apart, with monotonic counters and uptime consistent with elapsed time. Missing/reset/old baselines produce no rate. Failed per-server resources remove that baseline. The private state file is mode 600 and has no public Caddy route; only live.json is served from that directory.

Server source age is measured conservatively from the scheduled collection start, independent of final file write time. A source failure retains its previous success time and becomes stale immediately. Fresh server observations expire after fifteen minutes; a resource failure within otherwise successful discovery produces unknown state without old telemetry. Successful empty discovery removes old servers. Failed/partial discovery does not publish an empty replacement.

## Privacy and Publication

The client projects metadata into an allowlist before mapping. Commands, variables, SFTP, account fields, passwords and player identities never enter live.json or private counter state. Only deidentified owner-supplied beta38 fixtures are tracked. Keep API keys only in the scheduled job's runtime environment.

Addresses are published only under showAddress=true and only when Pelican supplies a usable numeric allocation. Wildcard 0.0.0.0/:: binds and descriptive labels are not connect addresses. GAME_QUERY_HOST routes queries without automatically publishing a connect address. Schedules/backups and optional map/version fields remain absent until verified separately; do not increase the bot's permissions for player counts.

## Setup and Verification

Configure the existing live job using deploy/.env.live.example. Set PELICAN_URL to the panel base URL, PELICAN_KEY to the restricted bot key, and GAME_QUERY_HOST to the single game hostname. The existing /data mount is sufficient; no agent input mount or SSH key is needed. Do not commit .env.live or paste the key into chat.

pnpm check validates code and builds the site/live job. pnpm test:pelican runs the standalone bundled job against deidentified API fixtures, checks its output through shared freshness filtering, and performs a real local Minecraft query. Tests use no production credentials. Caddy routing checks confirm private counter state stays unreachable.

The owner verified real beta38 list/resources responses. Actual scheduled-host authentication and player-count reachability still require runtime configuration/testing; no production job or hosting connection has been enabled. Recheck the responses after an upgrade to v1. Sources: [beta38 routes](https://github.com/pelican/panel/blob/v1.0.0-beta38/routes/api-client.php), [Pelican API docs](https://pelican.dev/docs/panel/advanced/api-docs/), [Wings uptime](https://github.com/pelican/wings/blob/main/environment/environment.go).
