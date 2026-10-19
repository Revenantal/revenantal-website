# Architecture Overview

A static front end (TypeScript + Preact, built with Vite), one scheduled live-data job, and one small weather service. No server rendering and no database.

## Data Flow

Data flows one way, from sources to every view.

```txt
content/*.json ──build──► site.json ─┐
                                     ├──► store ──► TV ──► current channel (props only)
Steam, GitHub, HEAD checks ─┐        │          └──► List mode
Pelican API + game queries ─┴─job─► live.json ─┘

Visitor IP ──► /api/forecast (DB-IP Lite + Open-Meteo) ──► TV Guide only, optional
```

API keys never leave the server. Content, playlists and live snapshots reach channels through props. The only channel network exceptions are shared broadcast media and the documented optional TV Guide forecast/radar helpers.

## Front-End Modules

| Module               | Owns                                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `content/*.json`     | Hand-edited data, one file per kind: projects, buttons, servers, credits, broadcast playlists. No code.                                |
| `src/data/`          | Types, zod schemas, loaders, and the one store: power, channel, volume, settings, door, hint, perf level                               |
| `src/tv/`            | The cabinet: `Stage` (fit and letterbox), `Cabinet` (photo layers, glow, badge), `Screen` (hosts the channel), `controls/`, `effects/` |
| `src/channels/<id>/` | One folder per channel: manifest, component, styles, test, channel-only code and assets                                                |
| `src/list/`          | List mode, from the same store                                                                                                         |
| `src/audio/`         | Sound loading, one-shots, ambient bed, unlock on first gesture                                                                         |

## Back-End Pieces

| Piece           | Runs on                              | Does                                 | Doc                     |
| --------------- | ------------------------------------ | ------------------------------------ | ----------------------- |
| `jobs/live/`    | Coolify scheduled task, every 10 min | Writes `live.json`                   | `live-data.md`          |
| `api/forecast/` | Coolify, own small image             | Local forecast and same-origin radar | `forecast-and-radar.md` |

## Rules

- Channels get shared data through `ChannelProps`, including credits and their own broadcast playlist. They request tuning/shutdown through scoped `host` callbacks, captions through `setCaptions`, and sound through `play`/`setLoop`. They never import the store, audio, the TV or each other. See `docs/channels/host-interface.md`.
- Controls change state only through store actions (`setChannel`, `setVolume`, `setPower`, `toggleSetting`), so keyboard, mouse and URL changes share one path.
- The TV is authored at a fixed 1536×1024 stage and scaled as one unit. Channels are authored at 760×570 and scaled into the glass.
- `channels/index.ts` maps explicit positive integer positions to channel manifests. Unassigned positions show NO SIGNAL; deferred or omitted channels never renumber the rest.
- Channel modules are lazy-loaded, so first paint only needs the current channel.
- The TV never waits on live data to boot. Missing or stale data renders as unknown, never as down. The store filters values using per-source observation times on the shared clock and tab resume; no polling.
- The app serves immutable build output from its image. Generated `live.json` lives in a separate runtime directory, mounted read-only into the app and read-write into the live job. See `hosting-and-ci.md`.
- The host owns active/visibility state, reduced motion, input capture, audio cleanup and caption persistence. Channels receive `active`, `reducedMotion` and an effective playback volume; leaving a channel invalidates its mutating callbacks.
- Import boundaries are enforced by lint (see `docs/development/repo-layout.md`).

## Related

- `data-model.md` — types for content and channels.
- `docs/channels/channel-rules.md` — the channel contract.
- `docs/tv/README.md` — the TV.
