# Project Brief

The baseline description of revenantal.com, written from the owner's requirements. Change it only when Adrian changes the brief; record decisions and clarifications in `project-decisions.md`.

## Background

Revenantal is Adrian's gamer tag (GitHub, Steam and Discord username `revenantal`). He owns revenantal.com and uses it for sandbox projects on subdomains, tools for himself and friends, and game-server hosting. The root domain needs a landing page that works as a directory of those projects.

The site is **non-commercial**.

## Goals

- A fun, game-like landing page that is a directory of the projects Adrian hosts, with links out to each one.
- Present it as a vintage CRT TV with a channel dial. Each channel is a different interface concept with its own independent vibe, and all channels are powered by **one shared data source**.
- Changing channel plays static and noise while the next interface loads in, with real sounds.
- Social links (Steam, GitHub, Discord) are big clunky buttons on the TV.
- Steam and GitHub activity are shown, but stay in the background. The projects are the focus.
- Game servers are listed with their live status.
- Turning the TV off fades to a simple navigation list built from the same data. That list is also the mobile and reduced-motion site.

## Audience

Friends, people who use Adrian's tools and game servers, and anyone curious who lands on the domain.

## Design Direction

- A realistic vintage TV built from a photograph, not a cartoon: the flip-down settings-door TV picked by Adrian.
- Branding: a chrome two-line spec-plate badge on the bottom strip reading "REVENANTAL / SOLID STATE · MODEL RV-404". Block lettering, never cursive.
- Site colours are black, red and dark red. Channels can use their own palettes.
- No gothic or death themes.
- Real recorded sounds over synthesized ones.

## Platforms

- Full TV experience on desktop and laptop, responsive down to a 1280×650 laptop viewport.
- Below that (under 900 px wide), and for reduced-motion visitors, the simple list is the site.

## Constraints

- **Privacy:** no personal information. No workplace or personal sites, no location, no prompts like "ask me on Steam", no `play.revenantal.com`.
- **One data source:** projects, channels, buttons, credits and live data are defined once and every view renders from them.
- **Licensing:** sounds prefer CC0; CC BY is fine with credit. Films must be public domain. Parody clips must read as parody. All game art is original.
- **Authorship:** Adrian is the sole author. No AI co-author lines or attribution anywhere.
- **Build:** GitHub Actions builds, lints and tests; Coolify only runs what Actions publishes.
- **Code quality:** code documented to the language's standards, with one-sentence explanations on complex sections, and a clean structure where channels are separate from project data and from each other.

## Non-Goals for v1

- No CMS or admin UI; content is edited in data files.
- No user accounts, analytics dashboards or comments.
- No 3D rendering for the TV itself (it is a 2D photo composite). Revscape is the one channel that renders in 3D.
- No game-server monitoring beyond what the live data service returns.
