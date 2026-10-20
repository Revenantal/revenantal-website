# CH 07 — XBOX

## Summary

The original Halo: Combat Evolved main menu with its music, as if the TV's input were an original Xbox left sitting on the menu. A tribute modelled on [halome.nu](https://halome.nu/). Approved by the owner on 2026-10-20 as the first Phase 4 build.

- **Kind:** toy · **Dial:** 7 · **Folder:** `xbox` · **Build:** task 4.1 · **Status:** plan approved; waiting on the owner's files

## Concept

Tune in and the real Halo main menu fills the screen in its native 4:3, its music playing, exactly as the game showed it on a CRT. Nothing to click and nothing to win: it is something to leave running on the TV, the way people left the menu running on their own TVs.

## Data Shown

None. The channel uses no site data.

## Interaction

- None inside the channel. The dial, panel buttons, settings and power keep working; no keyboard capture.
- The notice link is a real link that opens the Rules in a new tab.

## Look

- A seamless muted video loop of the menu filling 760×570 (full-bleed), from the owner's recording.
- A still frame from the same recording shows while the video loads, and in its place with reduced motion.
- A small notice at the very bottom, in Microsoft's required form with a link to the Rules: "Halo © Microsoft Corporation. revenantal was created under Microsoft's 'Game Content Usage Rules' using assets from Halo, and it is not endorsed by or affiliated with Microsoft."
- No Xbox logos or Microsoft branding; "XBOX" is a referential channel label.
- Display profile: TV defaults with `bloom: false` (the notice is small text).

## Sound

The Halo main menu music, 3–4 minutes, as the channel's `music` loop through the host: it fades in after the static, ducks under the OSD, and follows volume and SND. Supplied by the owner. Unlike Halo 3's, Halo's music is not explicitly cleared by the Game Content Usage Rules; the owner accepted that grey area (see `project-decisions.md`).

## Build Notes

- **Asset rules:** footage and music come from the owner's recording or a commercial soundtrack, never from game files (the Rules forbid reverse engineering). Raw recordings stay out of git (`.cache/xbox-360/`); `tools/assets/` gets a script that cuts the loop, still and music, so they can be rebuilt.
- **Media:** video about 1–2 MB (WebM, with MP4 if Safari needs it), still about 100 KB, music about 1 MB (mono AAC). Owner-approved exception to the toy art budget and the 300 KB loop budget; everything loads only on channel 7. Code stays well under 80 KB.
- **Lifecycle:** the video plays only while `active` and pauses when inactive, hidden or unmounted; no timers while inactive. The shared contract gains a narrow allowance for one muted decorative video, as the Guide has one for its weather requests.
- **Credits:** Art and Sound department entries for the recording and the music (Halo © Microsoft; used under the Game Content Usage Rules), added with the assets.

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
