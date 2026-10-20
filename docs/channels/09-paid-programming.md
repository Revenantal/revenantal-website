# CH 09 — Paid Programming

## Summary

An 80s infomercial channel: 10–30 s parody clips about Revenantal, looping with station bumpers.

- **Kind:** broadcast · **Folder:** `paid-programming` · **Build:** task 4.8 · **Status:** design done; clips not made

## Concept

A cheesy late-night infomercial for "REVENANTAL! Hosting so good, your friends will ask who set it up." Starbursts, "AS SEEN ON CH 09", fake testimonials ("Folks, I've never seen uptime like it."), and "Operators are not standing by." Every clip is clearly parody.

## Clip Ideas

From public-domain films in the Prelinger Archives. Confirm each film's status on its archive.org record before cutting.

| Source film                            | Parody angle                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| _How to Use the Dial Telephone_ (1927) | "How to use the Revenantal TV": the narrator patiently explains turning the dial |
| _Destination Earth_ (1956)             | Animated Martian discovers game-server hosting (animated, so lip-sync is fine)   |
| _Shy Guy_ (1947)                       | A shy teen finally works up the nerve to join the Discord                        |
| _Stop Driving Us Crazy!_ (1959)        | "Stop Lagging Us Crazy!": server etiquette for friends                           |
| _Sniffles and Sneezes_ (1955)          | Uptime hygiene: wash your hands of downtime                                      |
| _To New Horizons_ (1940)               | World's-fair optimism about "the hosting of tomorrow"                            |
| _Six and a Half Magic Hours_ (1958)    | Six and a half magic hours of uninterrupted uptime                               |

## Content Rules

- Must read as parody. Every clip shows a "PARODY · AI-ALTERED" tag.
- Source footage is public domain or generated for the project. Never modern copyrighted video.
- Never a celebrity or public figure made to say things they didn't say. Generated presenters are preferred.
- Live-action footage gets new narration over the top. Only animated footage is lip-synced. Real people on screen never mouth new words.
- Each clip 10–30 s, loudness-normalised to −16 LUFS, credited (source and tools) in `CREDITS.md`, with WebVTT captions.

## Data Shown

The host supplies its `broadcast` prop from `site.broadcast['paid-programming']`. A small "CLIP 3 / 8 · 0:12" counter.

## Interaction

None needed. The host handles C through `setCaptions`; the shared player reads the persistent `captions` prop.

## Look

- Bright 80s colours, starbursts, chunky drop-shadow type, VHS softness.
- Font: Bungee.
- Display profile: scan 0.8, flicker, glow 0.8. `safe: true`.

## Sound

Cheesy 80s jingle bumper between clips; narration per clip; cash register; applause. See `soundscapes.md` → Paid Programming.

## Build Notes

- Same shared broadcast player as The Late Show, with the host-provided playlist, caption state and effective volume. Missing playlists show an unavailable state. See `host-interface.md`.
- Clip production (scripts, narration, cutting, captions) runs alongside phases 1–3; track it in `asset-checklist.md`.

## Acceptance

- Every clip carries the parody tag and captions.
- Every clip's source and tools are credited.

## References

- `docs/reference/mockups/ch09-paid-programming.png`
- Prototype source: `docs/reference/prototypes/boards/ChPaid.dc.html`
