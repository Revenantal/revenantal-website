# TV Art and Asset Pipeline

All TV graphics come from one AI-generated photo (1536×1024, flip-down door version), processed by a repeatable script so a new source photo can be dropped in later. Source photo: `docs/reference/assets/tv/`.

Credit each image in `content/credits.json` when it ships: author `revenantal`, with the tools named in the entry (generated with ChatGPT, edited with Claude) and the processing listed under edits. The rack sprites follow the same rule.

## Image Pipeline (`tools/assets/`)

Python + Pillow/NumPy, run by hand with `pnpm assets:sprites` (`tools/assets/tv_sprites.py`). Output goes to `public/assets/tv/`; the script's results match the approved reference sprites to within a few levels per channel.

1. **Key the screen:** alpha = 1 − clamp((G − max(R,B) − 30) / 70); despill green on the edges. Screen box: x 100–1182, y 92–900.
2. **Repaint the dial face:** black disc to r 81 with a subtle radial gradient, inner groove at r 48, 60 tick marks. No numerals are baked or drawn; tick marks are decorative and do not define channel capacity.
3. **Cut the dial knob:** disc r 46 plus the pointer-bar sectors out to r 55 (±12° around −33.3° and 146.7°); red index dot on the pointer end. The sprite keeps the photo's −33.3° pointer angle (clockwise from 12 o'clock), so the dial rotates it relative to that.
4. **Clear the button area** (x 1311–1461, y 421–615): per-row tone interpolated between the clean panel edges, plus tiled high-pass brushing from those edges.
5. **Cut sprites:** button housing (1315,425 → 1457,488, rounded alpha, face opening filled as a dark recess), three faces (cream 1330,435 114×43; grey 1331,497 113×44; dark 1331,560 113×43; 2 px rounded corners), volume ring (r 36.5 around (1392, 370), light index notch at 12 o'clock) and cap (r 26.5), settings door (1284,618 → 1488,691). The frame keeps the door's rim and hinges with a dark cavity behind it.
6. Export WebP (quality 86–92). Sizes: frame ~100 KB, sprites 1–5 KB each.

## Room Photo

`docs/reference/assets/tv/room.png` (1536×1024) is a dark den around a painted copy of the TV. The sprite script exports it as `public/assets/tv/room.webp`. The painted cabinet spans about (300, 102)–(1244, 750); `ROOM` in `tv/geometry.ts` maps the real cabinet centre (767.5, 508.5) onto (772, 426) at 0.651 room pixels per stage pixel (matched by height), so the real TV fully covers the painted one. The frame's photo margin outside the cabinet is transparent so the room shows up to the cabinet edge. A replacement room image must keep a straight-on TV at a similar size and position, or the `ROOM` values need re-measuring.

## Anchor Points

Stage coordinates, kept in `tv/geometry.ts`.

| Part                                          | Position                                      |
| --------------------------------------------- | --------------------------------------------- |
| Screen box                                    | left 96, top 88, 1092×816                     |
| Dial centre / knob radius                     | (1391, 211) / 56 sprite                       |
| Volume knob centre / ring sprite / cap sprite | (1392, 370) / 74 px / 54 px                   |
| Button stack area                             | x centre 1386, y 424–614 (190 px)             |
| Settings door                                 | 1284,618 → 1488,691; hinge on the bottom edge |
| Power LED                                     | centre (1455, 908)                            |
| Badge                                         | 290×42 at (496, 964)                          |

## Sound Pipeline

ffmpeg + Python, run with `pnpm assets:sounds` (`tools/assets/tv_sounds.py`): mono → cut → trim silence at 1% of peak → 2.5 ms fade-in, 10–60 ms fade-out → normalise to −1 dBFS → resample to 44.1 kHz → AAC 96 kbps `.m4a` in `public/assets/sounds/` (about 80 KB for all ten). Cut points live in the script: button press 0–0.215 s and release from 0.215 s; door open and close are the first two takes. Originals and source links stay in `docs/reference/`.

## Fonts

Self-hosted through pinned `@fontsource` packages: import the Latin-subset CSS for each weight used (for example `@fontsource/michroma/latin-400.css`). Vite bundles the WOFF2 files with hashed names, so they cache long-term; the CSS uses `font-display: swap`. No Google Fonts requests and no separate subsetting tool. The TV shell and List mode import theirs from the entry; each channel imports its own fonts inside its lazy chunk. Add each new font to the credits when it ships.

| Font                                | Used by                                       |
| ----------------------------------- | --------------------------------------------- |
| Michroma, Archivo Narrow            | TV badge, UI, List mode                       |
| Archivo Black                       | TV Guide, Night Drive                         |
| Pixelify Sans                       | Revscape                                      |
| Press Start 2P                      | Side Quest, Night Drive HUD, Status LED signs |
| VT323                               | Terminal, Status displays                     |
| Bungee                              | Coin Drop, Paid Programming                   |
| IM Fell English, IM Fell English SC | The Late Show                                 |
| JetBrains Mono                      | Status readouts                               |
| Permanent Marker                    | Hint note                                     |
| System Tahoma / Segoe UI stack      | Rev OS                                        |

## Channel Art

Per-channel art pipelines (rack sprites, Revscape fallback still) are in each channel's doc.

**TV Guide base map:** `public/assets/tv-guide/land-110m.json`, built by `python tools/assets/natural_earth.py` from Natural Earth 1:110m land polygons, release v5.1.2 (`nvkelso/natural-earth-vector`, public domain: https://www.naturalearthdata.com/about/terms-of-use/). Processing: outer and inner rings kept, coordinates rounded to 0.01° and stored as flat integer arrays; 57 kB raw, about 25 kB gzipped. Served as a static file and fetched only when the forecast shows, so it stays out of the channel's JavaScript.
