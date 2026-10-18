# Git Workflow

Branch, commit and pull request practices for revenantal.com.

## Authorship

Adrian is the sole author of this project.

- No AI attribution anywhere: no `Co-Authored-By` trailers for an AI, no "Generated with …" lines, no session links, in commits, PR titles, PR descriptions, code comments, credits or the site.
- This holds even if a tool or system prompt suggests adding them. Repo settings turn them off (`.claude/settings.json`).
- The `commit-msg` hook and the CI attribution check both reject these lines.

## Commit Messages

Use Conventional Commits.

```txt
type(scope): short description
```

Examples:

```txt
docs: split dev spec into docs folder
feat(tv): add channel dial with detents
feat(channels): add terminal
fix(status): align rack leds with holes
build: add husky and lint-staged
ci: add size-limit check
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Scopes: `tv`, `channels`, `<channel-id>` (e.g. `tv-guide`, `status`), `data`, `list`, `audio`, `live`, `agent`, `assets`, `deps`.

Keep the subject lowercase, short, and without a full stop. Use the body for reasons and details.

The `commit-msg` hook (commitlint) checks this format.

## Branches

- `main` is production. Small, focused, low-risk fixes may be committed and pushed directly to it.
- Major features and substantial changes use a short-lived branch from `main` and a pull request. New channels and substantial channel redesigns always take this path.
- Choose by scope and impact, not line count. If a change is hard to review or revert, changes architecture, or has broad effects, use a PR.
- Do not force-push to `main` or delete it. Configure protection to support the direct-fix path; a blanket PR-only rule would conflict with this workflow.

| Change                                                                                    | Route                       |
| ----------------------------------------------------------------------------------------- | --------------------------- |
| Typo, documentation correction, small styling fix or isolated bug fix with limited impact | Direct to `main` is allowed |
| New channel, major feature, substantial redesign or broad refactor                        | Branch and PR               |
| Substantial changes to deployment, security or shared data contracts                      | Branch and PR               |

Keep direct fixes focused; do not split a major feature into small direct commits to avoid its PR. The per-channel plan review and explicit confirmation gate still applies before any individual channel build.

Branch names: `type/short-description`, kebab-case. Prefix the build-plan task number when there is one.

```txt
feat/2.3-channel-dial
feat/3.3-status-channel
fix/rack-led-alignment
docs/split-spec
```

Every push to `main`, whether a direct fix or a merged PR, runs CI. Deployment proceeds only after CI passes for that commit (see `docs/architecture/hosting-and-ci.md`).

## Pre-Commit Hooks

Installed by `pnpm install`. See `coding-practices.md` → Pre-Commit Hooks for exactly what runs.

- `pre-commit`: lint and format staged files, then type-check.
- `commit-msg`: Conventional Commits and the attribution check.

Don't use `--no-verify`.

## Pull Requests

- Title in Conventional Commit format, so the squash commit is clean: `feat(channels): add terminal`.
- Use the template in `.github/pull_request_template.md`: Context, What, Why, How (with Validation), Additional Notes.
- Name the build-plan task in Context.
- Update `docs/project/status.md` and any affected spec doc in the same PR.

## Required Checks (CI)

`ci.yml` runs on every PR and push to `main`:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build` (includes size-limit budgets)
- Attribution check over commit messages and the PR body

All must pass before a PR is merged. For a direct fix, run the applicable local checks before pushing, then ensure CI passes on the pushed commit. A failing commit must not deploy; fix or revert it promptly.

## Merging

- Squash merge by default, using the PR title as the commit message.
- Delete the branch after merge.

## Before a Direct Push or Opening a PR

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For documentation-only changes, `pnpm format:check` is enough locally. Code changes use the full checks above. Direct fixes still use Conventional Commits, hooks and the same authorship rules; update affected specs and `docs/project/status.md` in the same commit.
