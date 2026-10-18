# Hosting and CI

GitHub Actions builds, lints and tests everything. Coolify only runs what Actions publishes. Pre-commit hooks run the fast checks locally before code reaches Actions.

## Checks at Each Stage

| Stage                                   | Runs                                                                                                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pre-commit` hook                       | ESLint, Stylelint and Prettier on staged files (auto-fix), `tsc --noEmit`                                                                                                                  |
| `commit-msg` hook                       | commitlint (Conventional Commits), AI attribution check                                                                                                                                    |
| `ci.yml` (every PR and push)            | `pnpm install --frozen-lockfile` → Prettier check → ESLint → Stylelint → `tsc --noEmit` → Vitest → `vite build` → size-limit → attribution check over commits and the PR body when present |
| `deploy.yml` (push to `main`, after CI) | Build site, live job, forecast and Pelican agent images → push to GHCR tagged with commit SHA and `latest` → call the Coolify deploy webhook                                               |

## Hosting on Coolify

- **App:** image `ghcr.io/revenantal/revenantal-site`, Caddy serving the `vite build` output copied into `/srv/site` in the image. No persistent volume mounts over `/srv/site`. Long cache on hashed assets; `no-cache` on `index.html`; `max-age=60` on `/live.json`.
- **Live job:** image `ghcr.io/revenantal/revenantal-live`, Coolify scheduled task every 10 minutes. Bind-mount `/srv/revenantal/live` from the host at `/data` read-write in this container only. Write `/data/live.json` using a temporary file and atomic rename within that directory.
- **Forecast:** image `ghcr.io/revenantal/revenantal-forecast`, routed at `/api/forecast` and `/api/radar/*` through app Caddy, reachable only on its private network. The trusted-peer configuration, cache bypass, log suppression and pre-enable checks in [Forecast and Radar](forecast-and-radar.md) are mandatory.
- **Domains:** `revenantal.com` and `www` → app. Existing subdomains unaffected.
- **Deploy:** Actions calls the webhook; Coolify pulls the new tag and restarts. Rollback = redeploy the previous SHA tag.
- **Broadcast video:** 480p HLS in a media bucket behind a CDN, not in the app image.

## Runtime Data and Routing

Keep the built site and generated data in separate directories:

| Container | Path                   | Contents                                                 | Access                                               |
| --------- | ---------------------- | -------------------------------------------------------- | ---------------------------------------------------- |
| App       | `/srv/site`            | Built HTML, hashed assets and `site.json` from its image | Served by Caddy; never covered by a persistent mount |
| App       | `/srv/revenantal-live` | Host `/srv/revenantal/live`                              | Read-only bind mount                                 |
| Live job  | `/data`                | The same host `/srv/revenantal/live`                     | Read-write bind mount                                |
| Live job  | `/input/servers`       | Host `/srv/revenantal/servers` (agent drop folder)       | Read-only bind mount                                 |

Caddy handles the exact path `/live.json` before the static-site route. That handler uses root `/srv/revenantal-live`, serves `live.json` with `Cache-Control: max-age=60`, and returns 404 if it is missing. It does not fall back to `index.html`. Only that file is exposed from the runtime directory; temporary files and the raw server drop folder have no public route. Keep the existing `/api/forecast` route separate; all site files come from `/srv/site`.

Provision the host directories with permissions that let only the job write live output and let Caddy read it. The agent's SSH drop user remains restricted to `/srv/revenantal/servers` and cannot write site files or `live.json`. Do not bind-mount a single `live.json` file: mounting its directory lets readers see atomic replacements.

Deployment replaces the app image while preserving the runtime directory. The job reads its previous output from `/data/live.json` for per-source fallback. Rollback changes the site image only; the loader must validate runtime data and degrade gracefully if it cannot read that snapshot.

Before task 1.3 is complete, test two different app images against the same populated runtime directory. Confirm the second image serves its new HTML and hashed assets, still serves the saved `/live.json`, and can roll back. Confirm a missing snapshot returns 404, Caddy cannot write runtime data, and temporary/raw input files are unreachable.

## Repo Rules

- Small, focused fixes may be pushed directly to `main`; major features, new channels and substantial changes require a branch and PR. See `docs/development/git-workflow.md` for examples.
- Configure branch protection to permit the direct-fix workflow while blocking force pushes and deletion of `main`. PRs need green CI before merge. Direct fixes run applicable local checks before push, then CI on the pushed commit.
- Deploy only after CI succeeds for the exact `main` commit being deployed, for both direct fixes and merged PRs.
- Dependabot opens weekly update PRs, which go through the same checks.

## Secrets

- Actions holds only `COOLIFY_WEBHOOK` and `COOLIFY_TOKEN`. GHCR uses the built-in `GITHUB_TOKEN`.
- Steam, GitHub and Pelican keys live only in Coolify or on the Pelican host. Never in Actions, never in the repo.

## Tests (Vitest)

- Channel contract: every channel renders from a fixture store, declares a valid display profile, and handles `live = null`.
- Display-profile precedence.
- Store merging of `site.json` + `live.json`.
- Live job and agent mappers against recorded responses.

## Budgets

Laptop, cold cache, good connection. size-limit fails the build on the JS budgets.

| Metric                        | Budget                                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| JS (gzip, initial)            | ≤ 90 KB                                                                                       |
| Each directory channel chunk  | ≤ 30 KB                                                                                       |
| Game and toy code per channel | ≤ 80 KB, art ≤ 120 KB                                                                         |
| Revscape                      | ~150 KB three.js + ≤ 60 KB scene (agreed exception)                                           |
| Images on first paint         | ≤ 160 KB (frame + sprites)                                                                    |
| TV sounds                     | ≤ 250 KB, loaded after first paint                                                            |
| Fonts                         | ≤ 120 KB, `font-display: swap`                                                                |
| TV interactive                | < 1.5 s                                                                                       |
| Frame rate                    | ≥ 50 fps in TV mode with bloom on a 2020-era laptop; the perf fallback covers slower machines |

## Authorship

No AI attribution in commits, PRs, release notes, `CREDITS.md` or the site. The `commit-msg` hook and the CI attribution check both fail on `Co-Authored-By` AI trailers, "Generated with" footers and session links. See `docs/development/git-workflow.md`.
