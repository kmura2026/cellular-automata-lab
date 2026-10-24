# AI-driven development workflow

```mermaid
flowchart TD
    A[Human opens issue] --> B[claude-issue.yml]
    M[Manual run with issue number] --> B
    B --> C{Orchestrator triages}
    C -- question / unclear --> R[Reply on issue]
    C -- code change --> D[implementer: src/]
    C -- code change --> E[test-writer: tests/]
    D --> F[Local lint + tests]
    E --> F
    F -- fail, up to 3x --> D & E
    F -- pass --> G[reviewer]
    G -- REQUEST_CHANGES, up to 2x --> D & E
    G -- APPROVE --> H[Push branch claude/issue-N, open PR]
    H --> I[CI]
    I -- fail --> J[claude-ci-fix.yml]
    J -- attempt < max --> K[Fix via subagents, push] --> I
    J -- attempt = max --> L[Label PR needs-human]
    I -- pass --> N[Human reviews and merges]
```

## Files
| File | Role |
|---|---|
| `.github/workflows/claude-issue.yml` | Runs on new issues, or manually (Actions → *Claude – handle issue* → enter issue number). |
| `.github/workflows/ci.yml` | Lint (ruff) and tests (pytest) on Python 3.11–3.13. |
| `.github/workflows/claude-ci-fix.yml` | When CI fails on a `claude/*` branch, the agent reads the log and pushes a fix. |
| `.claude/agents/implementer.md` | Subagent: edits production code only. |
| `.claude/agents/test-writer.md` | Subagent: edits tests only. |
| `.claude/agents/reviewer.md` | Subagent: read-only review, returns APPROVE / REQUEST_CHANGES. |
| `CLAUDE.md` | Project rules every agent reads. |

## Retries
- **Inside a run:** failing local checks go back to the responsible subagent (3 rounds); blocking review findings go back too (2 rounds).
- **Agent crash** (API error, timeout of the action): the issue workflow retries the agent once, then comments on the issue with the log link.
- **CI failure after push:** `claude-ci-fix.yml` tries up to 3 times (change with repository variable `CLAUDE_MAX_CI_FIX_ATTEMPTS`). Attempts are counted from marker comments on the PR. After the limit the PR gets the `needs-human` label.

## One-time setup
1. **`ANTHROPIC_API_KEY`** – repository secret (Settings → Secrets and variables → Actions).
   To use a Claude subscription instead, run `claude setup-token`, store it as `CLAUDE_CODE_OAUTH_TOKEN`,
   and replace `anthropic_api_key:` with `claude_code_oauth_token:` in both Claude workflows.
2. **`GH_BOT_TOKEN`** – fine-grained personal access token (or GitHub App token) for this repo with
   *Contents*, *Pull requests*, *Issues*: read & write, and *Actions*: read.
   **Required for the CI retry loop:** pushes made with the default `GITHUB_TOKEN` do not trigger CI,
   so without this token PRs from the agent get no CI run and no automatic fix.
3. Settings → Actions → General → Workflow permissions: allow GitHub Actions to create pull requests.
4. Recommended: protect `main` (require PR + passing CI) so nothing merges without a human.

## Safety
- Only issues from the owner, members, or collaborators start the agent; anyone else's issue is ignored.
  Manual runs can only be started by people with write access.
- The CI-fix workflow only acts on `claude/*` branches in this repository, never on forks.
- The agent can only use the tools listed in `--allowedTools` and never merges PRs.
