# Status

What is built and where things are. Tick an item when its task has reached `main`, through a PR or an allowed direct fix. Update **Current focus** whenever it changes.

**Current focus:** Gate 3 reached: revenantal.com is live with TV Guide (1), Status (10) and Credits (11). Next: phase 4 channels, each after its plan review. Phases 1 and 2 and their gates are complete on `main`. Hosting is deferred to the launch check (3.7) by owner instruction. Status, the TV Guide and Credits are built.

**Last updated:** 2026-10-19

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
- [x] 2.3 Controls and compact dial
- [x] 2.4 Screen and channel host
- [x] 2.5 Display effects
- [x] 2.6 Audio engine
- [x] 2.7 Persistence, URLs and TV/List transitions
- [x] 2.8 TV accessibility pass
- [x] **Gate 2**

## Phase 3 — Launch

- [x] 3.1 Channel contract and tests
- [x] 3.2 Channel 10 — Status
- [x] 3.3 Forecast endpoint
- [x] 3.4 Channel 1 — TV Guide
- [x] 3.5 TV Guide forecast and radar — local forecast over live radar with Natural Earth geography; static when unavailable
- [x] 3.6 Channel 11 — Credits and shared attributions — film-style roll by department, VCR controls, channel music for the Guide and Credits
- [x] 3.7 Launch check — live on Coolify behind Cloudflare with automatic deploys, weather, branch protection and a cross-browser review
- [ ] **Gate 3 — launch**

## Phase 4 — Lighter Channels

- [x] 4.1 XBOX, the Halo menu (channel 7) — original Xbox 4:3 menu loop with the Halo theme
- [x] 4.2 Terminal (channel 3) — revenantal.sh command shell with history and Tab completion
- [ ] 4.3 Rev OS
- [x] 4.4 Input capture and saves — PRESS START, keyboard capture and per-channel saves
- [ ] 4.5 Coin Drop (channel 12)
- [ ] 4.6 Broadcast player
- [ ] 4.7 The Late Show
- [ ] 4.8 Paid Programming
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

Task 2.3, part 2 on `feat/2.3-panel-door-power`: panel buttons from content (links in a new tab, copy with COPIED! and announced failure, SERVERS tunes to position 10; four buttons at 72%), the flip-down settings door with five switches, amber override lamps and a Credits button (disabled until registered), and the power LED (off darkens the tube, cuts the room light and stops tuning). Browser check at 1920×1080: clipboard copy works, SERVERS tunes to CH 10, Tab order is dial, volume, buttons, door, switches, power, axe clean with the door open, no console errors. 132 tests; initial JS 43.1 kB.

Task 2.3, part 3 on `feat/2.3-hint-note`: first-visit "turn the dial →" note (Permanent Marker) appears after 1.6 s with a blinking CH number; clicking it or any channel change peels the tape and drops it over 1.4 s. By owner request it returns on every page load (no `rv-hint` key). Also merged #11 (pnpm/action-setup 6.1.0) with a clean squash message, and the Credits button now tunes to position 11 by owner decision. Browser check: note appears, falls, stays gone after reload, axe clean, no errors. 135 tests; initial JS 43.6 kB.

Task 2.4, part 1 on `feat/2.4-channel-host`: shared channel types from the host-interface spec, validated position-keyed registry (`createLineup`: canonical safe-integer keys, unique IDs, loaders, slot count from the highest key, reserved IDs), the screen host in 760×570 channel space (safe inset or full bleed), lazy named loaders with stale results discarded, scoped `tune`/`powerOff` that die with the scope or while inactive, recoverable load/render errors, NO SIGNAL with animated snow and the 460 ms static burst (cut and FX-off skip it). Snow is drawn on a canvas from six pre-made noise frames: the first SVG-turbulence version only repainted on mouse movement in the owner's Chrome (screenshots force repaints, so automated checks missed it); the canvas frames change on their own and pause while the tab is hidden. Browser check: snow animates, static then NO SIGNAL on tune, axe clean, no errors. 154 tests; initial JS 45.5 kB.

Task 2.4, part 2 on `feat/2.4-power-tuning`: 0.9 s boot on page load; 3.3 s warm-up with the degauss wobble at 3 s when the viewer powers on; power off collapses the picture to a line and point with a 3.2 s afterglow dot; drag-tuning shows the nearest channel live with blur, contrast loss, ghost jitter and snow by distance from the detent, and releasing on a detent settles with no static. Reduced motion skips static, boot, warm-up and collapse. The hint note hides while the TV is off. Channel changes no longer flash (owner request): measured screen brightness through a change went from a 52–151 swing to a steady 99–116 (soft blurred static, then a 0.22 s blur-to-sharp snap; snow draws its first frame before paint). Browser check covers each stage with no console errors. 156 tests.

Task 2.5 on `feat/2.5-display-effects`: effect precedence resolver with exhaustive tests (viewer × channel × perf × reduced motion), scanlines that fade between strengths, a gentle flicker that also makes the room light breathe, phosphor bloom, vignette (heavier for title-safe channels) and glass dust, 1.35× room light during static, settings-door switches and amber lamps driven by the resolver, and the silent performance fallback (1.2 s settle, 1.5 s sample, under 42 fps drops bloom, then flicker). OSD softened by owner request. Browser check: switches toggle the layers, axe clean, no errors. 245 tests; initial JS 47.1 kB.

Task 2.6, part 1 on `feat/2.6-audio-engine`: `src/audio/engine.ts` plays the ten TV recordings at volume/10 × 0.9 × the event factor (synthesized fallbacks if a file is missing), runs the hum, whine and hiss bed, unlocks on the first gesture and suspends while the tab is hidden. Dial, static, volume, buttons (press and release), switches, CRD, note, door and power (with the CRT warm-up sound) are wired. Browser check: no context before a gesture, all 10 files decode after the first click, sounds start, no autoplay warnings. 250 tests; initial JS 48.9 kB.

Task 2.6, part 2 on `feat/2.6-channel-audio`: per-channel sound scopes (manifest-declared `/assets/` one-shots and loops only; unknown IDs ignored; nothing queued before unlock; one voice per loop; `on-active` and `manual` starts; music fades in over 0.6 s and ducks to 30% under the OSD; asset × local × viewer gain applied once; stops while inactive, muted or hidden and resumes; nothing survives dispose), wired through the channel frame with the effective `volume` prop (0 while locked, off, muted or inactive). 257 tests; initial JS 49.9 kB. Instrumented browser check unchanged: silent before a gesture, all 10 TV sounds decode and play.

Task 2.7 (merged in #21): `#chN` (written with replaceState, re-tunes on hashchange), `rv-ch` and `rv-tv` with the spec's load order and no wrapping; the `?tv` preview flag removed, so desktop gets the TV by default and List mode is the start for viewers who left it off or prefer reduced motion; TV → List (collapse, TV fades and scales to 0.97 from 0.5 s, List in at 0.9 s, heading focused) and List → TV (List out in 0.25 s, then the full warm-up with its sounds); the skip link as the TV's first Tab stop; a page-wide shared audio engine. Browser walkthrough: desktop default TV, power-off to List, reload remembers off, Turn on the TV, `#ch10`, skip link first, 800 px List only, axe clean in both modes, no errors. 267 tests; initial JS 50.7 kB.

Renamed the GitHub repository to `Revenantal/revenantal-website` so its README no longer replaces the account profile README; the local remote is updated.

## Channel Build Approvals

All individual channel builds are awaiting plan review and explicit owner confirmation, including TV Guide, Status and Credits. Existing design statuses below describe design progress, not permission to implement. Record each confirmed channel scope and date in `project-decisions.md` and note its approval here.

## Channel Status at a Glance

| Ch  | Name             | Design                                                   | Build                   |
| --- | ---------------- | -------------------------------------------------------- | ----------------------- |
| 1   | TV Guide         | Mockup done (v3 with forecast and radar)                 | Built (3.4, 3.5)        |
| 2   | Rev OS           | Mockup done                                              | Not started (4.3)       |
| 3   | Terminal         | Approved sketch                                          | Built (4.2)             |
| 4   | Night Drive      | Mockup done; needs a cleaner, less "paint" look at build | Not started (5.2)       |
| 5   | Side Quest       | Mockup done                                              | Not started (5.1)       |
| 6   | Revscape         | 3D prototype done; M1, M2 built; M3 to M10 planned       | M1, M2 built (dev-only) |
| 7   | XBOX             | Halo menu modelled on halome.nu                          | Built (4.1)             |
| 8   | The Late Show    | Mockup done                                              | Not started (4.7)       |
| 9   | Paid Programming | Mockup done; clips not made                              | Not started (4.8)       |
| 10  | Status           | Rack design and sprites done                             | Built (3.2)             |
| 11  | Credits          | Movie-style roll with departments                        | Built (3.6)             |
| 12  | Coin Drop        | Mockup done                                              | Not started (4.5)       |

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

Task 2.8 (merged in #22): keyboard-only run at 1280×650 and 1920×1080 with the spec's Tab order and visible focus on every stop; the dial's name follows the spec; focus moves to the dial when the hint note falls or the TV turns on; door switches fill the compartment (the 20 px pitch at 1280×650 is an owner-accepted limit); reduced motion also drops the tune snap and freezes the snow. 268 tests.

Gate 2 (2026-10-19): the TV reads the shared store and data; no dial numerals render; detents, gaps, wraparound and a 14-slot dial are covered by unit and component tests; every position shows NO SIGNAL; power-off, under 900 px and reduced motion return to List mode (axe clean). Every control was run by mouse, keyboard and touch (emulated touchscreen: taps on every control, dial and volume drags, no page scroll while dragging). The touch run found that after a touch drag the dial and volume knob ignored the next tap, because a touch drag ends without the click the skip-one-click flag expected; fixed and tested. A real phone or tablet check is still worth doing. 271 tests. No individual channel is built or approved.

Task 3.1 (merged in #24): `describeChannelContract(manifest)` in `src/channels/_shared/testing/` is the shared contract each channel's own `contract.test.tsx` runs, so `pnpm test:channel <id>` includes it. It checks manifests and lazy loading, rendering across every fixture case with frozen props, project links, forbidden side effects (global listeners, network, storage, own audio), pausing while inactive and cleanup after unmount. A sample channel passes; broken variants fail the matching check. The registry now validates each manifest's kind, colours, display profile and audio. Host actions are tested through the real TV and store, and the real registry is guarded at the launch positions. 294 tests; initial JS 51.4 kB. No channel is built or approved.

Task 3.2 (merged in #25): the Status rack at position 10, built from data (patch panel and switch, projects, game servers, power and UPS), with live LEDs, VFD displays, section signs with per-source captions, and the snapshot age in the footer. Projects are new-tab links and game servers copy-address buttons in Tab order; the rack pans to centre the focused unit, and the wheel pans it. Stale and missing data show as unknown, never down, with no player totals. Full bleed, zoomed 1.4× by owner request. Channels now receive a `freshness` prop. Press Start 2P and the rack art are credited. The phase 2 empty-lineup option is gone. Browser check at 1920×1080 on real data: SERVERS tunes here, focus centres each server, arrows still turn the dial, axe clean, no errors. 312 tests; initial JS 52.3 kB; Status chunk 6.4 kB of 30 kB.

Task 3.3 (merged in #26): the private weather service in `api/forecast/` (trusted-peer address, DB-IP city lookup, Open-Meteo forecast, RainViewer frames and tiles, per-client and global limits, LRU caches, coalescing, deadlines, size caps, fixed hosts, no logging), its bundled build and image, Caddy routing that stays closed until `FORECAST_UPSTREAM` is set, the compose example and deploy workflow steps, and a CI container check. Verified locally end to end with the real database, providers and Caddy 2.11.7, including spoofing, untrusted-edge and DNT cases. 342 tests. Weather stays off until the 3.7 hosting checks.

Task 3.4 (merged in #27): the TV Guide at position 1. The large Local Forecast window (soft static and "Forecast not available" until 3.5 or while unavailable), the station box with the viewer's own clock and date and the channels on the dial, the half-hour time header, auto-drifting listings (projects with LIVE badges, game servers, Steam, latest GitHub push, other channels) that pause on hover, focus and when inactive, and a current-state LIVE ticker read once to screen readers. Full bleed with padded content and no Coming up, by owner request. Archivo Black credited. Browser check on real data: axe clean, no errors. 336 tests; Guide chunk about 5 kB of 30 kB. The forecast panel follows in 3.5.

Task 3.5 on `feat/3.5-guide-forecast`: the Guide's forecast window. Current conditions with feels-like, humidity and wind (new service fields), three days, recent RainViewer radar over the bundled Natural Earth map with a city marker, a stationary credits footer (Open-Meteo, RainViewer, DB-IP, Natural Earth) and a privacy note, and a spoken summary. It fetches only while active, aborts on tune-away, keeps results in memory only, and skips entirely for Do Not Track or Save-Data. Soft static while unavailable. The four weather sources are in the shared credits. `pnpm dev` shows real weather with `FORECAST_DEV_IP` set. Browser check through the real service and providers: weather and radar render, axe clean, no errors. Owner review fixes: bloom off for the Guide (it blurred text), lakes, borders and state/province lines on the radar map at zoom 5, and the channel overlay now flashes briefly on load instead of holding while the hint note shows. Bloom became opt-in for every channel, which also sharpens Status, and the Guide's listings glide on their own GPU layer.

Task 3.6 (merged in #29): the Credits channel at position 11. A film-style roll in white on black that rises from below the picture, grouped by department (Art, Typography, Sound, Weather; new required `department` field), each entry a role, a source link, the author, licence and edits. After the last line it cuts to static for a second and loops. A VCR bar (◀◀ REWIND, ❚❚ PAUSE / ▶ PLAY) fades in while the pointer moves and hides after two seconds; REWIND winds back with a tracking band, and a corner VCR display shows PAUSE or REW. Hover or link focus pauses without overriding a deliberate pause. Reduced motion shows a static list. The Credits button now hands focus to Pause through a new host focus step (`data-focus-first`). List mode and `CREDITS.md` group by department too, and the Guide's dial list includes Credits. Browser check: roll, bar, rewind and focus hand-off work, axe clean, no errors. 397 tests; chunk 2.4 kB of 30 kB. Channel music added on the same branch by owner choice: "Weather Forecast Type Beat" (YellowTree) on the Guide and "Epic Finale (loop)" (X3nus) on Credits, both CC BY 4.0 and credited, mono AAC under 300 KB from `pnpm assets:music`; Chromium decodes both without padding, so the loops are gapless. PAUSE fades the Credits music out and REWIND plays it at double speed.

Task 3.7 in progress (2026-10-20): revenantal.com is live on Coolify behind Cloudflare. GitHub Actions publishes three private GHCR images (site, forecast, live job) after CI and keeps two versions of each; one Coolify compose resource runs them with health checks, and a Coolify Scheduled Task runs the live job every ten minutes (first run: all four sources fresh, no errors). The Coolify deploy webhook and token are in the `production` environment. Remaining: automatic deploy and rollback checks, weather (trusted edge and privacy checks), branch protection, and the cross-browser, accessibility, budget and privacy review.

Task 3.7 complete (2026-10-20). Automatic deploys verified end to end (merge, CI, publish, Coolify webhook as a POST, fresh pull through `pull_policy: always`); each package keeps two versions. Weather is on behind Cloudflare: the visitor's own city resolves, faked forwarding headers are ignored, cross-site requests get 403, and responses are uncached. The radar CSP fix (`blob:` images) is live. Branch protection on `main`: the Checks job is required, force pushes and deletion are blocked, and admins keep the direct small-fix path. The rollback test was skipped by owner choice. Final review on the live site in Chromium, Firefox and WebKit: TV mode on channels 1, 10 and 11 (radar drawn, city correct), phone List mode with no overflow, reduced motion shows List mode, axe clean everywhere, no cookies, only `rv-ch` stored. Budgets on the live build: initial JS 54 KB, Guide chunk 10 KB, frame and sprites 129 KB (room backdrop 78 KB more), shell fonts 73 KB (122 KB with the Guide and hint-note fonts), TV sounds 85 KB, load event 0.34 s. The owner confirmed the forecast logs hold no addresses. Cloudflare Web Analytics stays blocked by owner decision: the CSP refuses its beacon, and switching off Cloudflare's automatic injection removes the console errors.

Task 4.1 (2026-10-20): channel 7 XBOX, the original Halo main menu. A 72 s muted loop of the original Xbox 4:3 menu flyby (Internet Archive PAL capture, end dissolving into start) plays only while the channel is active, with the still for reduced motion, and the 3:50 menu theme (halome.nu's loop) through the host's music loop. Media 820 KB video (VP9; 1.05 MB H.264 fallback), 12 KB still and 1.07 MB music, loaded only on channel 7 (owner-approved exception); code 0.7 KB. Microsoft's notice moved to the Halo credits by owner decision, using new optional `notice` and `licenseUrl` credit fields shown in the Credits channel, List mode and `CREDITS.md`. The contract gained `allowMutedVideo`. Browser check on the dev server: video plays and stops on tune-away, music loop starts, axe clean, no errors. 417 tests.

Task 4.2 (2026-10-28, on `feat/4.2-terminal`): channel 3 Terminal, the `revenantal.sh` shell. A DOS-era boot (BIOS-style self test with a memory count-up and device detection, then a large block-letter loading screen with a progress bar, about 6 s, skippable by click or key, skipped with reduced motion) hands over to a real text input with `help`, `ls`, `cd`, `cat`, `open`, `servers`, `git log`, `steam`, `links`, `discord`, `credits`, `clear` and a few joke commands (non-gothic: `cd /secret` is "permission denied — nice try"). It uses the IBM VGA pixel font (PxPlus IBM VGA 8x16, CC BY-SA 4.0, bundled with the channel and credited) in green-on-black monochrome (one phosphor green in four brightnesses). Tab completes, ↑/↓ cycle history, Esc blurs the input, and the input stops key events so arrows do not turn the dial. Every keypress plays a key click from five CC0 recordings (six clicks, a heavier Enter/Space, a softer Backspace; 25 KB; random pitch; held keys thinned; silent for arrows and shortcuts and while inactive). The bottom button bar was removed at the owner's request; every project is a new-tab link in the `ls` listing, and the scrollbar is themed green. Output is a polite `role="log"`, capped at 200 lines. Server addresses show only when published; stale or missing data prints "no signal". Registered at position 3 and added to the TV Guide dial list. Browser check on the dev server (Chromium, 1920×1080 and 1280×650): boot, skip focus hand-off, typing, the arrow key staying in the input, all eight sounds fetched and decoded, axe clean on the boot and the shell, no overflow, no console errors (the only 404 is `live.json`, absent on the dev server). 472 tests; channel chunk 6.4 kB of 30 kB. Not yet done: the owner's look and listen on the real TV (I could not audition the sounds; levels were matched by measurement only) and the PR.

Task 4.4 (2026-10-28, on `feat/4.4-input-capture`): input capture, PRESS START and saves. The TV input layer now grants a channel the keyboard only for the live picture, and only after a user gesture where the browser reports it. While captured the arrow keys stand down (volume +/− still work). Esc, a press outside the picture, tuning away, power-off, a hidden tab or detuning hands the keys back, and a stale scope can never take or drop a newer scope's keys. Channels get a shared `CaptureOverlay` (PRESS START, then an "ESC to release" tag) and `useCaptureFocus`. Saves live under `rv-save-<id>` as a versioned envelope (finite JSON, up to 100,000 characters), through `src/data/channel-save.ts` and `store.saveFor(id)`; storage and parser failures are contained and an ended scope cannot write. The contract gained a PRESS START check for `game` channels, with a sample game. New tests cover the capture rules through the real TV and the save helper. No channel uses it yet; Revscape is the first.

Revscape M1, look around (2026-10-28, on the long-running `feat/revscape` branch, dev-only): the first of ten milestones for channel 6. A still low-poly town in three.js (0.186.1, pinned) that you look around: drag to turn and tilt, wheel to zoom, Shift+drag to move, a compass that faces north, and the arrow keys after a PRESS START strip. One building per project spiralling outward from a fountain, the Server Hall on the nearest plot, trees, stall, crates and fence, with fog closing in at about 12 tiles. Drawn at 512×384 and scaled up pixelated. 3,400 to 4,400 triangles with 0, 8 and 30 projects; chunk 135 KB gzip of 150 KB. Without WebGL it shows the project links. Registered only in the dev server (open `#ch6`) and in the `pnpm size:revscape` preview build; production is unchanged. `CaptureOverlay` gained a `compact` strip. Not yet done: the owner's look on the real TV, and milestones M2 to M10 (each needs its own approval).

Revscape M2, walk (2026-10-28, on `feat/revscape`, dev-only): a red blocky player stands on the lane south of the fountain. Click the ground and they walk there, one tile per 600 ms tick, by the shortest route round buildings, trees, the fountain and props, with no corner cutting and the original's diagonal-then-straight shape; a yellow X marks the spot until they arrive, and a new click mid-step re-routes after the step. The camera follows them. A faint see-through copy of the player and an always-visible X show through roofs. Clicks that move more than 4 pixels are drags and still turn and tilt the camera; blocked tiles and the right and middle buttons do nothing. Paused while inactive, no glide with reduced motion, no saves yet. Farthest zoom lowered to 22 tiles so 30 projects stay under 5,000 triangles at every angle (worst case measured 4,790). New three-free modules (`grid`, `path`, `player`, `picking`, `figure`) with unit tests, including a check that picking agrees with three.js's own projection. Not yet done: the owner's play on the real TV, and milestones M3 to M10 (each needs its own approval).
