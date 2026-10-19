# Pelican Collector

Runs privately beside Wings, discovering only the servers assigned to status-bot through the Client API. Import shared data types/schemas only; never frontend runtime code.

- client.ts validates and bounds token-only requests, paginates discovery and rejects partial lists.
- schemas.ts projects raw responses into allowed private metadata; commands, variables, SFTP and account fields are discarded.
- mapping.ts converts units and computes network rates from adjacent running samples. Old/reset/missing baselines produce no rate.
- collect.ts isolates resource failures, reapplies current publication policy and replaces the server set after each successful discovery.
- query.ts and query-worker.ts isolate supported local GameDig protocols in a timed child process. Only player counts, ping and password presence leave that process; panel credentials are not inherited.
- output.ts writes validated snapshots atomically and optionally uploads only servers.json through restricted rsync/SSH.
- main.ts supports --list, --once and a non-overlapping two-minute loop. Uploads default off.

The **fixtures** files come from owner-supplied beta38 responses, with identities/addresses replaced and startup content removed or replaced by test sentinels. Never save raw production responses or keys here. See docs/architecture/pelican-agent.md for setup and deployment limits.
