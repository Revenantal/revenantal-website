# Pelican Agent Setup

No ports need to be opened on the Pelican host. The collector makes outbound HTTPS requests to the panel. SSH delivery to the website host remains a separate later step.

## Temporary Host Test

The owner has SSH and Docker Compose on the Wings host. Build and package locally with pnpm build, then pnpm agent:package. This creates ignored .cache/pelican-host-test.tar.gz containing standalone application bundles, validated site.json, an environment template and compose.yml. It contains no keys, raw panel responses or SSH material. The archive uses the official pinned Node image, so no custom image publication is needed for this test.

Copy that archive to a private directory on the Wings host using your normal SSH/SCP access. From that directory:

```sh
tar -xzf pelican-host-test.tar.gz
cp .env.pelican.example .env.pelican
chmod 600 .env.pelican
chmod -R a+rX app
sudo install -d -o 10001 -g 10001 -m 0750 data
nano .env.pelican
```

Set PELICAN_URL to the HTTPS panel base URL and PELICAN_KEY to the restricted status-bot Client API key, inside this local file only. Do not copy keys into a shell command, chat, screenshot or repository. Leave all other settings at their defaults. The test Compose file forces PUSH_ENABLED=false regardless of the environment file and has no published ports.

```sh
docker compose -f compose.yml run --rm agent
```

This runs --list and prints only discovered IDs, names and inferred games. Confirm the list matches the manual assignments. A failure returns only agent_configuration_failed; check URL, key, local DNS and HTTPS reachability without printing the key. Do not disable certificate validation.

Then run one collection:

```sh
docker compose -f compose.yml run --rm agent node /app/main.mjs --once
```

The expected log contains event=servers_written, the discovered count, unavailable=0 and pushed=false. Inspect data/servers.json locally if needed; share only those counts/error codes. No existing server files, game settings or panel memberships are changed. The temporary containers exit automatically.

Wildcard allocation addresses are intentionally absent. Factorio resource monitoring works without GameDig. The local test does not configure query routing, player counts, schedules or backups. Those optional fields remain absent until separately configured and tested. Do not open a public query port to fill an optional field.

## Persistent Collector — Later

After the read-only test, use pelican.compose.example.yml with the reviewed agent image SHA once it has been published. That image includes rsync and the SSH client; the temporary test image does not. The default collector loops without overlap, waiting two minutes after a collection. No assignment automation exists: add/remove status-bot manually in Pelican.

Prepare pelican-data owned by UID/GID 10001 and pelican-config/pelican-ssh as private host folders. The latter two mount read-only. Private query-target configuration maps discovered short IDs to actual LAN hosts/ports and optional minecraftvanilla, minecraftbedrock or protocol-valve types. It does not define membership or publish query targets. Wildcard binds need explicit LAN routing; aliases such as a game title are not DNS targets. Unknown protocols remain unavailable.

For uploads, follow the restricted SSH/drop-folder setup in docs/architecture/pelican-agent.md. Mount the dedicated key at /run/ssh/key and independently verified known_hosts at /run/ssh/known_hosts. Ensure UID 10001 can read the key with SSH-appropriate permissions. Strict host-key checking is mandatory; never use automatic unverified trust. Only after the remote restricted folder and separate website mounts are verified, set COOLIFY_HOST=user@host and PUSH_ENABLED=true. The upload uses atomic rsync replacement of servers.json, never --inplace. The remote input file is mode 644; its directory should permit only the drop user to write and the live-job runtime to read. The remote account cannot access site files or live.json.

Actual host collection, image permissions, query routing, SSH restrictions and replacement visibility remain acceptance checks. Hosting is still disconnected. Recheck list/resources responses after any move from beta38 to v1 before updating the running collector.
