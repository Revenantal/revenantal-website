# Deployment

GitHub Actions builds and tests everything and publishes three private images to GHCR. Coolify only pulls and runs them; nothing is compiled on the server.

| Image                                    | Runs                                                            |
| ---------------------------------------- | --------------------------------------------------------------- |
| `ghcr.io/revenantal/revenantal-site`     | Caddy serving the built site on port 8080                       |
| `ghcr.io/revenantal/revenantal-forecast` | The private weather service (port 8090, reachable only by site) |
| `ghcr.io/revenantal/revenantal-live`     | The live-data job, run every ten minutes by Coolify             |

All three run as UID/GID 10001 with a read-only root filesystem, no capabilities and no new privileges. Each is tagged with the tested commit SHA and `latest`.

## How a Deploy Happens

1. A push to `main` passes the Checks workflow.
2. `deploy.yml` builds the three images from that exact commit, pushes them tagged with its SHA, and moves `latest` to them if `main` has not moved on.
3. It calls Coolify's deploy webhook. Coolify pulls `latest` and restarts the services.
4. It deletes older image versions (`tools/deploy/prune-images.ts`), keeping two per package: the current one and one rollback. Each image is one plain manifest (no attestations), and the cleanup never deletes anything a kept image points to.

Publishing runs only when the repository variable `DEPLOY_ENABLED` is `true`. Until the `production` environment has both Coolify secrets, the workflow publishes and skips the webhook with a notice.

## Files

- `coolify.compose.yml`: the Coolify Docker Compose resource (site, forecast, live job, the `live-data` volume and the private `weather` network).
- `Caddyfile`: baked into the site image. Serves exactly `/live.json` from the volume (404 when missing, `max-age=60`), weather routes through to the forecast service, and everything else from the image.
- `.env.live.example`: every live-job setting, for reference and local previews.

## One-Time Setup

### GitHub

1. Create a classic personal access token with only `read:packages`, for Coolify to pull the private images.
2. Set the repository variable `DEPLOY_ENABLED=true`. The next push to `main` publishes the images.
3. After the first publish, set each package to **Private** (package **Settings → Danger Zone → Change visibility**). Packages from a public repository start public. Check: an anonymous manifest request to `ghcr.io` must return 403.

### Coolify

4. **Settings → Advanced → API and MCP:** enable the API (the deploy webhook needs it).
5. **Servers → (server) → Registries:** add the GHCR preset with the GitHub username and the token from step 1, then **Log in**.
6. **+ New Resource → Docker Compose Empty:** paste `coolify.compose.yml`.
7. **Domains:** on the `site` service, `https://revenantal.com:8080,https://www.revenantal.com:8080`. The port tells Coolify's proxy where to send traffic; visitors use plain HTTPS.
8. **Environment Variables:**
   - `SITE_TAG`: `latest` (automatic deploys). A commit SHA pins a version for rollback.
   - `PELICAN_URL`, `PELICAN_KEY`, `GAME_QUERY_HOST`, `STEAM_KEY`, `STEAM_ID` and optional `GITHUB_TOKEN`: the live-job settings (see `.env.live.example`). Deploys are blocked until the two Pelican values are set.
   - `TRUSTED_EDGE` and `FORECAST_UPSTREAM`: leave at their defaults; weather stays off. See Weather below.
9. **Deploy** once and check the site on Coolify's temporary URL.
10. **Scheduled Tasks → + Add:** name `live`, command `node /app/main.mjs`, frequency `*/10 * * * *`, container `live`. Each run writes `live.json` atomically into the volume; one unavailable provider does not stop the others.
11. Copy the resource's **Webhooks → Deploy webhook** URL, and create an API token under **Keys & Tokens → API Tokens** with only the **Deploy** permission.

### GitHub Again

12. **Settings → Environments → production:** limit deployment branches to `main` and add the secrets `COOLIFY_WEBHOOK` and `COOLIFY_TOKEN`. Never paste them into project files.

### DNS

13. Point `revenantal.com` and `www` at the server. Coolify issues the certificates.

## Weather

Weather stays off (an uncached `{"error":"weather_unavailable"}` 503) until both settings are made, after the privacy checks in `docs/architecture/forecast-and-radar.md`:

- `TRUSTED_EDGE`: the exact address of Coolify's proxy as the site container sees it (or the CDN's ranges if one sits in front). Only it may name the visitor's address.
- `FORECAST_UPSTREAM`: `weather-api:8090`, the forecast service's name on the private network.

The forecast service trusts only container addresses on the `weather` network, so nothing else on the server can name a visitor's address to it.

## Rollback

Set `SITE_TAG` to the previous commit SHA (the one other version kept in each package) and redeploy. Set it back to `latest` to resume automatic deploys. The `live-data` volume survives deploys and rollbacks; the job reads its previous snapshot for per-source fallback.

## Checks

`pnpm test:container` (CI) builds the images and checks: two site versions and a rollback against the same live data, denied writes, cache headers, the weather service failing closed, and `coolify.compose.yml` end to end (the job's `live.json` reaches the site through the volume, and only the site reaches weather, as a trusted peer).

## Pelican API and Player Counts

The live job calls Pelican directly with a restricted status-bot key (`PELICAN_KEY`, zero subuser permissions). `GAME_QUERY_HOST` is the shared game hostname, combined with each server's primary allocation port; change the variable, not the image, if it moves. Factorio uses its public multiplayer listing. A failed query leaves optional counts absent while resource data stays current. No key or game password belongs in chat, Actions build inputs or browser content.
