# Local Development

Use Node.js 24 and pnpm 11.9.0, pinned in package.json.

```sh
pnpm install --frozen-lockfile
pnpm live:preview
pnpm dev
```

Open the URL printed by Vite. Desktop windows get the TV; narrow windows get List mode. The preview command runs the real scheduled job once and writes ignored .cache/live-preview files. It fetches public GitHub repositories; Steam and server sources remain unavailable unless configured. The browser reads local snapshots and never calls GitHub. Run the command again, then reload, to obtain newer data. Without a local snapshot the directory still opens with unavailable live sections.

Live data does not refresh by itself locally: load `deploy/.env.live` into the shell and run `pnpm live:preview` again, then reload. Stale data shows as unknown, as it would on the site.

**Weather locally.** Run `pnpm fetch:dbip` once, copy `.env.local.example` to `.env.local` and set `FORECAST_DEV_IP` to a public address (your own for your city). `pnpm dev` then runs the forecast service and proxies the weather routes to it, naming that address the way the production Caddy names the visitor's. Without both, the Guide's forecast window shows "Forecast not available". `.env.local` is git-ignored.

Static content is validated from content/*.json during development and build. Set content/directory.json to curated to use content/projects.json instead of the scheduled GitHub project list. Shared credits also generate CREDITS.md with pnpm credits:write; the build checks that it matches.

## Checks

```sh
pnpm check
```

Runs formatting, ESLint/Stylelint, strict TypeScript, Vitest and production builds, including the 90 kB initial JavaScript gzip limit and the independent live-job bundle. pnpm preview serves the built site. Tests use fixtures, not live credentials.

pnpm test:pelican verifies the standalone scheduled live job, direct Pelican API mapping, public output/freshness and a real local Minecraft query without production keys. Configure PELICAN_URL/PELICAN_KEY at runtime for real collection; GAME_QUERY_HOST supplies the one shared game hostname. No separate collector is installed on Wings.

pnpm test:container requires Docker and verifies image replacement/rollback, runtime mounts, permissions, cache headers and missing-file behavior. CI runs it on Linux. On a machine with an official Caddy binary, set CADDY_BIN and run pnpm test:caddy for the routing checks without Docker; this does not verify container permissions.

Husky installs on pnpm install. Pre-commit lints/formats staged files and type-checks; commit-msg checks Conventional Commits and attribution. Never bypass hooks. Application aliases are @data, @tv, @channels, @list, @audio and @styles. Reference tools retain their independent package under docs/reference/prototypes.

## Hosting

Deployment files are prepared in deploy/. Hosting is disconnected and publishing is disabled until explicitly configured. No individual channel implementation is approved; the TV shell follows the phase 1 gate.
