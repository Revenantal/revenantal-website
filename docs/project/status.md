# Status

What is built and where things are. Tick an item when its task has reached `main`, through a PR or an allowed direct fix. Update **Current focus** whenever it changes.

**Current focus:** Phase 2, the TV shell: 2.3 controls in three PRs (dial and volume, then buttons/door/power, then the hint note). Phase 1 and Gate 1 are complete on `main`. Hosting is deferred to the launch check (3.7) by owner instruction. Phase 2 work goes on a branch with a PR. No individual channel is approved.

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

- [x] 1.1 Scaffold repo
- [x] 1.2 Tooling and pre-commit hooks
- [x] 1.3 CI, deploy, branch protection — CI passes on PRs and `main`; deploy publication, Coolify and branch protection moved to 3.7
- [x] 1.4 Content schemas and files
- [x] 1.5 Store and shared UI actions
- [x] 1.6 Live job — all sources verified locally with real credentials; host scheduler moved to 3.7
- [x] 1.7 Direct Pelican provider — real panel discovery, resources and rates verified locally; Factorio counts accepted as absent; Minecraft counts untested on a live server
- [x] 1.8 Server merge and overrides
- [x] 1.9 List mode
- [x] 1.10 Real project list, links and credits
- [x] **Gate 1**

## Phase 2 — TV Shell

- [x] 2.1 Asset tools (sprites, sounds, fonts)
- [x] 2.2 Stage and cabinet
- [ ] 2.3 Controls and compact dial — dial, volume and OSD on `feat/2.3-dial-volume`; buttons, door, power and hint note next
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

## Pelican Collector Build (2026-10-18, superseded by direct collection below)

Implemented token-only bounded/paginated discovery, strict private projections, real-response resource mapping, adjacent-sample network rates, independent resource failure handling, manual-membership discovery, isolated local GameDig queries, atomic public snapshots and opt-in restricted SSH upload. Startup commands/variables, SFTP fields, raw responses and player identities do not enter output. Only deidentified real-response fixtures are tracked.

Prepared a non-root read-only container, private environment/mount examples and disabled-by-default transfer. Standalone bundled execution and local Minecraft protocol checks pass through the live job and shared freshness view; unit coverage includes pagination, malformed/oversized responses, failed sources, resets, revocation and atomic output. The full pnpm check passes with 94 tests, all static checks and site/live/agent production builds. The host-test archive is prepared; the owner confirmed SSH and Docker Compose are available on the Wings machine. The build does not contact the real panel, install services, open ports, publish images or enable uploads. Host/container/SSH acceptance and v1 migration checks remain pending; Gate 1 stays open.

## Direct Scheduled Collection and Handoff (2026-10-18)

The owner approved replacing the Wings agent and SSH upload with direct public Pelican API collection inside the existing ten-minute live job. Reused the verified beta38 mapper under jobs/live/pelican/ and removed the standalone runtime/image, transfer code, archive tooling and obsolete deployment instructions. The previous generated Wings test archive was withdrawn; nothing was installed remotely.

Each run discovers manual status-bot assignments, loops through UUID resource endpoints and queries supported running games using one GAME_QUERY_HOST plus each allocation port. The owner confirmed games.revenantal.com as that sole hostname; it remains runtime-configurable. Minecraft Java/Bedrock, Valve and Factorio are supported; missing/failed queries omit counts. Factorio uses its public listing service, so its request timing is not exposed as a game ping. Player identities remain stripped.

Numeric network baselines persist privately for average rates between ten-minute executions; private state has no public route. Server freshness still expires after fifteen minutes from collection start. Tests cover one shared hostname across different ports, no future observation timestamps, per-server failures, manual removals, query failure isolation and ten-minute rate persistence. The standalone built live job passes the API-fixture → live.json → shared freshness path and a real local Minecraft query. Final pnpm check passes with 94 tests, lint, strict types, formatting and site/live builds. pnpm test:pelican and native Caddy checks pass, including private-state denial and two-version/rollback routing.

A sanitized real query against the owner-supplied Factorio allocation via games.revenantal.com returned unavailable. This does not establish whether the cause is listing eligibility, DNS/routing or provider compatibility; actual player counts remain unverified and are not fabricated.

**Left off:** Local code migration and documentation are complete. Hosting remains disconnected. Next configure the existing job's PELICAN_URL, restricted PELICAN_KEY and GAME_QUERY_HOST in its runtime environment, then verify scheduled-host resource collection and actual player counts. Docker-enabled CI, PR/merge/branch setup and remaining production acceptance keep Gate 1 open. Do not start the TV shell until that gate is settled. No individual channel is approved or built.

## Phase 1 PR and CI (2026-10-18)

Opened PR #1 (feat/1.1-foundation → master). The first CI run failed only at the container check: the site container exited at start, so no port was published. Likely cause: the upstream Caddy binary's file capability cannot exec under cap-drop ALL with no-new-privileges. The site Dockerfile now copies the binary to drop it; the check keeps containers and prints their logs if a start fails. Not yet confirmed by a passing run.

Added deploy/.env.example (SITE_TAG) and completed deploy/.env.live.example with every live-job variable, including optional paths. A test fails when the job reads a variable missing from the example. Runtime credentials are configured locally; the scheduled host is not set up.

Local runtime check with owner credentials in ignored deploy/.env.live: GitHub, project status, Steam and Pelican all succeed. Discovery found four assigned servers; the running one reports uptime, CPU and memory, and a second run produced network rates from the persisted baseline. Two servers report the panel state "missing", published as unknown. The Factorio player count is absent: the public listing service returns "no game for given host_address" for games.revenantal.com and its IP on port 34197, so the server is not publicly listed. The owner accepts Factorio without counts. Minecraft player counts are untested because no Minecraft server was running. Runs were local, not on the scheduled host.

PR #1 squash-merged to `master` as 04c8ae3 after CI passed on its final commit. Ticked 1.1, 1.2, 1.4, 1.5, 1.7, 1.8 and 1.9. 1.3 and 1.6 wait on hosting and the scheduler; 1.10 waits on owner review of the real project content. The repo still uses `master`; the move to `main` stays a deliberate hosting-setup step.

Later the same day the owner deferred hosting until the project is complete. Renamed `master` to `main` on GitHub (open Dependabot PRs retargeted automatically), deleted `feat/1.1-foundation`, and limited CI push triggers to `main`. Ticked 1.3 and 1.6 for their in-repo work; host setup moved to 3.7.

Credits now list only shipped external assets: the two OFL fonts. Sound and TV-image credits return when those assets ship. The AI-generated image credit wording awaits an owner decision.

Owner content review answers: GitHub projects now use each repository's description and website (with cleaning and fallbacks); the SERVERS button links to the Game servers section in List mode; image credits may name the tools used (AGENTS.md amended). 1.10 still needs the remaining answers: automatic vs curated list, whether this site's repo is listed, public Discord name and server renames/hides.

Owner completed the 1.10 review: the project list stays automatic from GitHub with an `exclude` list in content/directory.json (names matched case-insensitively, kept out of public site.json; the live job gets its own full content copy). This site's repository stays listed, the Discord name may be public and server names stay as the panel reports them. Ticked 1.10 and Gate 1: tooling, CI and hooks work; List mode shows projects, servers and live data from the shared store with freshness handling and axe-clean checks; runtime snapshots update without a site rebuild (Caddy checks).

Task 2.1 on `feat/2.1-asset-tools`: `tools/assets/tv_sprites.py` cuts the frame and nine control sprites from the source photo (frame 107 KB, sprites 1–5 KB) and matches the approved reference sprites to within 2–5 levels on average. `tools/assets/tv_sounds.py` produces the ten TV sounds as mono 44.1 kHz AAC 96 kbps (about 80 KB total), peaks −0.8 to −2.3 dBFS after encoding. Fonts stay on `@fontsource`. Sound and TV artwork credits are restored, with a test tying sound sources and TV art to credits.

Merged PR #8 (task 2.1) and reviewed Dependabot: merged #2–#6 (checkout 7, setup-node 7, pnpm/action-setup, setup-buildx 4, login-action 4; pins verified against tags), closed #7 (@types/node 26 does not match the Node 24 runtime) and ignored its future majors. GitHub's default squash added `Co-authored-by: dependabot[bot]` to those five commits, so the CI attribution check failed the #5 push; history was not rewritten. Later Dependabot merges use a custom squash message (git-workflow.md).

Task 2.2 on `feat/2.2-stage-cabinet`: `tv/geometry.ts`, `Stage` (fit and letterbox by `min(vw/1536, vh/1024)` via ResizeObserver), `Cabinet` (NO SIGNAL glass, dimmed frame, static door/knob/volume sprites), `Badge` and `RoomGlow` (spill opacity = glow × channel level × picture brightness). Previewed with `?tv`. Browser checks at 1536×1024, 1280×650 and 1920×900 show correct letterboxing, aligned sprites, no overflow and no console errors; 800 px falls back to List mode; axe reports no violations on the TV or List. 109 tests pass; initial JS 38.7 kB. Native Caddy check not rerun locally (no CADDY_BIN); CI container checks cover routing. Also added the per-channel test rule and `pnpm test:channel <id>`. Follow-up in the same PR: the owner-supplied room photo now surrounds the TV with a hybrid layout (`roomLayout()`): room fills 16:9 and larger windows around a smaller TV, full-height TV on small windows, sides fade on ultrawide. Checked at 1920×1080, 1440×900, 1280×650 and 3440×1440 with no overflow or console errors; axe clean; 113 tests pass; initial JS 39.3 kB. The image's third-party characters are an owner-accepted risk (project-decisions.md).

Task 2.3, part 1 on `feat/2.3-dial-volume`: unnumbered dial (click next, throttled scroll, drag with live snapping and cancel, arrow keys, overshoot turn), volume knob as a slider (click halves, scroll, 14 px drag steps, keys; notch turns ±135°), TV-wide keys, channel/volume OSD in VT323 and a polite live region. Dial maths covers 1, 8, 10, 11, 13 and 17 slots, wraparound, ties and drag snapping. Browser check at 1920×1080: 98 px dial target, click/wheel/keys/drag and volume work, OSD matches the prototype, axe clean, no console errors. 125 tests; initial JS 41.5 kB.

Renamed the GitHub repository to `Revenantal/revenantal-website` so its README no longer replaces the account profile README; the local remote is updated.

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

Pelican Panel beta38 list/resources responses were supplied and mapped. The restricted account works with zero selected subuser permissions; the owner reports manual assignments complete. The owner confirmed public panel access and one shared games.revenantal.com hostname. The local agent/SSH approach is superseded. Scheduled-host authentication, container execution and actual player-count queries still require verification. Upgrade-to-v1 compatibility is unverified.

See `project-decisions.md` → Open Items.
