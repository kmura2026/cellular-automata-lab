# cellular-automata-lab

TypeScript library (ESM only) for experimenting with cellular automata.

## Layout
- `src/` – production code (no runtime dependencies unless an issue asks for one); `src/index.ts` re-exports the public API
- `tests/` – vitest tests, one `<module>.test.ts` per module; `tests/browser/` – Playwright tests of the web demo

## Commands
- Install: `npm ci`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Test: `npm test`
- Browser tests: `npm run test:browser` (Playwright, `tests/browser/`; needs a server already
  running at `BASE_URL`, default http://localhost:8787)

CI (`.github/workflows/ci.yml`) runs exactly these. A change is done only when all pass.
Agents skip browser tests for now (they are slow); CI runs them.

## Conventions
- Node 22.12+, strict TypeScript, ESM; relative imports use `.js` extensions. Types on public functions, short doc comments.
- Cells are `number` 0/1 unless an issue says otherwise. Grids wrap around (toroidal) by default.
- Throw `RangeError` for invalid arguments.
- Keep it simple (KISS), in code and in automation (`.github/`, `.claude/`). Choose the simplest
  solution that works; add scripts, steps or abstractions only when they prevent a concrete problem.
- Don't repeat yourself (DRY), in code and in automation. State each rule or procedure in one place
  and refer to it from elsewhere, so copies cannot drift apart (e.g. both agent workflows follow
  "Making a change" below instead of each spelling it out).

## AI-driven workflow
Issues are handled by GitHub Actions (`.github/workflows/claude-issue.yml`). PRs with failed checks
(CI or review) or merge conflicts are fixed by `.github/workflows/claude-fix-pr.yml`, which pushes
to the PR branch (merging the base branch to resolve conflicts): automatically when a check fails
on a PR from this repository (at most 2 attempts per PR), or manually with the PR number (needed
for conflicts, since a conflicting PR runs no checks). In both, the orchestrating agent delegates to subagents
in `.claude/agents/`:
- `implementer` – edits everything except `tests/`, `.github/` and `.claude/` (src, README, docs, config)
- `test-writer` – edits `tests/` only
- `reviewer-<aspect>` – read-only review of the diff, one subagent per aspect (correctness,
  security, performance, maintainability, cost); shared rules in `.claude/review-rules.md`

### Making a change
`claude-issue.yml` and `claude-fix-pr.yml` change code this way.
The orchestrator never edits files itself. Subagents run one after another in the foreground,
never in parallel: wait for each result, and never end the turn while one is still running.
1. `test-writer` – give it the issue number, the concrete acceptance criteria and the intended
   public API (names and signatures). New tests for new behavior are expected to fail at first.
   A correct test is never deleted or weakened to make it pass.
2. `implementer` – give it the same, plus the test-writer's report. It makes the tests pass
   without editing them.
3. Verify: `npm run lint && npm run typecheck && npm test`. If anything fails, send the output to
   the subagent that owns the broken file and verify again. Up to 3 rounds.
4. Review as described in "Reviewing" below, only after step 3 passes. If it returns
   REQUEST_CHANGES, route each BLOCKING item to its owner (`test-writer` first when both need
   changes), then repeat step 3 and re-run only the reviewers that requested changes.
   Up to 2 review rounds.

Skip `test-writer` or `implementer` only when its side needs no change (e.g. docs only, or a fix
to a wrong test). Ownership is never a reason to stop; only changes to `.github/` or `.claude/`
need a human.

### Reviewing
"Making a change" and `claude-review.yml` review this way.
Run every `reviewer-*` subagent (`ls .claude/agents/reviewer-*.md`), one after another, giving
each the issue or PR number and the diff command if it is not the default. The review is
REQUEST_CHANGES if any reviewer returns REQUEST_CHANGES or no report in the format of
`.claude/review-rules.md`; otherwise APPROVE. Adding an aspect means adding one agent file.

The agent posts, pushes and opens PRs with a GitHub App token (setup in `docs/ai-workflow.md`),
so its work shows up as `<app>[bot]`. Every comment it posts also starts
with `🤖 **Claude agent**`.

Branches are named `claude/issue-<number>`. Commit messages reference the issue (`#<number>`),
or the PR if it has none.
Failed checks on PRs get the automatic fix attempts above; there are no other retries. If an
agent run fails, or checks still fail after the last attempt, a human takes over (for example by
running `claude-fix-pr.yml` manually).

Every PR from this repository is also reviewed by an agent (`.github/workflows/claude-review.yml`)
as described in "Reviewing". Only BLOCKING issues are reported; style and refactoring are left for
after merge. Each run posts one new review comment combining all aspects (old ones stay as
history): any issue fails the check, and a clean review posts "No issues found".
