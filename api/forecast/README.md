# api/forecast

The private weather service for the TV Guide's forecast and radar panel. It follows the trusted proxy, privacy, caching and provider rules in `docs/architecture/forecast-and-radar.md`, which also lists its settings, responses and verification. Off until the task 3.7 checks pass.

- Build: `pnpm build:forecast` (bundles `main.ts` into `.cache/forecast/main.mjs`).
- City database: `pnpm fetch:dbip` (DB-IP Lite, CC BY 4.0; never committed).
- Run locally: `PORT=8090 TRUSTED_PEERS=127.0.0.1 DBIP_PATH=.cache/forecast/dbip-city-lite.mmdb node .cache/forecast/main.mjs`, then request `/api/forecast` with `Sec-Fetch-Site: same-origin` and `X-Real-IP` set to a public address.

Import shared data types and schemas only.
