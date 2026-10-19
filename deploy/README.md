# Deployment Files

GitHub Actions builds the application. The root Dockerfile packages only the resulting dist/ files and Caddy configuration; Coolify pulls the image without compiling source.

The image runs as UID/GID 10001 on port 8080 with no root privileges. Use the read-only root filesystem, temporary /tmp and read-only runtime-data mount from compose.example.yml. Coolify's edge provides TLS and routes to this internal port; do not publish it directly. Provision /srv/revenantal/live before attaching its mount. Only the live job writes there.

`Caddyfile` serves exactly /live.json from the runtime mount. A missing snapshot returns 404. Other files, including temporary snapshots and the separate agent drop folder, are not exposed. HTML/site.json revalidate; hashed JS/CSS are immutable. Unknown paths and missing assets return 404. Weather routes return an uncached 503 until the reviewed weather service exists; no visitor lookup or upstream weather request is enabled.

## Preparing Hosting Later

1. Complete the PR and migrate the production branch to main deliberately. The existing remote default is master; this work does not rename or push it.
2. Configure main protection to prevent force pushes/deletion and require Checks on PRs while preserving the approved small-fix path. Do not claim protection exists before checking it.
3. Create a Coolify prebuilt-image application for ghcr.io/revenantal/revenantal-site, port 8080, with GHCR pull credentials if private, and the runtime mount above. Use a reviewed SHA tag for manual deploys/rollback. Automatic deploys use latest, promoted only from successful main CI.
4. Configure the GitHub production environment and its protection rules. Store COOLIFY_WEBHOOK and COOLIFY_TOKEN there; never paste them into project files. The workflow calls the configured HTTPS webhook without logging its response body.
5. Run pnpm test:container on a Docker host and check two deployments/rollback against the same runtime directory. Then explicitly set repository variable DEPLOY_ENABLED=true to enable publication and webhook calls. It is disabled by default. Turn it off again to suspend automation.

The deployment workflow checks out the exact SHA from successful push CI, rejects PR/fork runs, skips superseded heads and serializes promotion. A successful container publishing run does not prove the live hostname has deployed; verify its assets/health and record the deployed SHA separately.

Site and one-shot live-job images are prepared, but none have been published. Pelican and weather services remain unimplemented. Hosting remains disconnected by owner instruction.

## Scheduled Feed Setup (later)

The live-job image contains the exact validated site.json from its build. Use the same verified SHA as the site. Provision /srv/revenantal/live owned by UID/GID 10001 and a separate read-only /srv/revenantal/servers input directory. Create deploy/.env containing SITE_TAG and copy .env.live.example to ignored .env.live for runtime credentials. GitHub works anonymously; Steam needs its runtime key/ID. Never commit these environment files.

live-job.compose.example.yml runs the image once with a read-only root and separate output/input mounts. From /opt/revenantal, run:

```sh
docker compose --env-file deploy/.env -f deploy/live-job.compose.example.yml run --rm live
```

Schedule that command every ten minutes with Coolify or the provided systemd service/timer, choosing one scheduler. The service assumes this directory is installed at /opt/revenantal and Docker Compose is available at /usr/bin/docker. Install both unit files into /etc/systemd/system only during hosting setup, then enable the timer. A oneshot service cannot overlap itself. For another scheduler, use a host lock to prevent overlapping runs. The job writes bounded failure codes and exits after an atomic snapshot; one unavailable provider does not stop the others.

Refresh the live-job image/site.json when deploying changed content. Inspect source ages and confirm Caddy serves the new snapshot without exposing input/temporary files. These instructions and timer files have not been installed or verified on a hosting machine.

## Pelican Collector

The agent image and opt-in publication are prepared. For an initial local read-only test without image publication, follow [Pelican setup](pelican-setup.md) and use the upload-disabled test archive. The owner manages status-bot server assignments manually. No monitoring account privileges or assignments are changed by the collector.
