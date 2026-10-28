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

- Planned v1 lineup: TV Guide, Rev OS, Terminal, Night Drive, Side Quest, Revscape, Halo 3, The Late Show, Paid Programming, Status, Credits, Coin Drop (positions 1–12; Halo 3 took 7 and Coin Drop moved to 12 on 2026-10-20). Individual optional channels may be deferred or omitted; their positions stay empty. Credits occupies position 11 and is required at launch; additional blank slots may be configured explicitly. See `docs/channels/README.md`.
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

### Credits channel approved (2026-10-19)

- The owner approved building Credits (task 3.6) on 2026-10-19 with these changes to the plan:
- **Departments:** credits are grouped like film credits (Art, Typography, Sound, Weather Department). Each credit gains a required `department`; departments keep first-seen order. List mode and `CREDITS.md` group the same way.
- **Loop:** the roll starts below the picture and rises into view. After the last line rolls off it cuts to static for about a second and starts again, instead of holding the final frame.
- **Controls:** a VCR-style bar (◀◀ REWIND, ❚❚ PAUSE / ▶ PLAY) fades in while the pointer moves over the picture and hides two seconds after it stops; it stays while a control has focus. REWIND winds back to the top in about a second with a tracking band; a corner VCR display shows PAUSE or REW. The owner chose this over always-visible buttons.
- **Focus:** the Credits button hands focus to Pause. Generic host step: after a panel tune, the frame focuses the channel's `[data-focus-first]` element (or its first control) once it is loaded and active; any other tune cancels it.
- **Display effects (2026-10-19):** Credits no longer limits any effect: scanlines, flicker, room glow and the static burst all run at their defaults, and the viewer's switches still decide. Owner rule for all channels: effects default on, and a channel limits one only for a specific, recorded reason. Bloom stays opt-in for text sharpness.
- **Music (2026-10-19):** the owner chose "Weather Forecast Type Beat" by YellowTree for the TV Guide and "Epic Finale (loop)" by X3nus for Credits (Freesound, CC BY 4.0, credited in the Sound Department), replacing "no extra channel music" for Credits. Both are mono AAC at 36 kbps to stay within the 300 KB loop budget. The Guide track plays to its natural ending and restarts, because a mid-track loop point could not be verified. On Credits, PAUSE fades the music out and REWIND plays it at double speed.

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

- While phase 2 was in progress, the TV rendered only with `?tv` in the URL. Task 2.7 removed the flag: desktop windows (900 px or wider) get the TV by default; a viewer who left it off, or who prefers reduced motion, starts in List mode with a Turn on the TV button.

### Room scene (2026-10-18)

- The TV sits in a dark room photo (owner-supplied, generated with ChatGPT). Layout is a hybrid: the room fills the window around a smaller TV on normal and large screens, and the TV grows back to full height on small windows (stage scale never below 0.65 or above full fit). This supersedes the earlier "keep full height" answer.
- The room image includes recognisable third-party characters and products (Halo, Star Wars and Alien figures, a Nintendo console and controller). The owner accepted this risk and chose to keep the image as is. Replace the image if a rights holder objects or before any commercial use.
- Credited as "Room artwork" in the shared credits, naming ChatGPT.
- The owner asked for a slightly bigger TV and a much darker scene: the TV shows 10% larger than the photo's framing (`ROOM_ZOOM`, the room zooms with it), the room photo renders at 45% brightness under a heavy vignette, and the cabinet at 32% (badge 45%) after a further owner request to darken the TV.

### Controls build notes (2026-10-18)

- The registry (`src/channels/index.ts`, task 2.4) is `{ 11: null }` until the first channel is approved: 11 slots, all NO SIGNAL. `createLineup` rejects an all-empty registry; the phase 2 `allowNoChannels` option was removed when Status registered at 10 (task 3.2). Reserved IDs (`tv-guide` 1, `status` 10, `credits` 11) let SERVERS and Credits tune before their manifests exist; a registered manifest always wins and a conflicting one fails validation.
- Since task 2.6 the host passes real scoped `play`/`setLoop` (`src/audio/channel-scope.ts`) and the effective `volume`. Capture and save callbacks stay inert until 4.3.
- Channel sound assets must be same-origin files under `/assets/`; any other `src` is ignored. `setLoop(id, false)` keeps the loop off (including `on-active` loops) until `setLoop(id, true)`.
- TV-wide keys (↑/→, ↓/←, +/−) use a document listener in `tv/controls/tv-keys.ts`, the input layer that owns window listeners, instead of a focusable wrapper. Text fields, sliders and modified keys keep their own keys.
- Owner feedback on the first controls preview: the volume knob photo no longer rotates (it wobbled off-centre); only a light index tick turns ±135°, per `controls.md`. The knob turns by dragging round it (27° per step, relative to where it was grabbed), like the channel dial, replacing the prototype's up/down drag. TV images can no longer be dragged by the browser.
- Panel button and switch labels use Archivo Narrow (the spec's TV UI font) rather than the prototype's Bungee and JetBrains Mono, avoiding two extra fonts.
- Four stacked buttons fit only 190 stage px, so at the 1280×650 minimum each button's hit area is about 30 screen px tall (hit zones already extend past the visuals). That meets WCAG 2.2 AA target size (24 px) but not the project's 44 px goal; it reaches about 42 px at 1920×1080. The door switches are smaller still. Revisit if the button count or layout changes.
- Switch and button accessible names start with their visible label (for example "SCAN: Scanlines, ON") so they pass WCAG label-in-name.
- Power off currently darkens the tube and stops tuning; the collapse animation and the switch to List mode arrive with the screen (2.4) and transitions (2.7). The owner chose to make the Credits button work before the Credits channel exists: it closes the door, tunes to position 11 (NO SIGNAL until the channel is built) and returns focus to the door button. This overrides the "unavailable until registered" line in `controls.md`.
- The hint note uses Permanent Marker (`@fontsource/permanent-marker`, Apache 2.0, credited).
- The owner changed the hint note to appear on every page load (2026-10-19), not only on a first visit. Dismissal lasts until the next load; the `rv-hint` storage key is dropped.
- The on-screen display uses VT323 (`@fontsource/vt323`, credited) and sits in the 760×570 channel space scaled into the glass. Channel and volume changes are announced through one polite live region.

### TV accessibility pass (2026-10-19)

- Keyboard-only run at the 1280×650 minimum and at 1920×1080: Tab order is skip link, dial, hint note (while shown), volume, panel buttons, door, switches (when open), power; every stop shows the 3 px red outline; axe reports nothing on the TV.
- The dial's name follows the spec ("Channel dial, now CH 03, TV GUIDE"); how to turn it moved to its description. Volume stays a slider rather than a button, which reads its value directly.
- Focus no longer drops to the page: dismissing the hint note focuses the dial, and turning the TV on from List mode focuses the dial.
- Reduced motion in TV mode also drops the 0.22 s tune snap and freezes the NO SIGNAL snow on one frame.
- Door switches now fill their share of the compartment (20×37 screen px at 1280×650, 29×53 at 1920×1080). At the minimum viewport their centres are 20 px apart, under WCAG 2.2 AA target size (24 px); they pass from about 1150×770 up. Six controls cannot reach 24 px in the door's width at that scale. The owner accepted this as a known limit (2026-10-19): every switch works by keyboard and List mode is one step away. Revisit if the door layout changes (moving Credits out of the row would give five switches about 24 px each).

### Channel contract (2026-10-19)

- Each channel adds `src/channels/<id>/contract.test.tsx`, which calls `describeChannelContract(manifest)` from `src/channels/_shared/testing/`. Fixtures there are test-only (they import Vitest); lint rejects them in application code.
- The contract checks what jsdom can prove. The 760×570 root, axe and the look on the real TV stay with each channel's browser check.
- "Pauses when inactive" is checked as: no timers or animation frames left scheduled, and no `play`, `setLoop(id, true)`, `tune`, `powerOff`, `requestCapture` or `save.store` calls while inactive or after unmount.
- Directory and game channels must render every project as a new-tab link in the DOM with 30 projects. Revisit if a channel's approved design pages its listings.
- The registry validates each manifest's kind, colours, display profile and audio at startup (`manifest-check.ts`), so a bad manifest fails before it reaches the dial.
- Capture, PRESS START, saves, captions and media checks join the contract with tasks 4.4 and 4.6, where those host features are built.

### CH 10 Status: approved (2026-10-19)

The owner approved building Status (task 3.2) on 2026-10-19 with the scope in `docs/channels/10-status.md`, with these changes:

- **Keyboard:** no key capture at launch. Every server is a real link (projects) or button (game servers) in Tab order, and the rack pans to the focused unit. Arrow keys keep turning the dial. Arrow-key selection may follow with capture in task 4.3.
- **Freshness:** channels receive a `freshness` prop (fresh / stale / unavailable and observation time for each live source), computed once by the host's existing filter. Channels do not recompute it.
- **Fonts:** Press Start 2P for the LED signs (new, loaded only with the channel, credited); VT323 for every display and readout. JetBrains Mono is not used.
- **Sound:** no refresh tick, since the page fetches data once. A quiet server-room hum loop is proposed separately for owner approval; until then Status adds no sound of its own.
- **Wording:** the footer shows the local time and snapshot age, never a poll countdown. A stale game server shows its sample age ("sample 2 days old"), never "last seen". The game-server display uses the spec's four lines.
- **Art:** the existing cleaned rack sprites are used as they are; the owner judges them on the real TV.
- **Fill the screen** (owner request during the build, 2026-10-19): Status is full bleed (`safe: false`) and the rack is zoomed 1.4×, so the servers span the glass and the cabinet sides crop off. The spec's `safe: true` is replaced.
- Long server names and games shorten with an ellipsis so the state word always shows. Project LIVE/NEW tags from the mockup are not shown: no data field supplies them.
- Live job fixes from the first real-data look (2026-10-19): Pelican's `missing` state (the node has no container for the server) maps to offline, not unknown. A project answering 429 (bot protection, as Vercel does for the job's HEAD request) counts as reachable, not down.
- The game-server sign and UPS show a player total only when every running server reports a count; Factorio reports none, so a running Factorio server shows "-- PLAYERS".
- Section sign text is 12 px (the mockup's 16 px filled the sign) at the owner's request.
- TV containers that clip channels use `overflow: clip`, not `hidden`. A hidden box can still be scrolled when focus lands on something outside it, which shifted the whole picture when tabbing to an off-screen server.

### CH 1 TV Guide: approved (2026-10-19)

The owner approved building the TV Guide (tasks 3.4 and 3.5) on 2026-10-19 with the scope in `docs/channels/01-tv-guide.md` and the v3 mockup, with these choices:

- **Two PRs:** listings grid, clock, ticker and station box first (3.4), then the forecast and radar panel (3.5).
- **Full bleed with padding** (owner request during the build, 2026-10-19, replacing the title-safe choice): the background and ticker bar reach the glass edges; the panels and listings are scaled to 90% inside a padded box so the glass never cuts them off.
- **No Coming up** (owner, 2026-10-19, replacing the promo stills plan): the large window is the local forecast only, with no opt-in. While weather is unavailable it shows soft static and "Forecast not available". The station box lists the other channels from `dial.json`, which a check keeps in step with the registry. The `pnpm promos` capture and the Playwright dependency were removed.
- **No opt-in for weather** (owner, 2026-10-19): the city comes from a coarse, unstored network-address lookup with no browser permission; the panel's privacy note, DNT and Save-Data handling cover it.
- **Forecast details:** the forecast service adds feels-like temperature, humidity and wind direction for the "Feels · Humidity · Wind" line (3.5).
- **Badges:** a LIVE badge on projects that are currently up; no NEW badge (no data supplies it).
- **Ticker:** current state only (latest GitHub pushes, what's playing on Steam, server player counts, projects that are down or slow). No "status changes", since the page holds one snapshot.
- **Font:** Archivo Black for headers and temperatures (OFL, loaded only with the channel, credited).
- **Sound:** silent at launch; jazz loop, row tick and promo stinger to be proposed for approval later.
- **Radar map:** bundled simplified Natural Earth land and coastlines, as specified.

### Forecast service (2026-10-19)

- Task 3.3 builds the weather service to the spec in `docs/architecture/forecast-and-radar.md` (see its Implementation section). It stays off: Caddy answers weather routes as unavailable until `FORECAST_UPSTREAM` is set after the 3.7 checks.
- The city database is DB-IP Lite City (MMDB, CC BY 4.0), read with `mmdb-lib` (MIT, no dependencies). It is downloaded monthly at deploy (`pnpm fetch:dbip`) and never committed.
- RainViewer tiles are fixed server-side at 256 px, colour scheme 2, smoothed with snow shown. The service exposes frame IDs (their timestamps), never upstream paths.
- A 429 or other non-200 answer from the service means "skip the forecast segment"; the TV Guide never shows a fixed city or stale weather.
- DB-IP, Open-Meteo, RainViewer and Natural Earth are credited in the panel footer and the shared credits (task 3.5). The owner asked for the weather attribution explicitly.
- The radar base map is a static same-origin file fetched only when the forecast shows, keeping its 55 kB of map data out of the Guide's 30 kB JavaScript budget. After owner feedback that the radar showed no geography, it gained lakes, country borders and state/province lines, and the radar zoomed out one level (zoom 5).
- **Bloom blurs text.** The phosphor bloom is an SVG filter, so the browser renders the channel at its 760×570 authoring size and enlarges it (~1.4×); with its red/blue split, text looked doubled and soft even with every viewer switch off (owner report, 2026-10-19). Bloom is now **opt-in** for every channel (owner, 2026-10-19, after Status showed the same blur): the resolver applies it only when a profile sets `bloom: true`. Without a filter, a GPU layer (`will-change: transform`) stays sharp, and the Guide's listings use one so their slow drift glides smoothly instead of hopping a pixel at a time (owner report of jumpy scrolling).
- The channel overlay (OSD) flashes for 1.7 s on page load and power on, like a channel change; it no longer stays up while the hint note shows (owner request, 2026-10-19).
- `pnpm dev` can show real weather: the dev plugin runs the service and names the public address set in the git-ignored `.env.local` (`FORECAST_DEV_IP`).

### Dependency review (2026-10-19)

- Every dependency is on its latest version except these, held back deliberately. Revisit when the blocker clears; Dependabot raises the updates.
  - TypeScript 6.0 (not 7): `typescript-eslint` supports TypeScript below 6.1 only.
  - ESLint and `@eslint/js` 9 (not 10): `eslint-plugin-jsx-a11y` supports ESLint up to 9 only.
  - `@babel/core` 7 (not 8): `@preact/preset-vite` requires Babel 7.
  - Node 24 and `@types/node` 24 (not 26): Node 26 is not LTS yet. Move the runtime, CI, Docker image and types together once it is.
- The live-job image moved to Node 24.22.0, and Dependabot now watches both Dockerfiles (Node majors ignored, like `@types/node`). Caddy 2.11.7 and the reference tools were already current.

### Picture transitions (2026-10-19)

- The owner found the channel-change flash too aggressive, twice. Measured, the scale-from-line "power-on" of each new picture dropped the screen to about 45% brightness and then overshot to 130%. Channel changes no longer use it: the static burst is a soft, blurred crackle (#3a3a3a base, snow at 50%, roll bar at 5%, 1.5 px blur) and the new picture snaps in from a 6 px blur over 0.22 s, with no dark frame or brightness spike. The 460 ms static timing is unchanged. Page-load boot, warm-up, degauss and power-off keep the prototype animations, which the owner likes.
- Reduced-motion viewers in TV mode get no static bursts, boot, warm-up or power-off collapse.

### Display effects (2026-10-19)

- `resolveEffects` implements the precedence table (viewer OFF > channel OFF > channel strength > default); reduced motion and the performance fallback can only remove effects. NO SIGNAL uses the prototype's profile (scan 1, flicker on, glow 0.5), so its GLOW lamp lights.
- The flicker overlay is 3–5% white instead of the prototype's 7–11%, because the owner is sensitive to flashing. FLK still turns it off.
- The OSD and NO SIGNAL card are softened (owner request): slightly see-through, softer glow and a faint blur, so they read as part of the broadcast.

### Persistence and transitions (2026-10-19)

- Load order for the channel is `#chN`, then `rv-ch` (zero-based), then channel 1; invalid or out-of-range values fall through and are never wrapped. `rv-tv` stores on/off. Both are written through the guarded storage path.
- The TV's audio engine is shared for the page (`tv/tv-audio.ts`) so sound stays unlocked across TV/List switches; List mode's Turn on the TV click also unlocks it.
- The skip link "Skip to the simple list" is the TV's first Tab stop and turns the TV off into List mode, which focuses its heading on arrival.

### XBOX channel: Halo menu (2026-10-20)

- The owner added a channel at dial position 7 as the first Phase 4 build (task 4.1), as the simplest and lightest channel. Coin Drop moves from 7 to 12 (task 4.5); the other Phase 4 tasks shift by one. Nothing built moves.
- **Approved by the owner on 2026-10-20** after plan review, first as an Xbox 360 channel with the Halo 3 menu, then changed the same day: the channel is **XBOX** (id `xbox`), as if the TV's input were an original Xbox sitting on the **Halo: Combat Evolved** main menu. Halo is the 4:3 menu of the CRT era, so it fills the TV without bars. A pure tribute modelled on [halome.nu](https://halome.nu/): nothing to click, the dial leaves.
- **Music rights:** Microsoft's Game Content Usage Rules explicitly allow Halo 3's music in non-profit ventures, but not Halo's; they note that game soundtracks are often licensed from third parties. The owner chose to use the Halo menu music anyway for this small non-commercial site, accepting that grey area (the realistic worst case is a takedown request).
- **Assets:** halome.nu's Halo files were the first source, but their video is the widescreen Halo PC menu, and the owner wanted true 4:3. The video now comes from an original Xbox PAL capture on the Internet Archive ("Halo Combat Evolved Xbox PAL Gameplay", marked public domain by its uploader): the menu flyby with a 1.5 s dissolve from its end back to its start. The music stays halome.nu's loop, used without asking halome.nu by owner decision. Both are credited, with Microsoft. Nothing is extracted from game files, which the Rules forbid. Source files stay out of git (`.cache/xbox-360/`); only processed files are committed, with `tools/assets/xbox_media.py`.
- **Media:** a seamless 10–20 second muted video loop (about 1–2 MB) plus a still frame for loading and reduced motion, and 3–4 minutes of the menu music (about 1 MB) through the host's music loop. **Owner-approved budget exception** over the toy art budget (120 KB) and the 300 KB loop budget; all of it loads only on channel 7.
- **Notice:** "Halo © Microsoft Corporation. revenantal was created under Microsoft's 'Game Content Usage Rules' using assets from Halo, and it is not endorsed by or affiliated with Microsoft." By owner decision it is not on the channel picture; it travels with the Halo credits (new optional `notice` and `licenseUrl` credit fields) in the Credits channel, List mode and `CREDITS.md`, with the licence linked to the Rules. No Xbox logos or Microsoft branding; "XBOX" is a referential label.
- TV display defaults. The video plays only while the channel is active; the shared contract gains a narrow allowance for one muted decorative video. See [the channel specification](../channels/07-xbox.md).

### Hosting on Coolify (2026-10-19)

- GitHub Actions builds and publishes the site, forecast and live-job images to private GHCR packages; Coolify only pulls and runs them, so nothing builds on the server. Coolify pulls with a read-only `read:packages` token in its registry settings.
- One Coolify Docker Compose resource (`deploy/coolify.compose.yml`) runs all three. The live job idles in its container and a Coolify Scheduled Task runs it every ten minutes; it shares `live.json` with the site through a Coolify-managed volume. No SSH, host folders, systemd timer or settings files on the server; live-job keys are Coolify environment variables.
- Deploys stay automatic through the Coolify deploy webhook, with `COOLIFY_WEBHOOK` and `COOLIFY_TOKEN` as `production` environment secrets in GitHub (owner choice over a server-side watcher or manual redeploys). The webhook step skips with a notice until those secrets exist.
- **Weather behind Cloudflare (2026-10-20):** Cloudflare proxies the site through orange-cloud DNS (no tunnel). Coolify's Traefik trusts Cloudflare's published ranges and private addresses for forwarded headers, and the site's `TRUSTED_EDGE` is `private_ranges` plus the same ranges, so the visitor's own address reaches the forecast service. Weather is on (`FORECAST_UPSTREAM=forecast:8090`) after the privacy checks in `deploy/README.md`. The site CSP allows `blob:` images for the radar tiles.
- **No Cloudflare Web Analytics (owner, 2026-10-20):** the site keeps no analytics. The CSP stays same-origin and blocks the beacon Cloudflare injects; turn off Web Analytics automatic setup (and RUM) in Cloudflare so it is not injected. Cloudflare's dashboard traffic numbers, which need no script, are enough.
- **Image retention (owner, 2026-10-19):** each package keeps two versions, the current image and one rollback. The publish workflow deletes older ones after each deploy, which keeps storage within the free plan's 500 MB if GitHub ever bills the container registry (free today). Rollback reaches back one deploy.
- Weather: the site reaches the forecast service as `forecast:8090` on the resource's own network, and the service trusts only the `site` container, looked up by name every 30 seconds (`TRUSTED_PEER_HOSTS`). A custom private network was dropped on 2026-10-19, because Coolify's proxy can pick a container's address on a network it is not on. All three services have health checks. The plain-server deploy files were removed.

### CH 03 Terminal: approved (2026-10-28)

- Approved by the owner on 2026-10-28 as task 4.2.
- The channel is **TERMINAL** (id `terminal`), dial position 3. A phosphor command shell (`revenantal.sh`) that acts as a directory over projects, servers, git and steam activity.
- Non-gothic jokes replace prototype sketch lines: boot line uses `/dev/nvme0n1` instead of `/dev/ghost`, `cd /secret` returns "permission denied — nice try", `sudo` returns the standard sudoers incident notice, and `rm -rf /` returns "nice try, rm is read-only here".
- Interactive text input with Tab completion, command history (↑/↓), and clickable command chips along the bottom for mouse and touch visitors without typing.
- Font is VT323; display profile uses `scan: 1`, `flicker: true`, `glow: 0.7`, `safe: true`.
- Silent at launch (mains hum and CRT whine carry the channel); mechanical keyboard typing sounds and error beeps may be proposed for approval later.

### CH 03 Terminal: DOS-era boot, VGA font and key sounds (2026-10-28)

The owner widened the approved scope on 2026-10-28 after seeing the first build, with three choices made in the plan review:

- **Boot sequence (about 6 s, skippable):** a BIOS-style self test (memory count-up, device detection) replaces the earlier "mounting / waking / summoning" lines, then a larger loading screen with a block-letter logo and progress bar flips to the prompt. Click or any key skips; reduced motion skips it; it plays on every tune-in. See [the channel specification](../channels/03-terminal.md).
- **Font:** an authentic IBM VGA text font, **PxPlus IBM VGA 8x16** by VileR (Ultimate Oldschool PC Font Pack, CC BY-SA 4.0), replacing VT323 in this channel. It has no `@fontsource` package, so the unmodified `WebPlus` woff is bundled in `src/channels/terminal/fonts/` with its licence text and credited. The share-alike term covers the font file only, not the site's code. The channel also moves to pure black.
- **Key sounds:** every keypress clicks, using five CC0 Freesound recordings processed by `pnpm assets:terminal` (six clicks, Enter/Space, Backspace; 25 KB). This replaces "silent at launch" and the planned error beep and modem sound, which are not built. Real recordings, as the brief prefers; the owner approves the picks by listening on the real TV.
- **Palette (later the same day):** the owner chose classic green-on-black monochrome over the VGA multi-colour text palette. One phosphor green in four brightnesses replaces the colours, with the TV's on-screen green as the bright tone, and the room glow turns green to match.
- **Button bar removed (later the same day):** the bottom row of command chips (try: help, ls, open, servers, git log, discord, credits) is gone at the owner's request, and the terminal fills the glass. Projects stay reachable without typing through the `ls` listing's links. The scrollbar is styled in the same green.
- Font size is 20 px (72 columns) rather than the VGA-native 16 px, so text stays legible at the 1280×650 minimum; the owner can change it.

## CH 06 Revscape: planning (2026-10-28)

The owner promoted Revscape ahead of the other remaining channels and answered the first planning questions. This is **not** build approval: more planning comes first, then a plan review and an explicit go-ahead (see `AGENTS.md` → Channel Plan Approval).

- **Order:** Revscape is promoted. It follows task 4.4 (input capture, PRESS START and saves), which it needs, and comes before 4.3 and 4.5 to 4.8. The exact task numbers are settled when the plan is approved.
- **Goal:** copy old-school RuneScape's look, navigation and controls (mechanics and feel only; original assets only).
- **Interface tabs:** the owner wants all of them usable. Quest tab shows GitHub activity. Stats tab shows the game servers. The Music tab lists Revscape's own tracks and the visitor can switch between them, shown in the OSRS music-tab style. The owner decided Revscape starts its own music library; it does not reuse the other channels' tracks, so the host rule on channel-declared sounds is unchanged and the XBOX/Halo theme is out. Other tabs are open for discussion.
- **Chat:** visitors can type in the chat box. What they type also appears above the character's head, as in the game. It stays local: nothing is sent or stored.
- **Guide NPC:** the chat name is "Visitor". The guide uses click-to-continue dialogue, short and friendly, with a joke.
- **Movement:** walking only for now; running is revisited near the end.
- **Camera:** pitch is adjustable, as in the game.
- **Ambient life:** NPCs wander around. No day and night.
- **Milestones:** the build is split into ten parts (M1 to M10, in the spec). The owner approves each milestone separately before it is built; none is approved yet.
- **M1 (look around) approved 2026-10-28** with the owner's choices: pitch 25° to 65° starting at 40°; a 40×40 tile world with about a 12-tile draw distance, growing when the projects need more room; and dev-only registration. The owner also approved making the PRESS START overlay customisable ahead of Revscape's own menu (done in M1 as a `compact` strip; full restyling comes with the interface frame in M4).
- **Registration:** Revscape is dev-only while it is built; it is added at position 6 only when the owner says it is ready.
- **Open:** which tracks to source (count, style, licences) and the remaining tab contents.

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
- Volume knob graphic: the photo's printed rim marks plus the moving tick read as "double dots". Revisit later, for example by repainting the rim without marks in `tv_sprites.py` or using a different indicator.
- GitHub directory is implemented locally for task 1.10; hosting/scheduling and content review remain before launch.
- Status rack sprites: used as cleaned for the build (2026-10-19); the owner judges them on the real TV.
