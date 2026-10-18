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

## Clarifications

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
- Real project list: written in phase 1, task 1.10.
- Status of the patch panel / switch / UPS photo sprites: generated and cleaned; final art pass when channel 10 is built.
