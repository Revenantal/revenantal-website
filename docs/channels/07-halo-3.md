# CH 07 — Halo 3

## Summary

A recreation of the Halo 3 main menu with the Halo theme playing, modelled on [halome.nu](https://halome.nu/). Added to the lineup by the owner on 2026-10-20 as the first Phase 4 build, being the simplest and lightest channel.

- **Kind:** toy (confirm at plan review) · **Dial:** 7 · **Folder:** `halo-3` · **Build:** task 4.1 · **Status:** idea; plan review not started

## Concept

Tune in and the Halo 3 main menu is on screen: the menu backdrop and title, the menu list and the theme music, as the original game presented it. Like halome.nu, it is a faithful tribute rather than a parody, so it reads instantly to anyone who played Halo 3.

## Data Shown

To be decided at plan review. Options: a pure tribute with no site data, or menu entries that lead to projects and other channels.

## Interaction

To be decided at plan review: whether the menu items respond (highlight, select sound) and what they do. No keyboard capture unless the plan needs it; the dial and TV controls keep working.

## Look

- The Halo 3 main menu at 760×570, matching the reference.
- A small notice at the very bottom of the screen, in Microsoft's standard Game Content Usage Rules form: "Halo 3 © Microsoft Corporation. revenantal was created under Microsoft's 'Game Content Usage Rules' using assets from Halo 3, and it is not endorsed by or affiliated with Microsoft."
- Display profile: TV defaults unless the plan finds a specific reason to limit an effect (channel rules). Bloom stays off if there is small text.

## Sound

The Halo theme as the channel's music loop, following volume, SND and the host's ducking. Source, licence basis and loop length are decided at plan review.

## Build Notes

- Use Halo 3 assets only as Microsoft's [Game Content Usage Rules](https://www.xbox.com/en-US/developers/rules) allow for non-commercial fan creations, with the notice above. Check the current rules for the music and menu artwork before any asset is added, and record the outcome in `project-decisions.md`.
- Credit every asset in `content/credits.json` in the same change that adds it.
- Keep within the toy-channel budget (code ≤ 80 KB and art ≤ 120 KB gzip), loaded only with the channel. Check the music against the 300 KB loop budget.

## Open Questions for the Plan Review

- The exact assets: menu backdrop (still or animated), fonts, menu sounds, and the theme recording and its length.
- Whether the Game Content Usage Rules cover each of those uses on this site.
- Interaction and data: pure tribute, or menu entries that lead somewhere.
- Reduced motion, accessibility (spoken description, focus order) and how the notice is read.

## Acceptance

Set at plan review.

## References

- [halome.nu](https://halome.nu/), the model for this channel
- [Shared channel contract](channel-rules.md)
- [Channel soundscapes](soundscapes.md)
