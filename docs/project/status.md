# Status

What is built and where things are. Tick an item when its task has reached `main`, through a PR or an allowed direct fix. Update **Current focus** whenever it changes.

**Current focus:** Finish phase 1 verification and review. Foundation is committed; deployment files, shared data and GitHub-backed List mode are implemented locally. Hosting is deferred by owner instruction; Pelican collection is now implemented against supplied beta38 responses; its host test is next.

**Last updated:** 2026-10-18

## Planning and Design — done

- [x] Brief, decisions and dev spec, split into `docs/`
- [x] Original ten-channel lineup, concepts and rules
- [x] TV picked, cut and prototyped: dial, buttons, settings door, effects, sounds (`reference/prototypes/door-tv.dc.html`)
- [x] Mockups for every channel, including TV Guide variants and Status rack options (`reference/mockups/`)
- [x] Status rack sprites generated and cleaned (`reference/assets/rack/`)
- [x] Live data, Pelican agent and forecast architecture
- [x] Build order and plan (`build-plan.md`)
- [x] TV sounds sourced and credited (`reference/sound-credits.md`)

## Phase 1 — Foundation, Data and List Mode

- [ ] 1.1 Scaffold repo — implemented locally; awaiting PR/merge
- [ ] 1.2 Tooling and pre-commit hooks — implemented locally; awaiting PR/merge
- [ ] 1.3 CI, deploy, branch protection — files prepared and native routing verified; Docker/remote settings and hosting pending
- [ ] 1.4 Content schemas and files — implemented locally
- [ ] 1.5 Store and shared UI actions — implemented and tested locally
- [ ] 1.6 Live job — implemented; real public GitHub feed verified locally; host scheduler not installed
- [ ] 1.7 Pelican agent — implemented and fixture-tested locally; host/container/SSH verification pending
- [ ] 1.8 Server merge and overrides — implemented and fixture-tested locally
- [ ] 1.9 List mode — implemented; desktop/mobile browser and axe checks pass locally
- [ ] 1.10 Real project list, links and credits — scheduled GitHub navigation, public links and shared credits implemented locally
- [ ] **Gate 1**

## Phase 2 — TV Shell

- [ ] 2.1 Asset tools (sprites, sounds, fonts)
- [ ] 2.2 Stage and cabinet
- [ ] 2.3 Controls and compact dial
- [ ] 2.4 Screen and channel host
- [ ] 2.5 Display effects
- [ ] 2.6 Audio engine
- [ ] 2.7 Persistence, URLs and TV/List transitions
- [ ] 2.8 TV accessibility pass
- [ ] **Gate 2**

## Phase 3 — Launch

- [ ] 3.1 Channel contract and tests
- [ ] 3.2 Channel 10 — Status
- [ ] 3.3 Forecast endpoint
- [ ] 3.4 Channel 1 — TV Guide
- [ ] 3.5 TV Guide forecast and radar
- [ ] 3.6 Channel 11 — Credits and shared attributions
- [ ] 3.7 Launch check
- [ ] **Gate 3 — launch**

## Phase 4 — Lighter Channels

- [ ] 4.1 Terminal
- [ ] 4.2 Rev OS
- [ ] 4.3 Input capture and saves
- [ ] 4.4 Coin Drop
- [ ] 4.5 Broadcast player
- [ ] 4.6 The Late Show
- [ ] 4.7 Paid Programming
- [ ] **Gate 4**

## Phase 5 — Heavy Channels

- [ ] 5.1 Side Quest
- [ ] 5.2 Night Drive
- [ ] 5.3 Revscape
- [ ] **Gate 5 — v1 complete**

## Foundation Build (2026-10-18)

Started on `feat/1.1-foundation` from baseline `7b03e00`. Added Preact/Vite, strict TypeScript, module aliases and ownership READMEs, CSS Modules/tokens, a static holding screen, pinned dependencies/lockfile, lint/format/test/size checks, Husky/lint-staged/commitlint, attribution enforcement and CI/Dependabot definitions. No real content, services, TV shell or individual channels are implemented.

Local lint, type-check and 18 policy tests pass. The initial production JavaScript is about 5.2 kB gzipped against the 90 kB budget. Browser checks at 1280×650 and 390×844 with reduced motion show HTTP 200, the expected main/heading, no horizontal overflow, no console errors and no external requests. The installed commit-msg hook accepts a valid message and rejects a co-author trailer. The full `pnpm check` command and the installed pre-commit hook passed; staged whitespace checks are clean.

No task is checked off because the feature has not reached `main`; no remote CI result, deployment or phase gate is claimed.

## Data and List Build (2026-10-18)

Foundation commit: 501216a on feat/1.1-foundation. Added validated content compilation, shared store/loaders, independent freshness, a one-shot live job, safe project checks, server policy merging and the complete List view. GitHub supplies ten recent public repository links through the approved scheduled feed; the browser makes one same-origin request per snapshot and no provider calls.

Prepared non-root site/live-job Dockerfiles, opt-in CI publication, separate runtime mounts, a one-shot Compose job and a ten-minute host timer. Native Caddy routing checks passed for two site versions and rollback, atomic snapshot replacement, cache headers, unavailable weather and missing-file 404. Docker is unavailable locally; container permission checks remain for Docker-enabled CI. Hosting is disconnected and no publication, scheduler installation or remote protection changes have occurred.

Local browser checks passed at 1280×650 and 390×844, including reduced motion, real GitHub data, 0/1/30 projects, missing/malformed live data, no horizontal overflow and no axe violations. Further browser checks passed for clock expiry without polling, retained stale navigation with unknown status, keyboard skip navigation, clipboard success/denial, blocked storage and the actual built site served under Caddy/CSP. The complete pnpm check passed: formatting, lint, strict types, 74 tests and both production builds. Initial JavaScript is about 37.3 kB gzipped against 90 kB. Steam and game servers remain unavailable without runtime configuration; no observations are invented. The Pelican agent and remote acceptance keep Gate 1 open. No TV shell or individual channel is built.

## Pelican Collector Build (2026-10-18)

Implemented token-only bounded/paginated discovery, strict private projections, real-response resource mapping, adjacent-sample network rates, independent resource failure handling, manual-membership discovery, isolated local GameDig queries, atomic public snapshots and opt-in restricted SSH upload. Startup commands/variables, SFTP fields, raw responses and player identities do not enter output. Only deidentified real-response fixtures are tracked.

Prepared a non-root read-only container, private environment/mount examples and disabled-by-default transfer. Standalone bundled execution and local Minecraft protocol checks pass through the live job and shared freshness view; unit coverage includes pagination, malformed/oversized responses, failed sources, resets, revocation and atomic output. The full pnpm check passes with 94 tests, all static checks and site/live/agent production builds. The host-test archive is prepared; the owner confirmed SSH and Docker Compose are available on the Wings machine. The build does not contact the real panel, install services, open ports, publish images or enable uploads. Host/container/SSH acceptance and v1 migration checks remain pending; Gate 1 stays open.

## Channel Build Approvals

All individual channel builds are awaiting plan review and explicit owner confirmation, including TV Guide, Status and Credits. Existing design statuses below describe design progress, not permission to implement. Record each confirmed channel scope and date in `project-decisions.md` and note its approval here.

## Channel Status at a Glance

| Ch  | Name             | Design                                                   | Build             |
| --- | ---------------- | -------------------------------------------------------- | ----------------- |
| 1   | TV Guide         | Mockup done (v3 with forecast and radar)                 | Not started (3.4) |
| 2   | Rev OS           | Mockup done                                              | Not started (4.2) |
| 3   | Terminal         | Approved early sketch                                    | Not started (4.1) |
| 4   | Night Drive      | Mockup done; needs a cleaner, less "paint" look at build | Not started (5.2) |
| 5   | Side Quest       | Mockup done                                              | Not started (5.1) |
| 6   | Revscape         | 3D prototype done                                        | Not started (5.3) |
| 7   | Coin Drop        | Mockup done                                              | Not started (4.4) |
| 8   | The Late Show    | Mockup done                                              | Not started (4.6) |
| 9   | Paid Programming | Mockup done; clips not made                              | Not started (4.7) |
| 10  | Status           | Rack design and sprites done                             | Not started (3.2) |
| 11  | Credits          | Movie-style roll specified; no mockup yet                | Not started (3.6) |

## Latest Review (2026-10-18)

Data and List mode now precede the TV shell; scaffolding/tooling/CI stay first. Task numbers and gates have been updated. Compact/laptop TV layouts hide dial numerals. Film selection stays open until The Late Show plan review. The root README is written as the finished TV operating manual; this file remains the source of actual build progress.

Reference tools now have an isolated pinned package and lockfile. All 14 static boards and the 3D scene were rendered successfully, and the rack generator was exercised. Canvas-dependent interactive references remain explicitly canvas-only. These changes are local and have not reached `main`; no channel build is approved or complete.

## Channel Interface Review (2026-10-18)

Resolved the shared channel-interface plan in `channels/host-interface.md`: data/credits/playlists, tuning/shutdown, persistent captions, active/reduced-motion state, scoped audio loops, input capture, versioned saves and named lazy loaders. Updated the dependent specs and build tasks. The documented types passed strict TypeScript checking with valid consumers and ten negative assertions. F04/F05 are resolved at the specification level; implementation/lifecycle tests are still pending, and no individual channel build is approved or marked complete.

## Design Follow-up

Specified the Credits channel locally on 2026-10-18: the settings-door Credits button tunes to position 11 for a movie-style roll of shared attributions, with pause/restart and static reduced-motion support. Launch task 3.6 now includes this channel. The change has not been merged and no build task is complete.

## Expandable Dial and Audit Follow-up (2026-10-18)

- [x] Remove dial numerals in all layouts; specify dynamic slot count, gaps, detents and unrestricted positive position types.
- [x] Update reference dial logic for dynamic detents and internal blank slots.
- [x] Specify weather proxy trust, cache/log controls, bounded requests, same-origin radar, bundled base map and visible attribution (F07/F10).
- [x] Remove numeral targets to resolve the F08 design conflict.
- [x] Remove accidental Markdown root `settings.json`, preserving the real PR template and tool configuration (F12).

Verification passed for prototype logic at 1, 8, 13, 17 and 24 slots, including internal blanks, wraparound, shortest rotation, power-off and absence of numeral/numeric controls. Revised contract types passed strict checking with ten negative assertions and positive entries beyond twelve. These local changes have not been merged. No application build, channel approval or runtime gate is complete. Film selection (F11) remains deferred as agreed. Deployment trust, privacy/logging, accessibility and performance still require real implementation checks. Earlier review entries below describe their historical snapshot.

## Repository Baseline (2026-10-18)

The project owner requested a local commit of the current planning, specifications, audit, reference assets and tooling. This initial snapshot uses the existing `master` branch; no remote push or deployment is part of this task. Earlier “not committed” notes describe their historical state. Application scaffolding, production hooks/CI, channel approvals and runtime acceptance remain pending.

## Repository Housekeeping

Removed number-key channel tuning locally on 2026-10-18 from the operating manual, TV specifications and interactive prototype, including its accessible instructions. Arrow-key channel navigation remains. This change has not been merged.

Removed the fixed dial-position count from the operating manual locally on 2026-10-18 and clarified that capacity can expand while preserving existing positions and gaps. This documentation change has not been merged.

Added `.gitignore` locally on 2026-10-18 for dependencies, build output, local environment files, generated snapshots, browser-test artifacts, Python caches and broadcast video. Reference assets, content files, captions, licence records and shared settings remain trackable. This change has not been merged; task 1.1 remains open.

Reworked the root `README.md` locally on 2026-10-18 as a vintage TV operating manual, written from the finished visitor experience without a channel listing or development preamble. This status file retains actual progress. This documentation change has not reached `main`.

Consolidated the Claude project notes into `AGENTS.md` locally on 2026-10-18. `CLAUDE.md` now contains only `@AGENTS.md`; tool-specific settings remain in `.claude/settings.json`. This documentation change has not been merged.

Removed the personal name from `AGENTS.md` and aligned public author wording in the README and Credits specification on 2026-10-18. A case-insensitive scan found no occurrences in code or configuration files. This change has not been merged.

Added the required per-channel plan review and explicit confirmation gate locally on 2026-10-18. Agent instructions, channel rules and the build plan now require approval before each individual channel build. No channel build has been approved by this documentation change, which has not been merged.

Relaxed the branch policy locally on 2026-10-18: small, focused fixes may go directly to `main`; major features, new channels and substantial changes require a branch and PR. Checks, hooks and per-channel plan approval still apply. Workflow and hosting docs are aligned; no remote branch settings were changed. This documentation update has not reached `main`.

## Independent Audit

Repository audit completed locally on 2026-10-18. See [the audit report](audit-2026-10-18.md) for scope, evidence and the original 12 findings (3 high, 8 medium, 1 low).

Follow-up completed locally on 2026-10-18: F01–F03 are resolved in the specifications, with explicit channel positions and gaps, separate runtime-data mounts, and per-source freshness rules. F06 is also resolved in the revised plan and F09 is fixed and verified in reference tooling. F04/F05 are resolved in the canonical host-interface specification. The subsequent expandable-dial follow-up resolves F07/F08/F10 at the specification level and cleans up F12; film selection remains deferred. Application implementation and runtime verification are still pending in the build tasks; no build task or gate is marked complete. This review and follow-up have not been committed or merged.

## Blockers and Open Items

Pelican Panel beta38 list/resources responses were supplied and mapped. The restricted account works with zero selected subuser permissions; the owner reports manual assignments complete. Host connectivity, container execution, GameDig routing and SSH delivery still require verification. Upgrade-to-v1 compatibility is unverified.

See `project-decisions.md` → Open Items.
