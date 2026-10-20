# CH 08 — The Late Show

## Summary

Public-domain feature films on a fixed "live" schedule, like a late-night movie channel.

- **Kind:** broadcast · **Folder:** `late-show` · **Build:** task 4.7 (needs the broadcast player, 4.6) · **Status:** design done

## Concept

Tune in and a film is already playing mid-scene, the same moment for every viewer. Between films, black-and-white intertitles ("Tonight's Feature will resume after a word from our projector") and a reel-change card. A NOW/NEXT lower third appears on tune-in and then fades.

## Data Shown

| Element    | Source                                                                    |
| ---------- | ------------------------------------------------------------------------- |
| Film       | `broadcast` prop, selected by the host from `site.broadcast['late-show']` |
| NOW / NEXT | Current and next titles and times (viewer's time zone)                    |
| Captions   | WebVTT per film                                                           |

## Film Selection

The playlist is intentionally open until this channel is reviewed and polished. Previous title examples are not an approved launch lineup. Choose the films during the required channel plan review, including how they fit the site’s content direction. No film selection or theme exception is approved by this placeholder.

Every film is logged in `media/LICENSES.md` with its source and why it is public domain in the US and Canada. Clear the soundtrack separately from the picture.

## Interaction

- None needed: it's TV. The host handles C through `setCaptions`; the shared player reads the persistent `captions` prop.
- The shared player applies the effective `volume` prop, including the volume knob, SND, power, activity and audio-unlock gates.

## Look

- Black-and-white intertitle frames with ornate borders.
- Lower third: dark bar with "NOW" and "NEXT", a small "08 LATE SHOW" bug, "Public domain · CC available".
- Fonts: IM Fell English, IM Fell English SC.
- Display profile: scan 1, flicker, glow 0.6. `safe: true`.

## Sound

The film's own score only if it's public domain; otherwise public-domain classical (Musopen). Quiet projector clatter and a reel-change click between films. See `soundscapes.md` → The Late Show.

## Build Notes

- Uses the shared broadcast player in `channels/_shared/` with `broadcast`, `active`, `volume` and `captions` props. Missing playlists show an unavailable state without fetching media. See `host-interface.md`.
- Video audio stays muted until the viewer has interacted.
- Video files live in the media bucket, not in git.

## Acceptance

- Two viewers tuning in at the same time see the same moment.
- Captions toggle and persist.
- Picture keeps playing in sync after tuning away and back.

## References

- `docs/reference/mockups/ch08-late-show.png`
- Prototype source: `docs/reference/prototypes/boards/ChLate.dc.html`
