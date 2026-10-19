# Pelican Agent

Game-server status for the Status channel. The Pelican host stays isolated: nothing connects in to it. A small agent on that machine collects status and pushes it out.

## How It Works (`agent/pelican/`)

1. **Pelican Client API**, read locally: list servers with `GET /api/client`, then `GET /api/client/servers/{uuid}/resources` for each → state (running, starting, stopping, offline) and uptime, CPU, memory, network.
2. **GameDig**, in an isolated child, against configured local Minecraft Java/Bedrock or Valve query ports → player counts, ping and password presence. No raw player list leaves the child. Factorio queries are disabled because that adapter calls an external listing API; Pelican resource monitoring still works. Other protocols are added only after validating their transport and fields.
3. Every 2 minutes, write `servers.json` with an envelope `{ fetchedAt, servers }`. `fetchedAt` is the ISO time of this collection, not an upload or file modification time. Push it to the Coolify host with `rsync` over SSH, using a key locked to one folder by `rrsync`, so it can do nothing else. Use the default temporary-file-and-rename transfer; do not use `--inplace`.
4. The live job merges `servers.json` into `live.json`, preserving the agent observation time for freshness (see `live-data.md`). If an individual server resource query fails, emit unknown state and omit its old counters rather than presenting an earlier sample as newly collected.

Runs as a Docker container on the Pelican host (Wings already needs Docker), `restart: unless-stopped`. Env: PELICAN_URL, PELICAN_KEY, optional COOLIFY_HOST and PUSH_ENABLED; the SSH key is mounted read-only.

## What Pelican Needs

The reported Panel version is **1.0.0-beta38**; a move to v1 is being considered. Begin by signing into the panel and opening `/docs/api`, then selecting the Client API. The beta38 source confirms `GET /api/client` and `GET /api/client/servers/{server}/resources`. Obtain one redacted server entry and its resource response before implementing the mapper. Remove startup commands/variables, SFTP details, names, addresses and credentials; keep the JSON field structure and numeric resource values. Repeat this check after upgrading.

Sources: [installed API documentation](https://pelican.dev/docs/panel/advanced/api-docs/), [beta38 client routes](https://github.com/pelican/panel/blob/v1.0.0-beta38/routes/api-client.php), [versioning and beta migration](https://pelican.dev/docs/versioning/). These references do not certify the installed response shape or grant permission to upgrade.

- A dedicated panel user, `status-bot`, with a **client** API key limited to the agent's address. Never an admin (application) key.
- **Which servers appear = which servers `status-bot` is a subuser on.** Adding or removing a server is done in the panel, not in code. Give it the fewest permissions that still allow reading resources; confirm the exact permission names on the installed Pelican version.
- Schedule and backup read permissions only if those fields are wanted.
- Query enabled on each game server that supports it (e.g. `enable-query` for Minecraft), reachable by the agent on the LAN only.
- Outbound SSH from the Pelican host to the Coolify host. No inbound ports opened.

## Finding Your Servers

- In the Pelican admin area, **Servers** lists every server with its egg (the game). Opening one shows its short identifier in the URL (`/server/1a2b3c4d`).
- Once `status-bot` exists, `agent --list` prints every server it can see with the GameDig type it guessed from the egg, so mismatches are easy to spot.

## Overrides

`content/servers.json` is optional. It only renames, retypes or hides a server (`ServerOverride` in `data-model.md`).

Connect addresses currently use usable numeric Pelican allocation IP:port and are published **only** for servers with showAddress: true. Wildcard bindings and descriptive aliases are omitted. The observed allocations use 0.0.0.0, so no address is invented.

## Server Fields

Pelican kept Pterodactyl's client API. The owner supplied real beta38 list/resources responses. Deidentified fixtures and mapping tests are now in agent/pelican/**fixtures**/. Confirm again after upgrading.

| Field                      | Source                                  | On the Status rack                                       |
| -------------------------- | --------------------------------------- | -------------------------------------------------------- |
| State, uptime              | Pelican: server resources               | v1: status light, state word, "up 4d"                    |
| Players and max players    | GameDig                                 | v1: "3/20 players"                                       |
| Connect address            | Pelican: allocations (alias or IP:port) | v1, opt-in per server (`showAddress`)                    |
| Ping, password-protected   | GameDig                                 | v1: latency beside the address, padlock icon             |
| CPU %, memory used / limit | Pelican: resources and limits           | v1: two small bars on the display                        |
| Next scheduled restart     | Pelican: schedules (needs permission)   | Deferred until its response and permissions are verified |
| Network in / out           | Pelican: resources                      | v1: drive-tray lights blink faster with traffic          |
| Suspended or installing    | Pelican: server list                    | v1: amber MAINTENANCE state                              |
| Map or world, game version | GameDig / startup variables             | Later                                                    |
| Last backup                | Pelican: backups (needs permission)     | Later                                                    |
| Player names               | GameDig                                 | **Never shown.** Other people's names stay off the site  |

Games that don't answer queries simply leave those lines off their display. The exact v1 set is confirmed when channel 10 is built.

## Setup, Step by Step

The two machines are on different networks.

1. **Coolify host:** create a drop user and folder.

   ```bash
   sudo adduser --disabled-password --gecos "" status-drop
   sudo mkdir -p /srv/revenantal/servers
   sudo chown status-drop: /srv/revenantal/servers
   which rrsync   # ships with rsync 3.2.4+; install rsync if missing
   ```

2. **Pelican host:** make a key used for nothing else.

   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/revenantal_status -N "" -C pelican-status
   ```

3. **Coolify host:** add the public key to `/home/status-drop/.ssh/authorized_keys`, locked to write-only uploads into the one folder.

   ```txt
   command="rrsync -wo /srv/revenantal/servers",restrict ssh-ed25519 AAAA… pelican-status
   ```

4. **Pelican host:** test the push. It should succeed, and an `ssh` login with the same key should be refused.

   ```bash
   echo '{}' > /tmp/servers.json
   rsync -e "ssh -i ~/.ssh/revenantal_status" /tmp/servers.json status-drop@COOLIFY_HOST:
   ```

5. **Pelican host:** run the agent container with its env and the key mounted read-only. It loops every 2 minutes.
6. **Coolify:** mount `/srv/revenantal/servers` read-only at `/input/servers` in the live job. Keep this drop folder separate from the runtime output directory `/srv/revenantal/live` and from the built site.
7. **Firewall:** if SSH on the Coolify host only allows known IPs, add the Pelican host's public IP. If that IP changes, rely on the key lock instead.

## Updates

`deploy.yml` builds the agent image. The Pelican host pulls it on its own schedule (Watchtower or a manual `docker compose pull`).

## Verified Local Implementation (2026-10-18)

The owner manually assigned status-bot to the selected servers and declined assignment automation. Zero selected subuser permissions were sufficient for the real server-list and resources tests. Discovery runs each collection, follows bounded pagination and removes unassigned servers after the next successful list. A failed list does not emit an empty replacement or refresh the old output timestamp. One resource failure emits unknown state without old telemetry. Successful empty discovery writes an empty set.

The client sends only a Bearer key with cookies omitted and redirects rejected. It requires HTTPS, bounds each JSON body to 1 MiB and each request to five seconds. Game queries have a six-second child lifetime, no inherited panel secrets and an allowlist of local protocols. Failures omit query fields without declaring a running Pelican server offline.

Wings uptime is milliseconds; convert it to seconds. Memory bytes convert to MiB; the panel memory limit is already MiB. cpu_absolute is already percentage of one core. network_rx_bytes/network_tx_bytes are cumulative: derive bytes/second only from adjacent running samples at most five minutes apart, with increasing uptime consistent with elapsed time and nondecreasing counters. First samples, restarts, missing samples and counter resets have no rates. Private baselines stay in memory and disappear on restart. Source: [Wings uptime contract](https://github.com/pelican/wings/blob/main/environment/environment.go), [GameDig query protocol documentation](https://github.com/gamedig/node-gamedig), [Factorio adapter](https://github.com/gamedig/node-gamedig/blob/master/protocols/factorio.js).

The standalone bundle and real local Minecraft query pass pnpm test:agent, including the public snapshot → live job → shared freshness view and exact expiry. Docker image/permissions, actual panel networking and restricted SSH delivery still require host verification. No production agent or upload is running.

## First Host Test — Uploads Disabled

See deploy/pelican-setup.md for the staged setup. Keep the existing restricted account and manual server assignments. No inbound ports are opened on the Pelican host. Test --list, then --once with PUSH_ENABLED=false before enabling the loop or SSH transfer. Never paste keys or raw panel responses into chat or commit them. The list command shows IDs, names and inferred games only; review these locally.
