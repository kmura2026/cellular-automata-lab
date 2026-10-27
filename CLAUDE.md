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
- Node 22.12+, strict TypeScript, ESM; relative imports use `.js` extensions. Types on public functions, short doc comments.
- Cells are `number` 0/1 unless an issue says otherwise. Grids wrap around (toroidal) by default.
- Throw `RangeError` for invalid arguments.

## AI-driven workflow
Issues are handled by GitHub Actions (`.github/workflows/claude-issue.yml`). The orchestrating
agent delegates to subagents in `.claude/agents/`:
- `implementer` – edits everything except `tests/`, `.github/` and `.claude/` (src, README, docs, config)
- `test-writer` – edits `tests/` only
- `reviewer-<aspect>` – read-only review of the diff, one per aspect (correctness, security,
  performance, maintainability, cost); shared rules and report format in `.claude/review-rules.md`

They run in this order: `test-writer` writes the tests first, then `implementer` makes them pass,
then all `reviewer-*` subagents review the result (in parallel).

The agent posts, pushes and opens PRs with a GitHub App token (secrets `APP_ID` and
`APP_PRIVATE_KEY`), so its work shows up as `<app>[bot]`. Every comment it posts also starts
with `🤖 **Claude agent**`.

Branches are named `claude/issue-<number>`. Commit messages reference the issue (`#<number>`).
If CI fails on a `claude/` branch, `.github/workflows/claude-ci-fix.yml` retries automatically
(limited attempts) and labels the PR `needs-human` when it gives up.

Every PR from this repository is also reviewed (`.github/workflows/claude-review.yml`) by the same
`reviewer-*` subagents, whose results are merged into one comment. Only BLOCKING items count:
fatal issues, as listed in each `reviewer-*` file;
style and refactoring are left for after merge. Each run posts a new review comment
(old ones stay as history): any issue fails the check, and a clean review posts "No issues found".
A failed review on a `claude/` branch also starts `claude-ci-fix.yml`, sharing the same attempt limit.
