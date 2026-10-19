# Content Build

Reads and validates hand-edited content, resolves shared profile references, emits site.json through Vite and renders CREDITS.md from the same credits array. It may import shared data types/schemas but never a channel UI. Broadcast IDs are supplied by the build boundary once the registry exists; no playlists are accepted before then.
