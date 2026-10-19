# The TV

The TV is the site's main interface: a photo-real vintage CRT whose channels are different UIs over one data source. It is the frame every channel lives inside. Build it in phase 2 over the phase 1 data/store and List mode; it must be solid before any channel.

Prototype: `docs/reference/prototypes/door-tv.dc.html` (the canonical interactive build). Where it and these docs disagree, the docs win.

## Two Modes

| Mode          | When                                 | Doc            |
| ------------- | ------------------------------------ | -------------- |
| **TV mode**   | Desktop and laptop                   | this folder    |
| **List mode** | TV off, under 900 px, reduced motion | `list-mode.md` |

## What a Visit Looks Like

1. The page fills the window with the TV, scaled to fit and letterboxed on near-black. The cabinet sits in a dark room lit by the screen.
2. On load the screen does a quick power-on to the last-watched channel, or channel 1 (TV Guide) on a first visit.
3. On every page load, after about 1.6 s a taped paper note reading "turn the dial →" appears beside the dial and the CH number blinks. Turning the dial or clicking the note makes it peel and fall away until the next page load.
4. Visitors change channel with the dial (click, drag, scroll, arrow keys).
5. Panel buttons link to Steam and GitHub, copy the Discord username, and SERVERS tunes to the Status channel.
6. The settings door flips open to show switches for scanlines, flicker, static, sound and room glow, plus a Credits button that tunes to the movie-style credits roll on channel 11.
7. The power LED turns the TV off: the picture collapses, the TV fades away and List mode fades in.

## Parts

| Part                                         | Code             | Doc                                             |
| -------------------------------------------- | ---------------- | ----------------------------------------------- |
| Stage (fit and letterbox)                    | `tv/Stage.tsx`   | below                                           |
| Cabinet (photo layers, room glow, badge)     | `tv/Cabinet.tsx` | `art-and-assets.md`                             |
| Screen (channel host, transition, NO SIGNAL) | `tv/Screen.tsx`  | `controls.md`, `docs/channels/channel-rules.md` |
| Controls                                     | `tv/controls/`   | `controls.md`                                   |
| Effects                                      | `tv/effects/`    | `display-effects.md`                            |
| Sound                                        | `src/audio/`     | `audio.md`                                      |
| URL and saved settings                       | `src/data/`      | `persistence-and-urls.md`                       |
| Keyboard and screen readers                  | all              | `accessibility.md`                              |

## Stage and Scaling

- The TV is authored at a fixed **1536×1024** stage and scaled as one unit. `roomLayout()` in `tv/geometry.ts` places it: the room photo covers the window with the real TV laid over the photo's painted TV, shown 10% larger than the photo's framing (`ROOM_ZOOM`), and the TV never drops below stage scale 0.65 or past full fit, so small windows get a full-height TV and the stage is never cut off.
- Minimum supported viewport: **1280×650** (about 0.63×). Controls keep a ≥ 44 px effective hit area at that scale (enlarge hit zones, not visuals).
- The dial has no numeral ring or numeral buttons at any size. Derive detents and rotation from the [configured slots](dial-configuration.md); retain one keyboard-accessible knob and the channel OSD.
- Channels are authored at **760×570** and scaled into the glass.
- Every stage coordinate lives in `tv/geometry.ts`, one named constant each.
- Around the TV is a dark room (`RoomBackdrop`): the room photo (`public/assets/tv/room.webp`), the screen light spilling onto it, and a vignette. On windows wider than the photo its sides fade into the room colour. The TV itself is never cropped or stretched.
- `Stage` measures only its own element with a `ResizeObserver`; no window listener. Photo layers render at room darkness (`--dim` 0.42, badge 0.57) and the room glow spill lights them.
- Mode selection and the TV/List transitions live in `src/App.tsx`; see `list-mode.md`. The channel and power state persist as described in `persistence-and-urls.md`.

## Branding

- Chrome two-line spec-plate badge on the bottom strip: "REVENANTAL / SOLID STATE · MODEL RV-404". Block lettering, never cursive.
- Badge area: 290×42 at (496, 964).

## Removed — Do Not Reintroduce

Window/room reflection, oval glare highlight, mouse tilt. See `docs/project/project-decisions.md`.
