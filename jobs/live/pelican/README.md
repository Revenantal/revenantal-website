# Pelican Provider

Owns direct server discovery/resource mapping and optional per-server game queries inside the existing ten-minute live job. Import shared data types/schemas only; never frontend code.

client.ts uses bounded token-only HTTPS with pagination. schemas.ts projects raw API responses without commands, variables, SFTP or account data. collect.ts loops through assigned servers with four concurrent workers and isolates resource/query failures. mapping.ts converts units and applies current visibility/address policy.

provider.ts reads private runtime configuration and returns public data directly to the shared collector. state.ts persists only numeric network-counter baselines across job executions. query.ts/query-worker.ts isolate supported GameDig protocols, strip player identities and omit the panel key from the child environment.

GAME_QUERY_HOST is one shared runtime hostname combined with each allocation port. Factorio uses its public listing service; other supported protocols query the game server directly. Unsupported/failed queries leave optional fields absent. No separate agent, SSH upload, server inventory script or panel command permission is needed.

Fixtures are deidentified owner-supplied beta38 responses. Add a fixture and mapping/failure tests before exposing a new field. See docs/architecture/pelican-agent.md for configuration and limits.
