# tools/assets

Photo and sound pipelines for the TV. Run by hand; outputs are committed under `public/assets/`. Do not import application UI code or overwrite approved references in `docs/reference/`.

Needs Python 3.12 with `pip install -r tools/assets/requirements.txt`, and ffmpeg on PATH for sound encoding.

- `pnpm assets:sprites` runs `tv_sprites.py`: keys the screen, repaints the dial without numerals, cuts the knob, volume ring/cap, button housing/faces and door, and writes WebP to `public/assets/tv/`.
- `pnpm assets:sounds` runs `tv_sounds.py`: cuts, trims, fades and normalises each TV sound, then writes AAC `.m4a` to `public/assets/sounds/`. Pass `--wav` to check the processing without ffmpeg.

Both take `--out DIR` to write elsewhere for comparison. When a shipped asset is added or removed, update `content/credits.json` in the same change; `tools/checks/asset-credits.test.ts` checks the sound sources and TV artwork.
