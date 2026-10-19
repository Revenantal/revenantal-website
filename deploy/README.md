# Deployment Files

GitHub Actions builds the application. The root Dockerfile packages only the resulting dist/ files and Caddy configuration; Coolify pulls the image without compiling source.

The image runs as UID/GID 10001 on port 8080 with no root privileges. Use the read-only root filesystem, temporary /tmp and read-only runtime-data mount from compose.example.yml. Coolify's edge provides TLS and routes to this internal port; do not publish it directly. Provision /srv/revenantal/live before attaching its mount. Only the live job writes there.

`Caddyfile` serves exactly /live.json from the runtime mount. A missing snapshot returns 404. Other files, including temporary snapshots and private rate baselines, are not exposed. HTML/site.json revalidate; hashed JS/CSS are immutable. Unknown paths and missing assets return 404. Weather routes return an uncached 503 until the reviewed weather service exists; no visitor lookup or upstream weather request is enabled.

## Preparing Hosting Later

1. The production branch is `main` (renamed from `master` on 2026-10-18).
2. Configure main protection to prevent force pushes/deletion and require Checks on PRs while preserving the approved small-fix path. Do not claim protection exists before checking it.
3. Create a Coolify prebuilt-image application for ghcr.io/revenantal/revenantal-site, port 8080, with GHCR pull credentials if private, and the runtime mount above. Use a reviewed SHA tag for manual deploys/rollback. Automatic deploys use latest, promoted only from successful main CI.
4. Configure the GitHub production environment and its protection rules. Store COOLIFY_WEBHOOK and COOLIFY_TOKEN there; never paste them into project files. The workflow calls the configured HTTPS webhook without logging its response body.
5. Run pnpm test:container on a Docker host and check two deployments/rollback against the same runtime directory. Then explicitly set repository variable DEPLOY_ENABLED=true to enable publication and webhook calls. It is disabled by default. Turn it off again to suspend automation.

The deployment workflow checks out the exact SHA from successful push CI, rejects PR/fork runs, skips superseded heads and serializes promotion. A successful container publishing run does not prove the live hostname has deployed; verify its assets/health and record the deployed SHA separately.

Site and one-shot live-job images are prepared, but none have been published. Pelican collection is part of the live job; weather remains unimplemented. Hosting remains disconnected by owner instruction.

## Scheduled Feed Setup (later)

The live-job image contains its own validated site.json from the same build, including private content such as the GitHub exclude list. Use the same verified SHA as the site. Provision /srv/revenantal/live owned by UID/GID 10001 for snapshots and private numeric rate baselines. Copy .env.example to ignored deploy/.env and set SITE_TAG, then copy .env.live.example to ignored deploy/.env.live for runtime credentials. The examples list every setting; add any new variable to them in the same change (a test fails otherwise). GitHub works anonymously; Steam needs its runtime key/ID. Never commit these environment files.

live-job.compose.example.yml runs the image once with a read-only root and its dedicated /data mount. From /opt/revenantal, run:

```sh
docker compose --env-file deploy/.env -f deploy/live-job.compose.example.yml run --rm live
```

Schedule that command every ten minutes with Coolify or the provided systemd service/timer, choosing one scheduler. The service assumes this directory is installed at /opt/revenantal and Docker Compose is available at /usr/bin/docker. Install both unit files into /etc/systemd/system only during hosting setup, then enable the timer. A oneshot service cannot overlap itself. For another scheduler, use a host lock to prevent overlapping runs. The job writes bounded failure codes and exits after an atomic snapshot; one unavailable provider does not stop the others.

Refresh the live-job image/site.json when deploying changed content. Inspect source ages and confirm Caddy serves the new snapshot without exposing private/temporary files. These instructions and timer files have not been installed or verified on a hosting machine.

## Pelican API and Player Counts

The existing ten-minute live job calls Pelican directly. Set PELICAN_URL and the restricted status-bot PELICAN_KEY in ignored .env.live on that host. Set GAME_QUERY_HOST=games.revenantal.com; this is the one shared game hostname, combined with each primary allocation port. Change the environment value if the hostname changes; no rebuild is required. The owner manages bot server assignments manually.

There is no separate Wings agent, image, SSH upload, drop folder or host-test archive. Do not follow the earlier agent setup. No ports or services need to be added to Wings for Pelican API collection. Supported player-count queries need the existing game status/query endpoint to be reachable; Factorio uses its public multiplayer listing service. A failed query leaves optional counts absent while resource data can remain current.

Check the first scheduled run's bounded failure codes, server source age and counts after runtime credentials are configured. No key or game password belongs in chat, Actions build inputs or browser content. pnpm test:pelican covers the standalone job with deidentified fixtures and a real local game query; live credentials/network acceptance remain pending. Hosting is still disconnected.
