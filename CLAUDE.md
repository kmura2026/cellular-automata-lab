# cellular-automata-lab

Python library for experimenting with cellular automata.

## Layout
- `src/cellular_automata_lab/` – production code (pure Python, no runtime dependencies unless an issue asks for one)
- `tests/` – pytest tests, one `test_<module>.py` per module

## Commands
- Install: `pip install -e '.[dev]'`
- Lint: `ruff check . && ruff format --check .`
- Test: `pytest -q`

CI (`.github/workflows/ci.yml`) runs exactly these. A change is done only when all pass.

## Conventions
- Python 3.11+, type hints on public functions, short docstrings.
- Cells are `int` 0/1 unless an issue says otherwise. Grids wrap around (toroidal) by default.
- Raise `ValueError` for invalid arguments.

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
