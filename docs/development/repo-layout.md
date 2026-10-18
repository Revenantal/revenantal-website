# Repo Layout

Where code goes and what may import what. Code is grouped by what it is: content, the TV, channels, the live job and the Pelican agent never share a folder.

## Folder Tree

```txt
revenantal/
├─ AGENTS.md / CLAUDE.md   # agent entry points
├─ README.md               # setup, scripts, add a project, add a channel
├─ docs/                   # all project documentation
├─ content/                # hand-edited JSON only; the build merges it into site.json
│  ├─ projects.json
│  ├─ buttons.json
│  ├─ servers.json         # optional per-server overrides
│  ├─ credits.json
│  └─ broadcast.json       # optional until broadcast media is configured
├─ src/
│  ├─ main.tsx             # entry: loads data, picks TV or List mode
│  ├─ data/                # types, schemas, loaders, the store and its actions
│  ├─ tv/
│  │  ├─ Stage.tsx         # fit and letterbox the 1536×1024 stage
│  │  ├─ Cabinet.tsx       # photo layers, room glow, badge
│  │  ├─ Screen.tsx        # hosts the current channel, transition, NO SIGNAL
│  │  ├─ geometry.ts       # every stage coordinate, one named constant each
│  │  ├─ controls/         # Dial, VolumeKnob, PanelButtons, SettingsDoor, PowerLed, HintNote
│  │  └─ effects/          # scanlines, phosphor filter, static, warm-up, profile resolver
│  ├─ channels/
│  │  ├─ index.ts          # explicit dial positions: the only channel registry
│  │  ├─ _shared/          # ChannelProps, input capture, save helper, broadcast player, fixtures
│  │  ├─ tv-guide/
│  │  │  ├─ manifest.ts
│  │  │  ├─ TvGuide.tsx
│  │  │  ├─ TvGuide.module.css
│  │  │  └─ TvGuide.test.tsx
│  │  └─ …one folder per channel
│  ├─ list/                # List mode
│  ├─ audio/               # sound loading, one-shots, ambient bed, unlock
│  └─ styles/              # tokens.css, reset.css
├─ api/forecast/           # weather service: DB-IP Lite, Open-Meteo, radar proxy
├─ jobs/live/              # scheduled job → live.json
├─ agent/pelican/          # runs on the Pelican host → servers.json
├─ public/assets/          # frame, sprites, sounds, fonts, per-channel assets
│  └─ channels/<id>/
├─ media/                  # broadcast video source list and LICENSES.md (video files are not in git)
├─ tools/assets/           # Python photo and sound pipeline
├─ .husky/                 # pre-commit and commit-msg hooks
├─ .claude/settings.json   # attribution off
└─ .github/
   ├─ workflows/           # ci.yml, deploy.yml
   └─ pull_request_template.md
```

Folder names under `channels/` match the channel `id`: `tv-guide`, `rev-os`, `terminal`, `night-drive`, `side-quest`, `revscape`, `coin-drop`, `late-show`, `paid-programming`, `status`, `credits`.

## Import Boundaries

Enforced by `eslint-plugin-boundaries`, so a wrong import fails lint.

| From                      | May import                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `channels/<id>/`          | `channels/_shared/`, types from `data/types.ts`, its own files, its own heavy deps |
| `channels/index.ts`       | each channel's `manifest.ts` (lazy component import), `_shared/` registry types    |
| `tv/`                     | `data/`, `audio/`, `channels/index.ts`, `channels/_shared/` types                  |
| `list/`                   | `data/`                                                                            |
| `audio/`                  | `data/` (settings only)                                                            |
| `data/`                   | nothing in `src/` except itself                                                    |
| `jobs/`, `agent/`, `api/` | `src/data/types.ts` and schemas only; no front-end runtime code                    |

Never:

- A channel importing the store, audio, the TV, `list/` or another channel.
- The TV importing a channel folder directly.
- Anything importing from `content/` except `data/` loaders and the build.

`data/types.ts` contains content and serializable manifest metadata only. Preact-dependent props, save helpers, manifest loaders and the typed registry live in `channels/_shared/types.ts`, as specified in [the host interface](../channels/host-interface.md). This keeps data/jobs/agent imports independent of the frontend runtime.

## Adding a Channel

1. Prepare or update `docs/channels/NN-<id>.md`, review the concrete plan with the project owner, and obtain explicit confirmation for that channel. Follow the approval gate in `docs/channels/channel-rules.md` and record the approved scope and date.
2. After confirmation, create `src/channels/<id>/` with `manifest.ts`, the component, a CSS Module and a test.
3. Add its manifest under an explicit unused positive integer position in `channels/index.ts`. Leave gaps for unbuilt or skipped channels; never compact or renumber the registry.
4. Keep the channel specification current and add its sounds to `docs/channels/soundscapes.md` and credits.

## Adding a Project

Add an entry to `content/projects.json`. Every channel picks it up. No code changes.
