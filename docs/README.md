# Project Documentation

This folder is the source of truth for revenantal.com: requirements, decisions, design, technical specs, the build plan and progress.

**Status:** The application scaffold and development tooling are implemented locally on `feat/1.1-foundation`; deployment and shared data work follow. Track reviewed build progress in `project/status.md`.

## Reading Order

1. `project/project-brief.md` — What the project is, who it is for, and its constraints.
2. `project/project-decisions.md` — Approved decisions, clarifications and open items. Wins over every other doc.
3. `project/status.md` — What is built and what is next.
4. `development/coding-practices.md` — How code is written here.
5. The docs for the area you are working on (see the map below).

Each doc covers one topic and links to the others it depends on, so an agent can load only what a task needs.

## Folder Structure

```txt
docs/
  README.md                     you are here
  project/
    project-brief.md            goals, audience, constraints, non-goals
    project-decisions.md        decisions log, removed features, open items
    build-plan.md               phases, tasks and gates
    status.md                   checklist of what is built and where things are
    asset-checklist.md          sounds, images, fonts, films and clips to source
  development/
    coding-practices.md         principles, TypeScript, comments, testing, pushback
    local-development.md       installation, scripts, checks and scaffold limits
    git-workflow.md             branches, commits, PRs, CI checks, no AI attribution
    repo-layout.md              folder tree and import boundaries
  architecture/
    overview.md                 modules, data flow, rules
    data-model.md               content types and site.json
    live-data.md                live.json job: Steam, GitHub, status checks
    pelican-agent.md            game-server agent, fields, setup
    forecast-and-radar.md       /api/forecast, weather and radar sources
    hosting-and-ci.md           Coolify, GitHub Actions, budgets
  tv/
    README.md                   the TV experience and its parts
    controls.md                 dial, volume, buttons, settings door, power, hint note
    dial-configuration.md       dynamic slots, blanks, detents and stable positions
    display-effects.md          scanlines, flicker, glow, bloom, precedence, perf fallback
    audio.md                    TV sounds, ambient bed, unlock, credits
    list-mode.md                list mode, responsive, reduced motion
    accessibility.md            keyboard, semantics, focus, motion
    persistence-and-urls.md     hash, localStorage keys
    art-and-assets.md           TV image pipeline, anchors, fonts, sound pipeline
  channels/
    README.md                   lineup and how channels fit the TV
    channel-rules.md            approval gate, channel behavior and content rules
    host-interface.md           props, TV actions, playlists, captions, audio and saves
    soundscapes.md              music and sound effects per channel, audio file list
    01-tv-guide.md … 11-credits.md   one doc per channel: concept, data, interaction, look, sound, build notes
  reference/
    README.md                   what is here and how to use it
    design-canvas.md            links to the design canvas and spec doc, board index
    sound-credits.md            credits for sounds already sourced
    mockups/                    screenshots of every channel mockup
    prototypes/                 prototype code (TV build, rack builder, 3D scene)
    assets/                     source photos, cleaned sprites, original sounds
  archive/
    README.md                   superseded material only
```

## Which Doc for Which Task

| Task                                    | Read                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Scaffolding, tooling, CI                | `development/*`, `architecture/hosting-and-ci.md`                                                |
| Anything on the TV cabinet or controls  | `tv/README.md`, then the specific `tv/*.md`                                                      |
| Content files, the store, types         | `architecture/data-model.md`, `architecture/overview.md`                                         |
| live.json, Steam, GitHub, status checks | `architecture/live-data.md`                                                                      |
| Game servers                            | `architecture/pelican-agent.md`, `channels/10-status.md`                                         |
| A channel                               | `channels/README.md`, `channels/channel-rules.md`, that channel's doc, `channels/soundscapes.md` |
| Weather on the TV Guide                 | `architecture/forecast-and-radar.md`, `channels/01-tv-guide.md`                                  |
| List mode or accessibility              | `tv/list-mode.md`, `tv/accessibility.md`                                                         |
| Images, sprites, sounds                 | `tv/art-and-assets.md`, `project/asset-checklist.md`, `reference/`                               |

## Documentation Lifecycle

- `project/` holds requirements, decisions, the plan and progress. Update `status.md` after every task.
- `development/` holds rules for writing code and using git.
- `architecture/`, `tv/` and `channels/` hold the specs. Once something is built, update its doc so it describes the build, not the plan.
- `reference/` holds design-time material: mockups, prototypes and source assets. It shows intent and may go stale; the specs win.
- `archive/` holds superseded docs only. Never use archived files as requirements.

## Working Rules

- Read `project/project-brief.md` and `project/project-decisions.md` before planning, design, content or implementation decisions.
- Record new decisions in `project/project-decisions.md`, with the date.
- Keep docs short and focused. Split a doc when it starts covering two topics.
- Prefer clear documentation and lightweight structure over process.

## Archive Rules

- Archive only superseded material that may still be useful for context.
- Use dated folders: `YYYY-MM-DD-short-reason/`, each with a short README explaining what was archived and why.
