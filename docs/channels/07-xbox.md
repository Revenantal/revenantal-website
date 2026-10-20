# CH 07 — XBOX

## Summary

The original Halo: Combat Evolved main menu with its music, as if the TV's input were an original Xbox left sitting on the menu. A tribute modelled on [halome.nu](https://halome.nu/). Approved by the owner on 2026-10-20 as the first Phase 4 build.

- **Kind:** toy · **Dial:** 7 · **Folder:** `xbox` · **Build:** task 4.1 · **Status:** built on `feat/4.1-xbox`

## Concept

Tune in and the real Halo main menu fills the screen in its native 4:3, its music playing, exactly as the game showed it on a CRT. Nothing to click and nothing to win: it is something to leave running on the TV, the way people left the menu running on their own TVs.

## Data Shown

None. The channel uses no site data.

## Interaction

- None inside the channel. The dial, panel buttons, settings and power keep working; no keyboard capture.
- The notice link is a real link that opens the Rules in a new tab.

## Look

- A muted video loop of the original Xbox menu in its native 4:3, filling the 760×570 picture: the camera flyby from a PAL capture on the Internet Archive, with its end dissolving back into its start over 1.5 s (the game's demo reel interrupts the flyby before it completes a circuit).
- A still frame from the same loop shows while the video loads, and in its place with reduced motion.
- A small notice at the very bottom, in Microsoft's required form with a link to the Rules: "Halo © Microsoft Corporation. revenantal was created under Microsoft's 'Game Content Usage Rules' using assets from Halo, and it is not endorsed by or affiliated with Microsoft."
- No Xbox logos or Microsoft branding; "XBOX" is a referential channel label.
- Display profile: TV defaults with `bloom: false` (the notice is small text).

## Sound

The Halo main menu music, 3–4 minutes, as the channel's `music` loop through the host: it fades in after the static, ducks under the OSD, and follows volume and SND. From halome.nu's loop of the menu music, played to its natural end (3:50) and then restarted. Unlike Halo 3's, Halo's music is not explicitly cleared by the Game Content Usage Rules; the owner accepted that grey area (see `project-decisions.md`).

## Build Notes

- **Asset sources:** the video comes from "Halo Combat Evolved Xbox PAL Gameplay" on the Internet Archive (an original Xbox capture its uploader marked public domain); the music is halome.nu's loop, used by owner decision without asking halome.nu. Both are credited, with Microsoft. Nothing is extracted from game files. The source files stay out of git (`.cache/xbox-360/`); `pnpm assets:xbox` (`tools/assets/xbox_media.py`) rebuilds `public/assets/xbox/menu.{webm,mp4,webp}` and `public/assets/music/xbox.m4a`.
- **Media:** video 820 KB (VP9 WebM) or 1.05 MB (H.264 MP4 fallback), 72 s; each browser downloads one. Still 12 KB, music 1.07 MB (mono AAC, 36 kbps). Owner-approved exception to the toy art budget and the 300 KB loop budget; everything loads only on channel 7. Code stays well under 80 KB.
- **Lifecycle:** the video plays only while `active` and pauses when inactive, hidden or unmounted; no timers while inactive. The shared contract's `allowMutedVideo` option lets a channel play muted `<video>` elements only; anything audible still fails, as the Guide has `allowNetwork` for its weather requests.
- **Credits:** Art and Sound department entries for the menu loop (Internet Archive capture) and the music (halome.nu), with Halo © Microsoft Corporation, under the Game Content Usage Rules.

## Acceptance

- Channel 7 shows the menu loop with its music; the loop and the music repeat without a visible or audible seam.
- The notice is readable at the bottom, and its link opens the Rules in a new tab.
- The video pauses when the channel is inactive or the tab is hidden, and stops on tune-away.
- Reduced motion shows the still; screen readers hear "Xbox: the Halo main menu with its theme" and the notice.
- The shared contract passes, the media loads only on channel 7, and the credits list the recording and music.

## References

- [halome.nu](https://halome.nu/), the model for this channel (its own files are not used)
- [Microsoft Game Content Usage Rules](https://www.xbox.com/en-US/developers/rules)
- [Shared channel contract](channel-rules.md)
- [Channel soundscapes](soundscapes.md)
