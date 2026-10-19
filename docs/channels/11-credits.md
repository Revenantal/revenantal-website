# CH 11 — Credits

## Summary

A traditional movie-style credits roll, reached through the settings-door Credits button or the dial. It replaces the credits overlay inside the settings door.

- **Kind:** credits · **Folder:** `credits` · **Build:** task 3.6 (required at launch) · **Status:** built on `feat/3.6-credits` (approved 2026-10-19)

## Concept

White text rises from below the picture and scrolls steadily upward over black. A centered REVENANTAL heading introduces the roll, followed by the project author and the asset attributions grouped into film-style departments (Art, Typography, Sound, Weather Department). A "Thanks for watching" card closes it. Keep the typography simple and readable, with generous spacing between entries. The movement should feel like closing film credits.

## Data Shown

- Read `credits` from `ChannelProps`, supplied from the single `site.json` credits array.
- Each entry includes title, author, source link, licence, edits when present, and what it is used for.
- Present `revenantal` as the sole project author, using the public handle rather than a personal name. Third-party asset credits remain separate from project authorship.
- Group entries by their `department`, in first-seen order, keeping content order within each. Each entry shows `usedFor` as its role on the left and the title (linked), author, licence and edits on the right. Do not maintain another credits list inside this channel.
- With an empty credits array, show the project heading and author plus a short empty-state message.

## Interaction

- Entering the channel starts the roll from the top. The settings-door button closes the door as it tunes here, then moves focus to Pause (or the static-list heading with reduced motion).
- A VCR bar (◀◀ REWIND, ❚❚ PAUSE / ▶ PLAY) fades in at the bottom while the pointer moves over the picture and hides two seconds after it stops; it stays visible while one of its buttons has focus. REWIND winds back to the top in about a second with a tracking band, keeping a deliberate pause. A corner VCR display shows PAUSE or REW.
- Hovering the roll or focusing an attribution link pauses movement. Leaving hover/focus resumes only if the viewer has not deliberately paused.
- Links are real anchors opening in a new tab. Keep all entries in semantic DOM reading order and reveal the focused entry within the viewport.
- After the last line rolls off, cut to static for about a second and start again from below the picture. Do not automatically tune elsewhere.
- The dial, panel buttons, settings and power keep working. No PRESS START and no keyboard capture; arrows retain their TV behavior.
- Reduced motion: replace the animated roll with a static, manually scrollable credits list. The same entries and links remain available.

## Look

- Black background, white centered text, clear section spacing and a restrained project heading.
- Use existing self-hosted Archivo Narrow for entries and Michroma for the heading; no new font dependency.
- Authored at 760×570 with `safe: true`.
- Display profile: `scan: false`, `flicker: false`, `glow: 0.3`, `bloom: false`, `transition: cut`. Viewer effect switches still take precedence.

## Sound

No channel music or new sound assets. The normal TV ambient bed and control sounds follow volume and SND as usual.

## Build Notes

- Render text and links in DOM, not a video, canvas or scheduled broadcast player. The roll needs no network calls or third-party library.
- Move one credits container with a transform driven by requestAnimationFrame and elapsed time. Stop the loop when inactive, hidden or paused, and clean it up on unmount. Do not catch up hidden-tab time on resume.
- Use the existing host visibility/lifecycle path; do not install channel-owned global listeners.
- Honor reduced motion even when the viewer manually enables TV mode. A pause action alone does not substitute for the static version.
- Keep List mode credits, Terminal credits and `CREDITS.md` fed by the same source. Moving to this channel does not remove any required attribution beside weather, maps or media.
- Keep code within the 30 KB gzip directory-sized chunk budget; this channel adds no heavy dependency.

## Acceptance

- Credits button tunes to channel ID `credits` at its assigned position, updates the normal hash/saved position, and closes the settings door.
- Position 11 is Credits, 12 is NO SIGNAL, and existing positions are unchanged.
- Roll, pause/play, rewind, the static loop and links work with mouse and keyboard.
- Hover/focus pauses do not override an intentional pause. Focused entries stay visible and screen readers can read the list without repeated live announcements.
- Reduced-motion TV mode uses the static list; List mode retains its static credits section.
- Works with no credit entries, long entries, many entries, `live = null`, and empty projects.
- No animation or new audio continues when inactive/hidden. Source links, licences, authors and edit notes remain readable.

## References

- [Shared channel contract](channel-rules.md)
- [TV controls](../tv/controls.md)
- [Credits data](../architecture/data-model.md)
- [Shared credits destinations](../tv/audio.md#credits)
