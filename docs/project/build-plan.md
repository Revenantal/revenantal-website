# Build Plan

How the site gets built, in order. Each phase ends with a gate. Don't start the next phase until the gate passes. Tick tasks in `status.md`, not here.

Tasks are numbered `phase.task` (e.g. `2.3`). Use the number in branch names and PR titles.

## Order and Why

Build the data pipeline and a useful List mode first, then add the TV shell over the same store. Scaffolding, tooling and CI remain at the start of phase 1. Individual channels still come after both foundations. The site launches with TV Guide, Status and Credits. The heavier channels come after, one at a time, each behind its own gate, so the live site is always shippable. Every dial position without a channel shows NO SIGNAL. Explicit numeric registry keys keep positions stable even when channels are deferred or omitted. Record any omitted channel in `project-decisions.md` and `status.md`; its position stays empty. The lineup remains planned until those choices are made.

```txt
Phase 1  Foundation, data and List → tooling, CI, shared store and data; useful simple directory
Phase 2  TV shell                  → cabinet, controls, effects and audio over the existing store
Phase 3  Launch                    → channel contract, Status, TV Guide, Credits; site goes live
Phase 4  Lighter channels          → Terminal, Rev OS, Coin Drop, The Late Show, Paid Programming
Phase 5  Heavy channels            → Side Quest, Night Drive, Revscape (last)
```

Tooling, pre-commit hooks and CI are set up first (tasks 1.2–1.3) so every line of code is linted from day one.

Asset and content work (sounds, films, clips, fonts) runs alongside phases 1–3, tracked in `asset-checklist.md`.

## Individual Channel Approval

Before implementing each channel, prepare its current plan, check in with the project owner to review it, and wait for explicit confirmation to build. This applies to every channel in phases 3–5, including Credits. The lineup, mockups and phase gates are not implementation approval.

Follow [Before Building a Channel](../channels/channel-rules.md#before-building-a-channel). Record the confirmed scope and approval date in `project-decisions.md` and channel status in `status.md`. If confirmation is missing, declined or unanswered, channel implementation stops. A material scope change requires a renewed review.

## Phase 1 — Foundation, Data and List Mode

| Task | Work                                                                                                                                                                                                                                                                     | Docs                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| 1.1  | Scaffold the repo: Vite + Preact + TypeScript, pnpm, folder layout, path aliases, folder READMEs                                                                                                                                                                         | `development/repo-layout.md`                                     |
| 1.2  | Tooling: ESLint (typescript-eslint, boundaries, jsx-a11y, jsdoc, react-hooks), Prettier, Stylelint, Vitest, size-limit. **Pre-commit hooks** with husky + lint-staged (lint and format staged files, type-check) and a `commit-msg` hook (commitlint, no AI attribution) | `development/coding-practices.md`, `development/git-workflow.md` |
| 1.3  | CI: `ci.yml` (format, lint, typecheck, test, build, size, attribution check) and `deploy.yml` (image to GHCR, Coolify webhook). Configure `main` protection for direct small fixes and PR-based major changes; block force pushes/deletion. Dependabot                   | `architecture/hosting-and-ci.md`                                 |
| 1.4  | Content schemas (zod) and files: projects, buttons, servers, credits and optional broadcast playlists; build merges them into `site.json`                                                                                                                                | `architecture/data-model.md`                                     |
| 1.5  | Store: define shared UI state/actions and persistent captions for the later TV shell; load `site.json` and `live.json`, merge status into projects, typed selectors, missing/stale-data filtering and local aging                                                        | `architecture/overview.md`                                       |
| 1.6  | Live job: Steam, GitHub and status checks write `live.json` every 10 min, with per-source success times, into the separate runtime directory                                                                                                                             | `architecture/live-data.md`                                      |
| 1.7  | Pelican agent: dump a real response, map fields, GameDig, `servers.json` push over rsync                                                                                                                                                                                 | `architecture/pelican-agent.md`                                  |
| 1.8  | Merge `servers.json` into `live.json`, with overrides, `showAddress` and the 15-min stale rule based on agent observation time                                                                                                                                           | `architecture/pelican-agent.md`                                  |
| 1.9  | List mode: complete responsive directory and reduced-motion view; hide the Turn on TV control until phase 2                                                                                                                                                              | `tv/list-mode.md`                                                |
| 1.10 | Real project list, button links and credits in `content/`                                                                                                                                                                                                                | `project/project-brief.md`                                       |

**Gate 1:** tooling, CI and hooks work; List mode shows projects, servers and available live data from the shared store, handles missing/stale data, and passes accessibility checks. The simple directory can ship before the TV exists. Runtime snapshots update without rebuilding the site; an open page still uses one fetch.

## Phase 2 — TV Shell

| Task | Work                                                                                                                                                                                                                                     | Docs                                        |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 2.1  | Asset tools: TV sprite export from the photo, sound pipeline to `.m4a`, font subsetting                                                                                                                                                  | `tv/art-and-assets.md`                      |
| 2.2  | Stage and cabinet: fit and letterbox, photo layers, badge, room glow                                                                                                                                                                     | `tv/README.md`                              |
| 2.3  | Controls: unnumbered dial with dynamic slot count and intentional blanks (click, drag, scroll, keys), drag-tuning, volume, panel buttons, settings door, power LED, hint note, OSD                                                       | `tv/controls.md`                            |
| 2.4  | Screen: implement the approved host-interface types, scoped callbacks and lazy named loaders (full contract tests in 3.1), channel host, explicit position-keyed registry with gaps, lazy loading, static transition, warm-up, NO SIGNAL | `tv/README.md`, `channels/channel-rules.md` |
| 2.5  | Display effects, viewer switches, override lamps, profile resolver, perf fallback                                                                                                                                                        | `tv/display-effects.md`                     |
| 2.6  | Audio engine: unlock, TV sounds, ambient bed, synth fallbacks, manifest sounds/loops and scoped playback lifecycle                                                                                                                       | `tv/audio.md`                               |
| 2.7  | Persistence and URLs                                                                                                                                                                                                                     | `tv/persistence-and-urls.md`                |
| 2.8  | Keyboard and screen-reader pass on the TV                                                                                                                                                                                                | `tv/accessibility.md`                       |

**Gate 2:** the TV uses the existing store and data; every control works by mouse, touch and keyboard; no layout renders dial numerals; dynamic detents, gaps, wraparound and a lineup exceeding twelve slots are verified; every position shows NO SIGNAL until its channel is built. Power-off, narrow screens and reduced motion return to the existing List mode. No individual channel is implemented before its plan review.

## Phase 3 — Launch

| Task | Work                                                                                                                                                | Docs                                    |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 3.1  | Channel contract verification: full host-interface fixtures; actions, captions, saves and stale-scope tests every channel must pass                 | `channels/channel-rules.md`             |
| 3.2  | Channel 10 — Status (rack, displays, selection, camera pan, copy address)                                                                           | `channels/10-status.md`                 |
| 3.3  | Forecast/radar service: trusted proxy, private responses, bounded caches, no identifying logs, timeouts and same-origin radar; own Docker image     | `architecture/forecast-and-radar.md`    |
| 3.4  | Channel 1 — TV Guide: listings, ticker, clock, coming up                                                                                            | `channels/01-tv-guide.md`               |
| 3.5  | TV Guide forecast/radar panel with visible attribution, bundled Natural Earth base map and privacy/failure checks                                   | `channels/01-tv-guide.md`               |
| 3.6  | Channel 11 — Credits: movie-style roll, settings-door tune button, shared credits props, reduced-motion list; credits in List mode and `CREDITS.md` | `channels/11-credits.md`, `tv/audio.md` |
| 3.7  | Launch check: budgets, cross-browser, axe, privacy review                                                                                           | `architecture/hosting-and-ci.md`        |

**Gate 3 — launch:** live on revenantal.com with TV Guide (1), Status (10) and Credits (11); every other position shows NO SIGNAL.

## Phase 4 — Lighter Channels

Each channel is its own release, behind its own gate (contract tests plus a look on the real TV).

| Task | Work                                                                                                    | Adds                 | Docs                              |
| ---- | ------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------- |
| 4.1  | Channel 3 — Terminal                                                                                    | —                    | `channels/03-terminal.md`         |
| 4.2  | Channel 2 — Rev OS                                                                                      | —                    | `channels/02-rev-os.md`           |
| 4.3  | Input capture, PRESS START and saves                                                                    | first game systems   | `channels/channel-rules.md`       |
| 4.4  | Channel 7 — Coin Drop                                                                                   | first physics        | `channels/07-coin-drop.md`        |
| 4.5  | Broadcast player: host-provided playlists, HLS, live schedule, effective volume and persistent captions | first media pipeline | `channels/channel-rules.md`       |
| 4.6  | Channel 8 — The Late Show                                                                               | —                    | `channels/08-late-show.md`        |
| 4.7  | Channel 9 — Paid Programming                                                                            | —                    | `channels/09-paid-programming.md` |

**Gate 4:** input capture, saves and video playback proven on the live site for the channels included in the release. Record any omitted channel-specific work; shared requirements for included channels still apply.

## Phase 5 — Heavy Channels

| Task | Work                                                | Docs                         |
| ---- | --------------------------------------------------- | ---------------------------- |
| 5.1  | Channel 5 — Side Quest                              | `channels/05-side-quest.md`  |
| 5.2  | Channel 4 — Night Drive                             | `channels/04-night-drive.md` |
| 5.3  | Channel 6 — Revscape (three.js, pathfinding) — last | `channels/06-revscape.md`    |

**Gate 5:** all channels selected for v1 live; deferred or omitted channels recorded with their positions left empty; v1 acceptance criteria met for the selected lineup.

## v1 Acceptance Criteria

- Every interaction in `tv/controls.md` works by mouse, touch and keyboard.
- Adding a project to `content/projects.json` in curated mode, or refreshing the approved scheduled GitHub feed in github mode, supplies every directory/game channel and List mode through the shared store with no view changes.
- Registering a channel manifest at an explicit position fills only that position. Launch uses 1, 10 and 11; adding/removing channels preserves gaps, hashes, saved positions and the SERVERS button target. Display profile rules hold and override lamps light correctly.
- Channel host actions, credits/playlists, persistent captions and manifest audio follow `channels/host-interface.md`. Tune-away, hidden tabs and power-off stop media and invalidate stale callbacks.
- With `live.json` missing or malformed the site boots and every channel renders.
- Failed sources keep their own successful observation time. Stopped jobs/agents and open pages aging past the source limits show stale/unknown data without polling or displaying old counters as current.
- Deploying a new site image preserves runtime `live.json` without hiding new HTML/assets; rollback and missing-snapshot behavior are verified.
- Below 900 px, with reduced motion and with the TV off, List mode is complete and passes axe with no serious issues.
- Budgets in `architecture/hosting-and-ci.md` are met; the perf fallback is verified with CPU throttling.
- `ci.yml` green on `main`; merges deploy through `deploy.yml` with no build on Coolify; git history has no AI co-author lines.
- The settings-door Credits button tunes to the movie-style Credits channel. All shared credit entries appear there, in List mode, in Terminal when built, and in `CREDITS.md`. Reduced-motion TV mode shows static credits.

## Definition of Done (every task)

- Format, lint and type-check pass in the pre-commit hook; all checks pass in CI.
- Meets the acceptance points in its doc.
- Works at 1280×650 and in List mode; TV and sound checks apply once the TV shell exists.
- Its doc describes what was built, not the plan.
- `status.md` is ticked.
