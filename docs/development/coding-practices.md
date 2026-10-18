# Coding Practices

Project-wide coding practices for revenantal.com.

This is a small static site with one playful front end, a scheduled data job and a tiny agent. Keep it that way. Each channel can be as rich as it likes inside its own folder, but the shared code should stay simple.

## Core Principles

- Keep the implementation lightweight and easy to understand.
- One data source: views render from `site.json` and `live.json`. Nothing is hard-coded in components.
- Keep code grouped by what it is. Content, the TV, channels, the live job and the Pelican agent never share a folder (see `repo-layout.md`).
- Channels are self-contained. A channel can be deleted by deleting its folder and its line in `channels/index.ts`.
- Avoid unnecessary dependencies. Check bundle size before adding one.
- Accessibility, performance and privacy are requirements, not polish.
- Follow `docs/project/project-brief.md` and `docs/project/project-decisions.md`.

## Code Quality Pushback

### Critical Rules

1. Do not paste snippets into the project without fitting them to it.
2. Challenge off-architecture code before editing.
3. If a clarifying question is declined or unanswered, stop instead of implementing.
4. Do not reintroduce removed features (see `project-decisions.md`).

### Fit Check Before Implementation

Stop and raise a concern before editing files when a request includes:

- A channel importing the store, audio, the TV or another channel.
- Direct DOM mutation where Preact state or props would do.
- Global event listeners outside the TV input layer (`tv/controls/` and the input-capture helper).
- Polling `live.json` or calling third-party APIs from the browser (other than `/api/forecast`).
- Secrets or API keys anywhere in front-end code.
- Personal information, player names or real IP addresses in content or code.
- A new dependency that the platform or an existing one already covers.
- A heavy library (3D, physics, video) loaded outside the channel that needs it.

For these, reply in prose first with:

1. The concern.
2. A project-native alternative.
3. A specific question to confirm.

If the person still wants the original approach after the trade-off is explained, keep it isolated and note the risk in `project-decisions.md`.

## TypeScript

- `strict` plus `noUncheckedIndexedAccess`. `any` is a lint error; use `unknown` and narrow.
- `.tsx` for components, `.ts` for everything else. No plain JavaScript in `src/`, `jobs/` or `agent/`.
- Named exports only. One component per file.
- File names: components `PascalCase.tsx`; other modules `kebab-case.ts`.
- Use `import type` for type-only imports.
- Shared types live in `src/data/types.ts`. Local types stay next to the code that uses them.
- Validate anything from outside the code (content files, API responses, `servers.json`) with zod at the boundary. Inside the app, trust the types.

## Preact Components

- Keep components small. Split when a component does two jobs.
- Props are typed with a named `type XProps`.
- State that more than one component reads lives in the store. State only one component uses stays local.
- Controls change state only through store actions (`setChannel`, `setVolume`, `setPower`, `toggleSetting`), so mouse, keyboard and URL changes share one path.
- Effects (`useEffect`) clean up after themselves: timers, listeners, audio nodes, animation frames, WebGL contexts.
- Animation loops use `requestAnimationFrame` and stop when the channel unmounts or the tab is hidden.

## Channels

- A channel receives `ChannelProps` and nothing else (see `docs/channels/channel-rules.md` and the canonical `docs/channels/host-interface.md`). Use its scoped host/audio/save callbacks; never replace them with store imports or global listeners.
- Each channel folder holds: `manifest.ts`, the component, its CSS Module, a test, and any channel-only modules or assets.
- Heavy dependencies (three.js, a physics engine, hls.js) are imported only inside the channel that uses them, so lazy loading keeps them out of the main bundle.
- Channels are authored at 760×570 and scaled into the glass. Don't read the window size.

## Styling

- CSS Modules beside each component. Global CSS only for `styles/tokens.css` and `styles/reset.css`.
- Colours, sizes, radii and timings come from tokens. Channels may define their own palette tokens inside their own module.
- Site colours are black, red and dark red.
- No CSS framework.
- Stage coordinates live in `tv/geometry.ts`, one named constant each. No magic numbers in components.
- Respect `prefers-reduced-motion`; List mode is the reduced-motion site.

## Code Documentation and Comments

The goal: another developer (or agent) can read any file cold.

### Doc blocks (TSDoc)

- Every exported function, component, type, store action and constant group has a TSDoc block. `eslint-plugin-jsdoc` fails lint when one is missing.
- The first line is a one-sentence summary of what it does.
- Use `@param` for every parameter, `@returns` when the return value is not obvious, `@throws` only for intentional errors, `@example` only for shared helpers.
- Add field comments on types only for non-obvious fields, units or constraints (e.g. `// 0..1, default 1`).

### Inline comments

- Every complex block gets **one sentence** above it saying why it works the way it does, in plain words. Complex means: maths, timing, effect precedence, the audio graph, API field mapping, keying or image maths, physics and 3D setup.
- Don't comment obvious code. Prefer clearer code over a comment explaining confusing code.
- Comments should make sense on their own, without links to other docs, except to explain a specific workaround.

### Folder READMEs

- Each folder under `src/`, plus `jobs/live/`, `agent/pelican/` and `tools/assets/`, has a short `README.md`: what it owns, what it may import, and how to add to it.
- The root `README.md` is the TV operating manual, written from the finished visitor experience. Keep setup, scripts, content/channel instructions and actual build progress in `docs/`, linked through its documentation index.

### Example

```ts
/**
 * Works out how strong an effect is on screen for the current channel.
 *
 * @param viewer - The viewer's switch for this effect in the settings door.
 * @param channel - The channel's display profile value for this effect.
 * @returns Effect strength from 0 (off) to 1 (full).
 */
export function resolveEffect(
  viewer: ViewerSwitch,
  channel: EffectSetting,
): number {
  // Viewer OFF always wins: a channel may soften an effect, never force it back on.
  if (!viewer.on) return 0;
  // A channel that sets nothing gets the default strength.
  return channel === undefined ? DEFAULT_STRENGTH : Number(channel);
}
```

## Testing

- Vitest with Testing Library for components.
- Every channel has a smoke test: renders with the shared fixtures, with `live: null`, and with an empty project list.
- Unit-test the logic that's easy to get wrong: effect precedence, dial maths, broadcast schedule, store actions, live-data merging, the Pelican response mapping.
- The live job and agent are tested against saved real responses in `__fixtures__/`, never live APIs.

## Linting and Formatting

| Tool                                                                                             | Covers                                                     |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| ESLint (typescript-eslint, eslint-plugin-boundaries, jsx-a11y, eslint-plugin-jsdoc, react-hooks) | Code quality, import boundaries, accessibility, doc blocks |
| Prettier                                                                                         | Formatting for TS, CSS, JSON, Markdown, YAML               |
| Stylelint                                                                                        | CSS Modules and tokens                                     |
| `tsc --noEmit`                                                                                   | Types                                                      |

Commands:

```bash
pnpm lint          # ESLint + Stylelint
pnpm lint:fix      # apply safe fixes
pnpm format        # Prettier write
pnpm format:check  # Prettier check
pnpm typecheck     # tsc --noEmit for every package
pnpm test          # Vitest
pnpm build         # Vite build + size-limit
```

Don't hand-format against Prettier. Don't disable a lint rule inline without a one-line reason on the same line.

## Pre-Commit Hooks

Hooks run automatically on `git commit`, so problems are caught before they reach CI. They are installed by `pnpm install` (husky `prepare` script).

| Hook         | Runs                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `pre-commit` | lint-staged: ESLint `--fix`, Stylelint `--fix` and Prettier `--write` on staged files only; then `pnpm typecheck`             |
| `commit-msg` | commitlint (Conventional Commits) and the attribution check (rejects `Co-Authored-By`, "Generated with" and similar AI lines) |

Rules:

- Keep the pre-commit hook fast (under ~10 s). Tests and the build run in CI, not in the hook.
- Don't skip hooks with `--no-verify`. CI runs the same checks anyway, so a skipped hook only delays the failure.
- If a hook is wrong or too slow, fix the hook config in its own PR.

## Quality Checks

Before considering work complete:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Also check by hand:

- The TV at 1280×650 and at full HD.
- List mode (power off, under 900 px, reduced motion).
- Keyboard only: dial, buttons, settings door, channel PRESS START.
- Sound muted and unmuted.
- The channel with `live.json` missing.
- No personal info, player names or real addresses in the change.

## Privacy and Content Rules

- No personal information: no workplace or personal sites, no location, no "ask me on Steam" prompts, no `play.revenantal.com`.
- Never show player names.
- Example addresses use `203.0.113.x` (the documentation range). Real addresses come only from Pelican, and only for servers with `showAddress: true`.
- No gothic or death themes in copy or art.
- All game art is original. No copyrighted characters, logos or game assets.

## Documentation Expectations

- Plain language. Short sentences. Direct.
- When a change affects requirements, design or behaviour, update the matching doc in `docs/` in the same PR.
- Record new decisions in `docs/project/project-decisions.md`.
- Tick progress in `docs/project/status.md`.
