# Asset Checklist

Everything the site needs that is not code. Tick items as they are sourced, cleared and committed. Credit every non-original asset in `CREDITS.md` and the in-site credits.

## TV

- [x] TV photo (flip-down door version) — `docs/reference/assets/tv/`
- [x] Cut sprites: frame, dial knob, button housing and faces, settings door — prototyped on the design canvas; re-export with `tools/assets` in task 2.1
- [x] TV sounds sourced (8 files) — see `docs/reference/sound-credits.md`; originals in `docs/reference/assets/sounds/`
- [ ] TV sounds processed to `.m4a` with the sound pipeline (`docs/tv/art-and-assets.md`)

## Status channel hardware

- [x] 1U server, 2U server, drive tray, switch, patch panel, UPS, blank panel, cabinet — generated and cleaned, in `docs/reference/assets/rack/`
- [ ] Final export at 2× display width into `public/assets/channels/status/`

## TV Guide

- [x] Prototype radar map and "Coming up" still — `docs/reference/assets/guide/`
- [ ] Bundle simplified Natural Earth 1:110m land/coastlines; pin source/version and record public-domain terms, processing and compressed budget. Reserve visible forecast/radar credit links.
- [ ] Radar tiles and base map wired to the live source (task 3.5)
- [x] ~~"Coming up" stills~~: dropped by the owner (2026-10-19); the Guide shows the forecast instead

## Revscape

- [x] Prototype 3D scene and render — `docs/reference/prototypes/revscape-scene.html`
- [ ] Final low-poly models (code or small glTF)

## Fonts (self-hosted WOFF2, Latin subset)

- [ ] Michroma, Archivo Narrow, Archivo Black
- [ ] Pixelify Sans, Press Start 2P, VT323, Bungee
- [ ] IM Fell English, IM Fell English SC, JetBrains Mono, Permanent Marker

## Channel sounds

Full list with links: `docs/channels/soundscapes.md`.

- [ ] TV Guide: music loop, row tick, stinger
- [ ] Rev OS: startup chord, clicks, window sounds, error, CD-ROM, modem
- [ ] Terminal: key presses, beep
- [ ] Night Drive: music, engine, whoosh, indicator, exit chime
- [ ] Side Quest: music, 8-bit effects
- [ ] Revscape: music, walk, door, XP, level-up, chat
- [ ] Coin Drop: music, peg clinks, bumper, payout, register
- [ ] The Late Show: projector loop, reel click, public-domain scores
- [ ] Paid Programming: jingle bumper, applause
- [ ] Status: server hum, refresh tick

## Broadcast media

- [ ] Select The Late Show playlist during its channel plan review and polish. Title choices remain open.
- [ ] Clear each selected film and log it in `media/LICENSES.md`. Check the exact picture edition and soundtrack separately.
- [ ] Paid Programming clips: confirm each source film's public-domain status, write scripts, record narration, cut 10–30 s clips with captions.
- [ ] Captions (WebVTT) for every film and clip.

## Content

- [ ] Real project list (`content/projects.json`)
- [ ] Panel button links (`content/buttons.json`)
- [ ] Server overrides, if any (`content/servers.json`)
- [ ] Credits (`content/credits.json`) and `CREDITS.md`
