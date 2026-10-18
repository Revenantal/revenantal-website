# Live Data

A scheduled job writes `live.json` every 10 minutes. The page fetches that static file once on load. No API runs per visitor, keys never reach the browser, and retained data is always checked for freshness before display.

Type: `Live` in `data-model.md`.

## The Job (`jobs/live/`)

Node + TypeScript, run by a Coolify scheduled task. Image `ghcr.io/revenantal/revenantal-live`.

1. **Steam Web API** (key in env): `GetPlayerSummaries` for online status, `GetRecentlyPlayedGames` for the last two weeks, `GetOwnedGames` for the library count, `GetSteamLevel`.
2. **GitHub REST** (token in env, avoids the 60/hour anonymous limit): `GET /users/revenantal/repos?sort=pushed&per_page=10`, public non-fork repos only.
3. **Project status:** for each project with a URL, an HTTP `HEAD` with a 5 s timeout → `up` (under 1.5 s), `slow`, or `down`. A completed check reporting a timeout or unreachable project is a new down observation; a failure of the job or mapper is a source failure.
4. **Game servers:** validate `/input/servers/servers.json` from the read-only agent drop folder. Its envelope contains `fetchedAt` (the agent observation time) and `servers`. The source `lastSuccessAt` is that observation time, never the file modification time or the time the job rereads it. A sample at least 15 minutes old is stale.
5. Read the previous `/data/live.json` if valid. On each source attempt, record `lastAttemptAt` and whether it `failed`. On success, replace that source and update its `lastSuccessAt`. On failure, retain its previous value and successful timestamp; use `null` if it has never succeeded. One source failure does not discard the others. A successful empty response replaces old data with an empty result.
6. Set aggregate `fetchedAt` to the output write time. Write a temporary file under `/data`, then atomically rename it to `/data/live.json`. This timestamp never proves that an individual source is fresh. Record only bounded public error codes in `errors`; keep raw diagnostics in private logs.

The host runtime directory is mounted read-write at `/data` in the job and read-only at a separate path in Caddy. Never write into the built site directory. Exact mounts and routing: `hosting-and-ci.md` → Runtime Data and Routing.

Env: `STEAM_KEY`, `STEAM_ID`, `GITHUB_TOKEN`. These live only in Coolify, never in Actions or the front end.

## Freshness

The store derives freshness from each source metadata record and the current time. Both TV channels and List mode receive the same filtered view.

| Source         | Maximum age of last successful observation |
| -------------- | ------------------------------------------ |
| Steam          | 30 minutes                                 |
| GitHub         | 30 minutes                                 |
| Project status | 30 minutes                                 |
| Game servers   | 15 minutes, measured from the agent sample |

A source is fresh only when the latest attempt did not fail and its successful observation is younger than its maximum age. At the age limit it becomes stale. Missing metadata, a null/invalid/future timestamp, or missing data makes that source unavailable; it must never be assumed fresh. An empty array or map is valid data, not a missing source.

Keep retained values in the raw snapshot for job recovery, but remove stale Steam/GitHub payloads from the view passed to channels and List mode. Keep source metadata so the UI can say STALE / last updated or unavailable. Project statuses become unknown (clear `Project.status` and omit stale `live.status` readouts). Existing server identities can remain visible, but stale samples become `unknown` and lose players, uptime, ping, password state, CPU, memory, traffic, map, version and schedule/backup readouts; do not count them as running or include their old player totals. Publish a retained address only under the current `showAddress` policy. Missing data never means down or offline.

Recompute age on the shared 20-second clock, and immediately on returning to a visible tab. This is local aging, not a network refresh. It covers a stopped live job and pages left open after their initial fetch. Do not increment sampled uptime or animate traffic from stale samples. Each section labels its own observation age; the aggregate write time must not be labelled as a source last successful update.

## Front-End Rules

- Fetch `/live.json` once at start with `cache: 'no-cache'`. No polling in v1.
- Validate the snapshot at the boundary. An invalid source is unavailable without breaking the rest of a valid snapshot.
- Merge fresh `status` into projects by id. Anything missing or stale renders as unknown, never as down.
- If the fetch or whole-document validation fails, `live = null`. Channels show "—" or hide the live parts.
- The TV must never wait on live data to boot.
- Serve `live.json` with `Cache-Control: max-age=60`.
- Status shows snapshot/source age, not a next-poll countdown. Reloading the page obtains another snapshot; the page makes no automatic update promise.

## Privacy

- Steam data is summary only: status, level, counts, recent game names and hours.
- No friend lists, no player names, no location.

## Testing

- Mappers are unit-tested against saved, redacted responses in `jobs/live/__fixtures__/`.
- A failing source leaves the other sources intact and does not advance its own `lastSuccessAt`.
- A failed first attempt has no prior value; an empty successful result removes old entries.
- A stopped agent ages servers from their original observation time even if the job rereads the same file.
- A stopped job and an open page crossing the 15- or 30-minute boundary both lose fresh status without another fetch. Check the exact boundary and tab resume.
- Missing, malformed and future timestamps never produce a green current-state indicator. Old Steam online status, server players/uptime and project response times cannot leak through filtered props or totals.
- The deployment test verifies atomic replacements remain visible through the directory mount.

## Exception

The TV Guide's local forecast calls `/api/forecast` (see `forecast-and-radar.md`). It is optional and the site works fully without it.
