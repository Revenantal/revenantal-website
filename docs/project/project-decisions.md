# Project Decisions

Approved decisions, clarifications and open items. Where this file conflicts with any other doc, follow this file. Add new entries with the date.

## Approved Decisions

### TV and branding (2026-10-18)

- The TV is the flip-down settings-door photo, with the green screen kept and the controls cut out and animated.
- Badge: chrome two-line spec plate on the bottom strip, "REVENANTAL / SOLID STATE · MODEL RV-404", block lettering.
- Panel buttons: STEAM, GITHUB, DISCORD (copies the username) and SERVERS (tunes to the Status channel). With four buttons the stack shrinks each to 72% size.
- A taped "turn the dial →" note shows on the first visit and falls off when the dial is turned or the note is clicked. It never returns.
- The dial is unnumbered in all layouts. Its range and detents derive from configured slots, including intentional blanks, with no fixed capacity. Preserve existing assignments and gaps. No UHF dial.
- Keep the 15.6 kHz CRT whine and the mains buzz.

### Removed after review — do not reintroduce (2026-10-18)

- Window/room reflection on the glass.
- Oval glare highlight.
- Mouse tilt.
- Cursive branding.
- The House channel.
- Number-key channel tuning (1–9). Use arrow keys for next/previous; numeric shortcuts do not scale with the channel lineup.

### Channels (2026-10-18)

- Planned v1 lineup: TV Guide, Rev OS, Terminal, Night Drive, Side Quest, Revscape, Coin Drop, The Late Show, Paid Programming, Status, Credits. Individual optional channels may be deferred or omitted; their positions stay empty. Credits occupies position 11 and is required at launch; additional blank slots may be configured explicitly. See `docs/channels/README.md`.
- Each channel can tone down or switch off TV display effects when tuned to. It can never turn on an effect the viewer switched off.
- Channel 1 keeps the name **TV Guide**.
- The TV Guide uses 90s broadcast graphics, a local forecast for the visitor's city and the visitor's own clock.
- Rev OS is a faithful Windows 98-style desktop with easter eggs.
- Revscape renders in real 3D (three.js), in the style of classic RuneScape, with original assets only.
- Status is one tall photo-real server rack. Sections open with a 1U blank panel and a 2U LED display unit (mirrored chassis, sign on the left). Projects get 1U servers with front displays; game servers get 2U servers with displays that include the connect address.
- Paid Programming is parody: new narration over live-action public-domain footage; only animation is lip-synced.

### Data and services (2026-10-18)

- Live data is refreshed every 10 minutes into a static `live.json`. No per-visitor API, except the optional forecast endpoint.
- Game servers listed = whatever the `status-bot` Pelican user is a subuser on. No list is maintained in code.
- The Pelican host pushes `servers.json` out over outbound SSH, locked to one folder. Nothing connects in.
- Connect addresses are published only for servers marked `showAddress: true`.
- TV Guide radar uses a free live radar tile service (e.g. RainViewer) with credit on the attributions page, over a dark base map.
- The Status game-server display uses the fields marked v1 in `docs/architecture/pelican-agent.md`. Finalise the exact set when that channel is built.

### Build and tooling (2026-10-18)

- TypeScript + Preact + Vite static site; pnpm.
- GitHub Actions runs lint, type-check, tests, build and size checks; Coolify never builds.
- Pre-commit hooks (husky + lint-staged) run ESLint, Stylelint and Prettier on staged files, plus a type-check. A commit-msg hook checks Conventional Commits and rejects AI attribution lines. CI runs the same checks, so skipping a hook (`--no-verify`) never gets broken code merged.
- Build order: foundation/data/List mode → TV shell → launch with TV Guide, Status and Credits → lighter channels → heavy channels. See `build-plan.md`.
- Self-host all fonts; no Google Fonts requests.
- No AI attribution anywhere: commits, PRs, credits or the site.

### Audit follow-up (2026-10-18)

- **Channel positions:** use an object keyed by explicit positive integer dial positions in `channels/index.ts`. Gaps show NO SIGNAL. A skipped or deferred channel does not renumber another; the dial still visits empty positions. Launch registers TV Guide at 1, Status at 10 and Credits at 11. Hashes and saved positions retain their physical dial meaning; panel tune actions resolve stable channel IDs through the registry. No specific planned channel has been omitted yet.
- **Deployment data:** keep built site files in the app image at `/srv/site`. Mount a separate host directory `/srv/revenantal/live` read-write at `/data` in the live job and read-only at `/srv/revenantal-live` in Caddy. Route only `/live.json` to that directory. Never mount runtime data over the built site or mount a single file that is replaced atomically. Keep the agent drop folder separate.
- **Freshness:** preserve each source last successful observation time independently from the aggregate write time. Failed sources are stale immediately; otherwise Steam, GitHub and project checks expire after 30 minutes, and game-server samples after 15 minutes measured from collection by the agent. The store filters stale values on the shared clock and tab resume without polling. Current status becomes unknown and old telemetry is omitted. Status displays snapshot/source age rather than a next-poll countdown.
- These resolve audit F01–F03 at the specification level. Implementation and runtime verification remain part of the existing build tasks. The brief is unchanged.

### Credits channel (2026-10-18)

- The settings-door Credits button tunes to a dedicated channel with a traditional upward-scrolling movie credits roll. This replaces the settings-door credits panel.
- Register channel ID `credits` at position 11, keeping all existing positions unchanged. Include it in launch task 3.6. The button resolves the channel ID through the registry and closes the door while tuning.
- Pass the shared `site.json` credits array through `ChannelProps.credits`. Keep List mode credits, Terminal credits and `CREDITS.md` on that same data source. Preserve any attribution that must appear beside the relevant content.
- Provide pause/resume, restart and keyboard-reachable source links. Reduced-motion TV mode uses a static scrollable list. Credits never captures the keyboard or uses the scheduled broadcast player.
- Typography uses white text on black, and no extra channel music is required. See [the Credits channel specification](../channels/11-credits.md).

### Per-channel plan review (2026-10-18)

- Before building any individual channel, review its concrete plan with the project owner and get explicit confirmation to start. This applies to all channels, including launch channels and Credits.
- Prepare the scope, layout, interactions, data and host interfaces, assets, accessibility, budget and validation in the channel specification before asking. Existing mockups, lineup decisions and prior design approval do not authorize the build.
- Record each channel’s confirmed scope and approval date here, and update its status. Without confirmation, do not begin channel implementation, tests or final asset production. Material scope changes need renewed confirmation; routine choices within the approved scope do not.
- No individual channel build approval is granted by adding this rule. See [the channel approval gate](../channels/channel-rules.md#before-building-a-channel).

### Branch workflow (2026-10-18)

- Small, focused, low-risk fixes may be committed and pushed directly to `main`. This includes documentation corrections and isolated styling or bug fixes with limited impact.
- Major features, new channels, substantial redesigns and broad architecture changes require a short-lived branch and PR. Choose by impact rather than line count; do not split a major feature into direct commits to bypass review.
- Conventional Commits, authorship rules, hooks and applicable quality checks apply to both paths. Direct fixes run local checks before push, then CI; deployments wait for successful CI on the exact commit. Do not force-push to or delete `main`.
- Branch protection must support this workflow rather than require a PR for every update. Existing remote settings have not been inspected or changed by this documentation update.
- The per-channel plan review and explicit confirmation gate is unchanged.

### Build order and review follow-up (2026-10-18)

- Phase 1 is foundation, data and List mode; phase 2 adds the TV shell over the existing store. Keep scaffolding/tooling/CI first. The real project list belongs in phase 1. The build plan and status now use the new task numbers.
- Remove the dial numeral ring, hit zones and focus stops in all layouts. Keep one accessible knob, the OSD and arrow-key tuning. The expandable-dial decision below supersedes the earlier compact-only rule.
- Film selection remains open until The Late Show channel review and polish. Old title examples are not an approved playlist; content direction and source clearance are settled during that review.
- Reference tooling now supports local static-board and 3D-scene renders with pinned dependencies, local fonts and assets. Dynamic design-canvas references still need their original runtime and are identified explicitly.
- Channel host interfaces are now defined in `channels/host-interface.md`; implementation is pending the existing build tasks. Weather trust, cache, logging and delivery behavior is specified in `architecture/forecast-and-radar.md`; deployment verification remains required. This change does not authorize a channel build.

### Channel host contract (2026-10-18)

- The canonical [host interface](../channels/host-interface.md) defines shared props, named lazy loaders, input/save helpers and scoped callbacks. This resolves audit F04/F05 in the specifications; runtime verification remains part of the build.
- Channels receive shared credits and their own optional broadcast playlist from `Site.broadcast`. Add playlist types/schema to the content pipeline; missing broadcast configuration produces an empty map and null channel prop.
- Rev OS shutdown uses `host.powerOff()`. Internal channel links use `host.tune(channelId)`, resolved through the registry. Both use the same store actions as TV controls.
- Captions default on and use one host-owned preference in `rv-settings`, exposed as `captions`/`setCaptions`. The host handles C once.
- Manifests declare sound/loop assets. Channels use scoped `play`/`setLoop`; the host owns fades, ducking and cleanup. Shared video playback uses the effective volume prop. Inactive/hidden/off states stop output, and disposed scopes cannot restart it.
- No individual channel build is authorized by settling the shared interface. Weather privacy requirements are defined in `architecture/forecast-and-radar.md` and must pass deployment checks before weather is enabled.

### Expandable dial and remaining audit follow-up (2026-10-18)

- Remove dial numerals at every viewport size. Derive the range from the highest validated registry key and the step from 360/slot count. Missing keys and explicit null slots show NO SIGNAL, including intentional gaps between channels. Existing assignments, hashes and saves remain stable. See [dial configuration](../tv/dial-configuration.md). This supersedes fixed twelve-position and 30-degree requirements.
- Resolve F08 by removing numeral targets; retain a keyboard-accessible knob with the existing laptop target-size requirement. Verify dynamic counts, blanks and all input methods during the shell build.
- Resolve F07/F10 in the weather specification: explicit proxy trust, private/no-store responses, bounded upstream caches, log suppression, same-origin radar, bundled Natural Earth base map and visible provider links. Actual ingress/log/cache checks are required before enabling weather; no live privacy behavior is certified.
- Remove accidental root `settings.json` (duplicate Markdown PR template), resolving F12. Preserve `.github/pull_request_template.md` and `.claude/settings.json`.
- Film selection remains deferred to The Late Show review. No individual channel build is approved; accessibility, performance and deployment gates remain pending.

### Foundation implementation (2026-10-18)

- Build begins with tasks 1.1–1.2 on `feat/1.1-foundation`, branching from the committed `master` baseline. No channel implementation is approved.
- Use Node 24, pnpm 11.9.0, Vite/Preact and exact package versions with a root lockfile. Keep the reference package independent. Pin TypeScript 6.0 while typescript-eslint supports versions below 6.1; ESLint 9 matches the declared peer support of jsx-a11y. Revisit tool versions together when peers support newer majors.
- A minimal static holding screen proves the application mount/build; shared content and List mode follow after CI/deployment setup. No project data is invented.
- CI is authored for PRs and pushes to main/master, with immutable action pins and no deployment side effects. Service images, deployment workflow and remote branch settings remain task 1.3 work.

### Scheduled GitHub directory and hosting preparation (2026-10-18)

- The owner confirmed the scheduled GitHub API feed for the latest public repositories under revenantal. Keep browser requests on the static same-origin snapshots; refresh the feed in the ten-minute live job.
- content/directory.json selects github or curated navigation and a limit; default ten. GitHub projects use stable numeric repository IDs, public repository links and generic language descriptions. Do not publish homepage URLs, raw descriptions, owner profiles or account metadata. Exclude forks, archived/private repositories and obvious personal-site/resume listings. This filter is conservative; public repository names still need normal content review.
- Retain last known repository navigation after a failed/expired feed, with its stale label. Suppress stale activity/current-state telemetry. A successful empty feed removes old navigation. The curated project file may remain empty.
- GitHub authentication is optional for this public endpoint. A runtime token can raise shared anonymous rate limits; it never enters browser files or build inputs.
- The owner requested deployment files only and will connect hosting later. Prepare site/live-job images and an opt-in publication workflow; do not configure secrets, deploy, or change the remote default branch. The existing remote default is master; production automation targets main and stays disabled pending deliberate setup.
- Phase 1 content, store, job and List implementation proceeds locally. The Pelican agent still requires confirmation of one real redacted response from the installed version. No individual channel build is authorized.

### Pelican discovery and verified beta38 mapping (2026-10-18)

- The owner created status-bot and manually assigned it to the desired servers, with no selected subuser permissions. The owner declined an assignment automation script. Continue manual membership management; never grant the collector administrative access or add automatic membership changes.
- The private-window Client API test returned one assigned server with server_owner=false and hidden variables. The resources request succeeded with the same restricted account. The earlier broader docs response is not evidence of bot privileges; browser session authentication can take precedence over its entered token. The agent uses token-only requests with no cookies.
- Supplied beta38 responses now support the mapper. Store only deidentified fixtures, never raw production responses. Recheck API compatibility after an upgrade to v1; no upgrade is authorized.
- Uptime is milliseconds; resource memory bytes convert to MiB; CPU is already a percentage of one core and may exceed 100. Network byte counters produce rates only across adjacent running samples with valid elapsed time, no restart and no counter reset. Omit rates on the first collection or a failed/reset baseline.
- Wildcard allocations such as 0.0.0.0 and descriptive aliases are not connect addresses. Leave them unpublished even when opted in. Private query routing may supply a LAN target for GameDig without creating another server inventory or publishing that target.
- Support local Minecraft Java/Bedrock and Valve query protocols initially. GameDig's Factorio adapter uses its external public listing API, so leave it disabled under the local-query design; Factorio's Pelican state/resources still work. Player counts for unsupported/unconfigured queries remain absent. Schedules and backups also remain absent without separately verified read permissions.
- Prepare the collector image and opt-in SSH transfer, but leave uploads disabled and hosting disconnected. No agent has been installed or run against the panel by this build. No TV channel implementation is authorized.

### Direct scheduled Pelican API collection (2026-10-18)

- The owner confirmed the panel is publicly reachable and approved replacing the agent/push architecture with direct Pelican Client API collection in the existing ten-minute live job. This supersedes earlier agent, two-minute polling, servers.json drop-folder, SSH/rsync and local-only game-query decisions. Remove their runtime and deployment tooling; no Wings installation is needed.
- Keep the restricted status-bot key on the job host and discover manual subuser assignments each run. The browser still reads static live.json once. No assignment automation or broader bot permissions are authorized.
- Loop through discovered UUIDs for resources, then query supported games for counts. The standard Pelican resources response contains no player counts. Use one configurable GAME_QUERY_HOST; the owner confirmed games.revenantal.com as the only shared hostname. Combine it with each primary allocation port; changing the hostname later needs runtime configuration only.
- GameDig supports Minecraft Java/Bedrock, Valve and Factorio. Factorio uses its public listing service and requires a listed/reachable game address; its listing-service timing is not game-server ping. Strip player identities and omit unsupported/unavailable query fields without changing good resource observations. No RCON password or command permission is needed.
- Persist only numeric counter baselines privately under /data/pelican-state.json for average rates between ten-minute executions. Never serve that file. Preserve fifteen-minute server freshness and all current address opt-in/privacy rules.
- Hosting stays disconnected; actual scheduled-host authentication and public game-query checks remain pending runtime setup. The previously generated Wings host-test archive is obsolete and withdrawn. No individual channel implementation is authorized.

### Factorio player counts (2026-10-18)

- The owner accepts Factorio servers without player counts. The real server is not on Factorio's public listing, and the owner chose not to list it publicly. Factorio servers still show state, uptime, CPU, memory and network rates. Keep the GameDig Factorio query; if a server is ever listed, counts appear without code changes.

### Hosting deferred and main branch (2026-10-18)

- The owner deferred hosting until the project is complete. Coolify, image publication, the scheduled live job on a host and branch protection move to the launch check (task 3.7). Tasks 1.3 and 1.6 close on their in-repo work; Gate 1 does not wait for hosting.
- The repository default branch was renamed from `master` to `main`, and the merged `feat/1.1-foundation` branch was deleted. CI push triggers target `main` only.
- The GitHub repository was renamed from `Revenantal/revenantal` to `Revenantal/revenantal-website`, because a repository named after the account is shown as its profile README. Image names under `ghcr.io/revenantal/` are unchanged.

### Credits cover shipped external assets (2026-10-18)

- Every external asset the site uses is credited, including CC0 sounds that do not legally require it. Credit only what ships: an entry is added in the same change that adds the asset. Sourced but unshipped sounds stay recorded in `docs/reference/sound-credits.md`.
- The credits list now holds the two shipped fonts (Michroma and Archivo Narrow, OFL 1.1). The sound and TV-image entries were removed until those assets ship in phase 2.
- The TV and rack images were made with ChatGPT and edited with Claude. The owner chose to name those tools in their credits; AGENTS.md now allows tool names in asset credits only, while the ban on AI attribution in code, commits, PRs and site authorship stays. Add the entries when the images ship.
- When an external asset is added or removed, update the credits in the same change.

### GitHub descriptions and websites (2026-10-18)

- The owner approved publishing each repository's own GitHub description and website, reversing the earlier "generic language descriptions, no homepage URLs" rule. Descriptions are whitespace-cleaned and capped at 200 characters, falling back to the language text. A valid HTTP(S) website becomes the project link and host (type `site`); otherwise the card links to the repository. Recent pushes still link to repositories. The personal-site/résumé filter still applies, and the owner reviews public repository text.
- In List mode, the Status tune button (SERVERS) becomes a link to the Game servers section. Other tune buttons stay hidden there.

### Content review (2026-10-18)

- Projects stay automatic from GitHub. content/directory.json `exclude` lists repository names to leave out, matched case-insensitively before the limit. The list stays private: the live-job image carries its own full content copy, and public site.json omits it.
- This site's repository stays in the list. The Discord username may be public. Server names stay as the panel reports them, with no overrides for now.

### Asset tools (2026-10-18)

- The TV sprites and sounds ship from repeatable scripts (`tools/assets/tv_sprites.py`, `tv_sounds.py`) rather than the hand-made reference files. Their output matches the approved sprites closely. Outputs are committed under `public/assets/`.
- Fonts stay on pinned `@fontsource` packages (Latin subset, `swap`, bundled and hashed) instead of a separate subsetting tool and `public/assets/fonts/`.
- ffmpeg was installed on the owner's machine with winget for sound encoding.
- The shipped sounds and TV artwork are credited in this change; the TV artwork credit names ChatGPT and Claude.

### Per-channel test suites (2026-10-18)

- Each channel keeps its own test suite in its folder, runnable alone with `pnpm test:channel <id>` (only `src/channels/<id>/`). The shared contract tests from task 3.1 must be callable per channel so each suite runs them for itself. CI and pre-merge still run the full suite.

### TV preview flag (2026-10-18)

- While phase 2 is in progress, the TV renders only with `?tv` in the URL (and 900 px or wider), so `main` keeps serving List mode until the power LED (2.3) and TV/List transitions (2.7) exist. Remove the flag in 2.7.

### Room scene (2026-10-18)

- The TV sits in a dark room photo (owner-supplied, generated with ChatGPT). Layout is a hybrid: the room fills the window around a smaller TV on normal and large screens, and the TV grows back to full height on small windows (stage scale never below 0.65 or above full fit). This supersedes the earlier "keep full height" answer.
- The room image includes recognisable third-party characters and products (Halo, Star Wars and Alien figures, a Nintendo console and controller). The owner accepted this risk and chose to keep the image as is. Replace the image if a rights holder objects or before any commercial use.
- Credited as "Room artwork" in the shared credits, naming ChatGPT.
- The owner asked for a slightly bigger TV and a much darker scene: the TV shows 10% larger than the photo's framing (`ROOM_ZOOM`, the room zooms with it), the room photo renders at 45% brightness under a heavy vignette, and the cabinet at 32% (badge 45%) after a further owner request to darken the TV.

### Controls build notes (2026-10-18)

- Until the channel registry lands in 2.4, `src/tv/lineup.ts` provides a temporary 11-slot lineup (Credits' launch position is the highest), all NO SIGNAL. The registry's "reject all-null" rule needs a phase 2 exception or placeholder entries; decide in 2.4.
- TV-wide keys (↑/→, ↓/←, +/−) use a document listener in `tv/controls/tv-keys.ts`, the input layer that owns window listeners, instead of a focusable wrapper. Text fields, sliders and modified keys keep their own keys.
- Owner feedback on the first controls preview: the volume knob photo no longer rotates (it wobbled off-centre); only a light index tick turns ±135°, per `controls.md`. The knob turns by dragging round it (27° per step, relative to where it was grabbed), like the channel dial, replacing the prototype's up/down drag. TV images can no longer be dragged by the browser.
- Panel button and switch labels use Archivo Narrow (the spec's TV UI font) rather than the prototype's Bungee and JetBrains Mono, avoiding two extra fonts.
- Four stacked buttons fit only 190 stage px, so at the 1280×650 minimum each button's hit area is about 30 screen px tall (hit zones already extend past the visuals). That meets WCAG 2.2 AA target size (24 px) but not the project's 44 px goal; it reaches about 42 px at 1920×1080. The door switches are smaller still. Revisit if the button count or layout changes.
- Switch and button accessible names start with their visible label (for example "SCAN: Scanlines, ON") so they pass WCAG label-in-name.
- Power off currently darkens the tube and stops tuning; the collapse animation and the switch to List mode arrive with the screen (2.4) and transitions (2.7). The owner chose to make the Credits button work before the Credits channel exists: it closes the door, tunes to position 11 (NO SIGNAL until the channel is built) and returns focus to the door button. This overrides the "unavailable until registered" line in `controls.md`.
- The hint note uses Permanent Marker (`@fontsource/permanent-marker`, Apache 2.0, credited). Its dismissal is saved under `rv-hint` now rather than waiting for the persistence task (2.7), since "never shown again" needs it.
- The on-screen display uses VT323 (`@fontsource/vt323`, credited) and sits in the 760×570 channel space scaled into the glass. Channel and volume changes are announced through one polite live region.

## Clarifications

- **Pelican version (2026-10-18).** The owner reports Panel 1.0.0-beta38 and is considering a move to v1. Guide collection step by step using the installed panel's Client API documentation. Record redacted real responses before finalizing the agent mapper; recheck them after an upgrade. No direct panel access, API key or upgrade authorization has been supplied. Redacted list/resources responses were subsequently supplied and recorded above.

- **README tone (2026-10-18, revised).** The root README is a vintage TV user manual, written as the finished visitor experience. Use operating instructions rather than channel listings or development status. Actual implementation progress remains in `status.md`; the manual does not mark any build task complete.

- **Public naming (2026-10-18).** Agent instructions use neutral owner wording. Code and site-facing author credits use the public handle `revenantal`, without the owner’s personal name. Sole authorship and the existing privacy rules still apply.

- **Shared agent notes (2026-10-18).** Keep all shared project guidance in `AGENTS.md`. `CLAUDE.md` is only an import of that file; `.claude/settings.json` remains tool configuration.

- **Removed features stay removed.** If a reference mockup still shows one, ignore it.
- **Mockups are intent, not spec.** Where `docs/reference/` and a spec doc disagree, the spec wins.
- **Placeholder data.** Mockups use "Project A–H", "Server 1–4" and `203.0.113.x` example addresses. The real project list is written during phase 1 after the schemas and List mode exist.

## Open Items

- Independent audit (2026-10-18): F01–F03 have approved specification fixes recorded above; implement and verify them in the corresponding build tasks. F06 is resolved by the revised plan and F09 is fixed and verified in reference tooling. F04/F05 are also resolved in the shared host-interface specification. F07/F08/F10 now have specification resolutions and F12 is cleaned up; F11 remains deferred to The Late Show review. See [the audit report](audit-2026-10-18.md). All runtime acceptance checks remain pending.

- A hidden channel: wanted or not. Not needed for v1.
- Exact Status game-server display fields: confirm when building channel 10.
- Volume knob graphic: the photo's printed rim marks plus the moving tick read as "double dots". Revisit later, for example by repainting the rim without marks in `tv_sprites.py` or using a different indicator.
- GitHub directory is implemented locally for task 1.10; hosting/scheduling and content review remain before launch.
- Status of the patch panel / switch / UPS photo sprites: generated and cleaned; final art pass when channel 10 is built.
