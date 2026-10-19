# Content

Hand-edited JSON is validated by src/data/schemas.ts and compiled into site.json by tools/content/. Runtime observations belong in live.json.

- directory.json selects github or curated project navigation and a limit of 1–30. GitHub is the approved default, with ten recent public projects.
- projects.json contains optional curated projects; it is intentionally empty while GitHub supplies navigation.
- links.json defines public profiles once. buttons.json references those keys for links/copy actions; in List mode the Status tune button links to the servers section and other tune buttons are hidden.
- servers.json contains optional visibility, naming and address policies. It never invents discovered servers.
- credits.json is the shared attribution source. It lists every external asset the site ships (fonts, sounds, images, media), CC0 included, and nothing unshipped. Add an entry in the same change that ships the asset. Run pnpm credits:write after editing it.
- Optional broadcast.json holds playlists, validated against registered broadcast channel IDs. None are registered yet.

Never add runtime status, secrets, personal information or player names here.
