# Agent Guide

Shared rules for any AI agent (Claude, Codex, Cursor, Copilot or similar) working in this repo. `CLAUDE.md` points here.

## Instruction Location

Keep shared project instructions and notes in `AGENTS.md`. `CLAUDE.md` contains only the `@AGENTS.md` import. Tool-specific settings stay in their configuration files; do not duplicate project guidance there.

## What This Project Is

revenantal.com is a non-commercial landing page and directory for the projects hosted under the revenantal name. It is presented as a vintage CRT TV: each dial position is a channel, and each channel is a different UI over one shared data source. Turning the TV off shows a plain list, which is also the mobile and reduced-motion site.

## Start Here

1. Read `docs/README.md`. It explains the docs layout and the reading order.
2. Read `docs/project/project-brief.md` and `docs/project/project-decisions.md` before any planning, design or code decision.
3. Check `docs/project/status.md` to see what is built and what is next.
4. Read only the docs for the area you are working on. Each one is short and self-contained.

## Documentation Rules

- `docs/` is the source of truth for requirements, design, specs, the plan and progress.
- Where `project-decisions.md` conflicts with any other doc, follow `project-decisions.md`.
- Record new decisions, clarifications and open items in `docs/project/project-decisions.md`. Do not edit the brief to record a decision.
- After finishing any task, tick it in `docs/project/status.md` and update the matching doc if the build changed what it describes.
- Keep docs, comments and notes simple, direct and easy to read. One topic per file.
- Use `docs/reference/` for mockups, prototypes and source assets. They show design intent; the specifications and approved decisions win where they disagree.
- Do not reintroduce removed features listed in `docs/project/project-decisions.md` (for example the window reflection, oval glare and mouse tilt).

## Authorship

The project owner is the sole author of record.

- Never add a `Co-Authored-By:` trailer, "Generated with…" footer, AI badge, session link or any other AI attribution to code, commits, pull requests or release notes, or as authorship anywhere on the site.
- Exception: an asset credit (`content/credits.json`) may name the tools used to create or edit that image, for example ChatGPT and Claude. This describes how an asset was made; it is not authorship, and `revenantal` stays the credited author.
- Commit and pull request attribution is disabled in `.claude/settings.json`; the shared authorship rule applies to every agent.
- The `commit-msg` hook rejects these lines and CI fails any pull request that contains one. See `docs/development/git-workflow.md`.

## Code Rules

- Follow `docs/development/coding-practices.md` for all code.
- Follow `docs/development/git-workflow.md` for branches, commits and pull requests. Small, focused, low-risk fixes may go directly to `main`; major features, new channels and substantial changes require a branch and PR. Direct fixes still require applicable checks and hooks; never split a major change into small commits to avoid review.
- Follow `docs/development/repo-layout.md` for where code lives and what may import what.
- Pre-commit hooks lint, format and type-check staged files. Never bypass them with `--no-verify`; fix the problem instead.
- Build in the order set by `docs/project/build-plan.md`. Channels come after the TV shell and the data pipeline.

## Channel Plan Approval

Before building any individual channel, check in with the project owner, review that channel’s current plan, and obtain explicit confirmation to begin implementation. This applies to every channel, including launch channels and Credits.

- Prepare or update the channel specification with its scope, layout, interactions, data needs, assets, accessibility, performance budget and validation plan. Surface unresolved choices before asking for confirmation.
- Present the concrete plan for review and wait for an explicit go-ahead for that channel. An existing mockup, approved lineup, earlier design decision or approval of another channel does not authorize implementation.
- Record the confirmed scope and approval date in `docs/project/project-decisions.md`, and update the channel’s status. If confirmation is absent, declined or unanswered, stop channel implementation; planning may continue.
- If the approved scope changes materially, review the revised plan and obtain confirmation before building the changed scope. Routine implementation choices within the confirmed plan do not need another approval.

See `docs/channels/channel-rules.md` → Before Building a Channel.

## Code Quality Pushback

- Do not blindly paste snippets into this project.
- Challenge code that breaks the architecture (for example a channel importing the store, a global listener, or hard-coded content) before editing.
- For a questionable request, reply in prose first: the concern, a project-native alternative, and one confirmation question. Do not edit files in that turn.
- If a clarifying question is declined or unanswered, stop instead of implementing.

## Privacy and Content Rules

- Never put the project owner's location, workplace, personal sites or contact prompts on the site or in sample data.
- Never fall back to a fixed city for the weather forecast.
- Use the public handle `revenantal` in code and site-facing author credits; do not hard-code the project owner’s personal name.
- Game-server player names are never shown.
- Only public-domain films and clearly labelled parody clips go on the broadcast channels. See `docs/channels/channel-rules.md`.
