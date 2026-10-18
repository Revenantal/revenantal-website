# Reference

Design-time material: mockups, prototypes and source assets. It shows intent and may go stale. **Where anything here disagrees with a spec doc, the spec wins.** Removed features that still appear in a mockup stay removed.

## Contents

| Folder / file                    | What it is                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `design-canvas.md`               | Links to the live design canvas and the original long-form spec, plus the board index |
| `sound-credits.md`               | Credits for the TV sounds already sourced                                             |
| `mockups/`                       | Screenshots of every approved channel mockup (`chNN-<id>.png`)                        |
| `mockups/archive/`               | Options that were explored and not chosen                                             |
| `prototypes/door-tv.dc.html`     | The canonical interactive TV build (dial, knobs, buttons, door, effects, sounds)      |
| `prototypes/boards/`             | Source for every current mockup board                                                 |
| `prototypes/build_rack.py`       | Generator for the Status rack mockups                                                 |
| `prototypes/revscape-scene.html` | The three.js Revscape prototype scene                                                 |
| `prototypes/render-boards.js`    | Playwright script that screenshotted the boards                                       |
| `assets/tv/`                     | Source TV photo (door version), the alternate photo, and cut sprites                  |
| `assets/rack/source-cleaned/`    | Keyed and cleaned rack hardware PNGs (full resolution)                                |
| `assets/rack/web/`               | The same as WebP, as used in the mockups                                              |
| `assets/guide/`                  | Mockup radar map and "Coming up" still                                                |
| `assets/revscape/`               | Render from the prototype scene                                                       |
| `assets/sounds/`                 | Original TV sound files from Freesound, unprocessed                                   |

## Using the Prototypes

The reference tools are an isolated development package under `docs/reference/prototypes/`; they do not scaffold or ship the application. From the repository root:

```powershell
pnpm --dir docs/reference/prototypes install --frozen-lockfile
pnpm --dir docs/reference/prototypes exec playwright install chromium
pnpm --dir docs/reference/prototypes check
pnpm --dir docs/reference/prototypes render
pnpm --dir docs/reference/prototypes run render:scene
```

The package requires Node 22 or newer. Its pnpm lockfile and exact dependency versions pin Playwright, three.js and the local Fontsource fonts. Use the package-manager version recorded in its `package.json`. Browser and package installation need network access; rendering uses local files and blocks external requests.

`render` handles the 14 static boards in `prototypes/boards/`, resolves the canvas blob references to the checked-in assets, embeds local fonts, waits for font/image readiness, and writes PNGs into ignored `prototypes/renders/`. It leaves approved mockups and board HTML untouched. `check` validates inputs, fonts and asset mappings without launching a browser.

To render an individual board from any working directory, pass a filename from `boards/`:

```powershell
node docs/reference/prototypes/render-boards.js ChGuide.dc.html ChStatusRack.dc.html
```

`--output-dir DIR` chooses another output directory. Unknown options, missing assets and explicit canvas-only inputs fail with a nonzero exit status. The renderer produces no temporary HTML files.

The following exports need the original design-canvas runtime and are not local static pages: `door-tv.dc.html`, `BadgeSheet.dc.html`, `BrandChrome.dc.html`, `SoundBoard.dc.html` and `Terminal.dc.html`. Batch rendering identifies and skips the four canvas-only boards; the TV export is outside that batch. Their bindings, support runtime and processed audio cannot be reconstructed just by remapping images. Open them on the canvas for interaction testing.

The standalone `revscape-scene.html` renders locally through `render:scene`; the tool serves only that scene and installed three.js build modules on loopback, saves `renders/revscape-scene.png`, and shuts the server down afterward.

The rack generator now accepts an explicit output directory, without requiring a trailing separator:

```powershell
python docs/reference/prototypes/build_rack.py --output-dir docs/reference/prototypes/renders/rack
```

Omit `--output-dir` to write into `prototypes/renders/`. Output is UTF-8, with deterministic sample data. It does not replace the approved board sources by default. Generated rack HTML is still a design-canvas export; rendering the approved static boards uses the renderer described above.

Use all prototypes for timings, layout and feel. Rewrite production code to the standards in `docs/development/coding-practices.md`; reference behavior is not the current product specification.

## Verification (2026-10-18)

Validated all 14 static boards and rendered each in Chromium, rendered the 3D scene, and ran the rack generator into a separate output directory. Visually inspected the TV Guide, project rack and scene renders. Canvas-only references are explicitly excluded from local interaction verification.

## Assets in the Build

These are sources, not build files. The asset tools (task 2.1) and channel builds export final files into `public/assets/`. Sound originals stay here so the pipeline can be re-run.
