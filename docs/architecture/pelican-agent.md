# Pelican Agent

Game-server status for the Status channel. The Pelican host stays isolated: nothing connects in to it. A small agent on that machine collects status and pushes it out.

## How It Works (`agent/pelican/`)

1. **Pelican Client API**, read locally: list servers with `GET /api/client`, then `GET /api/client/servers/{identifier}/resources` for each → state (running, starting, stopping, offline) and uptime, CPU, memory, network.
2. **GameDig**, also local, against each server's query port → players online, max players, map, ping, password.
3. Every 2 minutes, write `servers.json` with an envelope `{ fetchedAt, servers }`. `fetchedAt` is the ISO time of this collection, not an upload or file modification time. Push it to the Coolify host with `rsync` over SSH, using a key locked to one folder by `rrsync`, so it can do nothing else. Use the default temporary-file-and-rename transfer; do not use `--inplace`.
4. The live job merges `servers.json` into `live.json`, preserving the agent observation time for freshness (see `live-data.md`). If an individual server resource query fails, emit unknown state and omit its old counters rather than presenting an earlier sample as newly collected.

Runs as a Docker container on the Pelican host (Wings already needs Docker), `restart: unless-stopped`. Env: `PELICAN_URL`, `PELICAN_KEY`, `COOLIFY_HOST`; the SSH key is mounted read-only.

## What Pelican Needs

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

Connect addresses come from each server's Pelican allocation (its alias, or IP:port) and are published **only** for servers with `showAddress: true`.

## Server Fields

Pelican kept Pterodactyl's client API. The agent's first task (1.7) is to dump one real response and confirm field names on the installed version.

| Field                      | Source                                  | On the Status rack                                      |
| -------------------------- | --------------------------------------- | ------------------------------------------------------- |
| State, uptime              | Pelican: server resources               | v1: status light, state word, "up 4d"                   |
| Players and max players    | GameDig                                 | v1: "3/20 players"                                      |
| Connect address            | Pelican: allocations (alias or IP:port) | v1, opt-in per server (`showAddress`)                   |
| Ping, password-protected   | GameDig                                 | v1: latency beside the address, padlock icon            |
| CPU %, memory used / limit | Pelican: resources and limits           | v1: two small bars on the display                       |
| Next scheduled restart     | Pelican: schedules (needs permission)   | v1 when present: "restart in 2h"                        |
| Network in / out           | Pelican: resources                      | v1: drive-tray lights blink faster with traffic         |
| Suspended or installing    | Pelican: server list                    | v1: amber MAINTENANCE state                             |
| Map or world, game version | GameDig / startup variables             | Later                                                   |
| Last backup                | Pelican: backups (needs permission)     | Later                                                   |
| Player names               | GameDig                                 | **Never shown.** Other people's names stay off the site |

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
