# cellular-automata-lab

TypeScript library (ESM only) for experimenting with cellular automata.

## Layout
- `src/` – production code (no runtime dependencies unless an issue asks for one); `src/index.ts` re-exports the public API
- `tests/` – vitest tests, one `<module>.test.ts` per module

## Commands
- Install: `npm ci`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Test: `npm test`

CI (`.github/workflows/ci.yml`) runs exactly these. A change is done only when all pass.

## Conventions
- Node 20+, strict TypeScript, ESM; relative imports use `.js` extensions. Types on public functions, short doc comments.
- Cells are `number` 0/1 unless an issue says otherwise. Grids wrap around (toroidal) by default.
- Throw `RangeError` for invalid arguments.

## AI-driven workflow
Issues are handled by GitHub Actions (`.github/workflows/claude-issue.yml`). The orchestrating
agent delegates to three subagents in `.claude/agents/`:
- `implementer` – edits everything except `tests/`, `.github/` and `.claude/` (src, README, docs, config)
- `test-writer` – edits `tests/` only
- `reviewer` – read-only review of the diff

The agent posts, pushes and opens PRs with a GitHub App token (secrets `APP_ID` and
`APP_PRIVATE_KEY`), so its work shows up as `<app>[bot]`. Every comment it posts also starts
with `🤖 **Claude agent**`.

Branches are named `claude/issue-<number>`. Commit messages reference the issue (`#<number>`).
If CI fails on a `claude/` branch, `.github/workflows/claude-ci-fix.yml` retries automatically
(limited attempts) and labels the PR `needs-human` when it gives up.
