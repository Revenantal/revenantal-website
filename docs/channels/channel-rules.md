# Channel Rules

The contract every channel follows, plus rules for each kind. Code for the shared parts lives in `src/channels/_shared/`.

## Before Building a Channel

Every individual channel requires a plan review with the project owner and explicit confirmation before implementation. This includes launch channels and Credits; the build order and phase gates still apply.

1. Read this contract, the channel specification, the relevant decisions and soundscape notes.
2. Prepare or update the channel specification so the proposed scope is concrete: layout, interactions, data/host interfaces, effects, assets and credits, accessibility/reduced motion, performance budget and validation. Identify unresolved choices and any departures from the existing design.
3. Present the plan to the owner, review it together, and ask for explicit confirmation to build that channel. Do not create channel implementation, tests or final channel assets while confirmation is pending.
4. After confirmation, record the approved scope and date in `docs/project/project-decisions.md` and note the approval in `docs/project/status.md`. Then begin implementation within that scope.

Existing mockups, lineup decisions, phase approval and another channel’s approval do not replace this check-in. Silence is not confirmation. If the answer is declined or unanswered, stop channel implementation; documentation and planning may continue. Material changes to the confirmed scope require another review and confirmation. Routine choices within that scope do not.

## Contract

The canonical props, host actions, saves and lazy-loader types are defined in [the host interface](host-interface.md). Every channel receives that contract; the TV host supplies its own playlist, shared credits, persistent caption state and scoped audio callbacks.

Each channel folder has a `manifest.ts` exporting a `ChannelManifest`: shared `Channel` metadata plus a `load` function that resolves a named `ChannelComponent`. See `docs/architecture/data-model.md` and `host-interface.md`. `channels/index.ts` maps explicit positive integer positions to manifests. Missing keys show NO SIGNAL; a channel may be deferred or omitted without moving another.

For the launch lineup, the registry is `{ 1: tvGuide, 10: status, 11: credits }`. Validate unique channel IDs, positive safe-integer keys and at least one registered channel; do not build it by compacting a list. The dial visits every slot through the highest configured key, including missing keys and explicit null slots. See [dial configuration](../tv/dial-configuration.md).

## Rules for Every Channel

- Root is exactly 760×570, with no outside layout assumptions. The TV scales it into the glass.
- With `safe: true`, keep all text and controls inside the content box; the TV adds the inset. With `safe: false`, the channel owns the edges and keeps anything important 6% in from each side.
- Interactive elements are real buttons and links, keyboard-reachable. Stop arrow-key events only when using them (e.g. a text input).
- Animations and loops pause when `active` is false, including hidden tabs. Read `reducedMotion` from props; do not install a channel-owned media-query or visibility listener.
- No network calls except shared broadcast media and the documented TV Guide forecast/radar helpers. No channel-owned audio nodes/elements: use `play`, `setLoop` and the shared player’s `volume` prop. No global listeners.
- No imports from the store, audio, the TV or another channel (lint enforces this).
- Every manifest declares its `kind` and a valid display profile.
- Keep text sharp: bloom is off unless the profile sets `bloom: true`, and only channels without small text (films, toys) should. Its SVG filter renders the picture at 760×570 and enlarges it, which blurs and colour-fringes text. Filters on large text layers have the same effect.
- Clocks and dates use the viewer's time zone and locale via `Intl`.
- Never show player names. Never show personal info.

## Directory and Game Channels

- Show every visible project.
- Render sensibly with `live = null`, and with 0, 1 and 30 projects.
- Every project is reachable and opens its URL in a new tab.

## Toy and Broadcast Channels

- Don't have to list projects.
- The dial, panel buttons and settings door keep working over them.

## Credits Channel

- Displays the shared credits as an upward movie-style roll; it does not list projects or use the scheduled broadcast player.
- No PRESS START or keyboard capture. The dial retains its keys, and the TV controls keep working.
- Pause/restart controls and attribution links are keyboard-reachable. Pause the roll on hover or focus and while inactive. Reduced motion uses a static, manually scrollable list.
- See `11-credits.md` for the layout, behavior and acceptance criteria.

## Game and Toy Channels

- **Press start.** Show a PRESS START overlay and take the keyboard only after a click, Enter or Space. Until then the arrow keys still turn the dial.
- **While captured,** arrows, WASD and Space go to the game and a small "ESC to release" tag shows. Esc, clicking outside the glass, or tuning away hands the keys back.
- **Pause when away.** `active: false` freezes the loop; coming back resumes where it stopped.
- **Saves.** Progress is stored per device in `rv-save-<channel id>`, versioned, with a Reset in each game.
- **Original work only.** "Mario vibe" and "plays like RuneScape" describe mechanics, not assets. No Nintendo or Jagex characters, sprites, sounds, names, logos or UI art. Everything is drawn for this project.
- **Physics.** Coin Drop uses a small 2D physics library (e.g. Matter.js) loaded only with that channel. Side Quest and Revscape use their own small tile and collision code.
- **Budgets.** Game and toy code ≤ 80 KB gzip per channel, art ≤ 120 KB per channel, all loaded only when tuned. Revscape has an agreed exception (see its doc).

## Broadcast Channels

- **Live schedule.** Each broadcast channel has a playlist and a fixed start time. Playback position = (now − start) mod playlist length, so tuning in lands mid-programme and every viewer sees the same moment.
- **Delivery.** 480p HLS (H.264, about 1 Mbps, 6 s segments) from a media bucket behind a CDN, not from the app image. Safari plays HLS natively; other browsers lazy-load `hls.js` with the channel.
- **Sound.** Video audio follows the volume knob and SND switch, and stays muted until the viewer has interacted (turning the dial counts).
- **Captions.** Every film and clip ships WebVTT tracks in its playlist metadata. The host supplies `captions`/`setCaptions`; C and visible controls change that one preference, remembered in `rv-settings`.
- **Playlists** live in `content/broadcast.json`, build into `Site.broadcast`, and reach the channel through its own `broadcast` prop. List mode doesn't show broadcast channels.

## Broadcast Content Rules

- **The Late Show** only plays films that are public domain in the US and Canada, each logged in `media/LICENSES.md` with its source and why it is public domain.
- **Paid Programming** is parody and must read as parody. Source footage is public domain (e.g. Prelinger Archives) or generated for the project. Never modern copyrighted video. Never a celebrity or public figure made to say things they didn't say. Generated presenters are preferred.
- Live-action footage gets new narration over the top; only animated footage is lip-synced. Real people on screen are never made to mouth new words.
- Each clip is 10–30 s, loudness-normalised to −16 LUFS, carries a "PARODY · AI-ALTERED" tag, and is credited (source and tools) in `CREDITS.md`.
- Silent-film uploads often carry modern, copyrighted scores. Clear a film's audio separately from its picture.

## Content Rules for All Channels

- No gothic or death themes.
- Site colours are black, red and dark red; channels may use their own palettes.
- Example data in mockups ("Project A–H", "Server 1–4", `203.0.113.x`) is placeholder only.

## Tests

Each channel has its own test suite inside its folder, and it must run on its own: `pnpm test:channel <id>` runs only `src/channels/<id>/`, so building one channel never needs the full suite. That suite covers the channel's own logic and runs the shared contract checks against that channel alone, using the shared fixtures. The full `pnpm test` still runs everything in CI and before merging.

Every channel passes the shared contract tests (task 3.1). Add `src/channels/<id>/contract.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describeChannelContract } from "../_shared/testing/contract";
import { manifest } from "./manifest";

describeChannelContract(manifest);
```

The contract (`src/channels/_shared/testing/`) loads the channel through its manifest and checks that it:

- declares a valid manifest (ID, kind, colours, display profile, `/assets/` audio) and keeps `manifest.ts` free of static imports of its own code;
- renders from the shared fixtures, with `live = null`, stale sources, 0, 1 and 30 projects, no credits, reduced motion and zero volume, without mutating its props;
- links every project in a new tab (directory and game channels);
- adds no window or document listeners, makes no network requests (unless allowed with `allowNetwork`, for the TV Guide forecast), never touches storage directly and creates no audio of its own;
- leaves no timers or animation frames scheduled, and plays, tunes, captures and saves nothing, while inactive or after unmounting.

`channelProps()` and `FIXTURE_CASES` in `fixtures.ts` give the channel's own tests the same data. `sample/` is a minimal reference channel that passes the contract. Lint keeps these test-only files out of application code. Capture, PRESS START and save checks join the contract with task 4.3, and caption and media checks with the broadcast player (4.5).

Registry tests (`src/tv/lineup.test.ts`, `src/channels/_shared/lineup.test.ts`) cover the launch positions (1, 10 and 11), gaps, omitted channels, stable hashes, the SERVERS button and the settings-door Credits button. `src/tv/host-actions.test.tsx` runs `host.tune` and `host.powerOff` through the real TV and store.
