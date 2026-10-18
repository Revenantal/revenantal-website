# Local Development

Use Node.js 24 and pnpm 11.9.0 (pinned in package.json). Install pnpm through its official installer or Corepack when available.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the localhost URL printed by Vite. The initial build shows a static holding screen; the data pipeline and List mode follow in phase 1. There are no live-service credentials or channel implementations in this scaffold.

## Checks

```sh
pnpm check
```

This runs formatting, ESLint/Stylelint, strict TypeScript, Vitest and the production build with a 90 kB initial JavaScript gzip limit. Individual commands are available in package.json. `pnpm preview` serves the production output locally.

ESLint enforces module boundaries, named application exports, accessibility rules, hooks rules and documentation on public declarations. Policy tests exercise forbidden imports and attribution checks. TypeScript/Vite aliases are @data, @tv, @channels, @list, @audio and @styles, each followed by a module path.

`pnpm install` installs Husky hooks. Pre-commit formats/lints staged application/tooling files and type-checks. Commit-msg checks Conventional Commits and the authorship policy. Never bypass these hooks. Only explicitly approved dependency build scripts run; pnpm-workspace.yaml records them.

## CI and Hosting

Checks run on pull requests and pushes to main/master; action versions are pinned to commit SHAs. Dependabot updates dependencies and action pins weekly. The independent reference-tool package remains under docs/reference/prototypes and keeps its existing lockfile.

Deployment workflows, service images and remote branch protection are still task 1.3 work. The scaffold does not deploy itself. No channel may be built without its separate confirmed plan.
