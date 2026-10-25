#!/usr/bin/env bash
# Fails unless the agent opened/updated a PR for the issue branch or commented on the issue
# since STARTED_AT. Needs GH_TOKEN, ISSUE_NUMBER, STARTED_AT, GITHUB_REPOSITORY.
set -euo pipefail

branch="claude/issue-${ISSUE_NUMBER}"
pr=$(gh pr list -R "$GITHUB_REPOSITORY" --head "$branch" --state open --json number,updatedAt \
  --jq "[.[] | select(.updatedAt >= \"$STARTED_AT\")][0].number // empty")
if [ -n "$pr" ]; then
  echo "Agent result: PR #$pr"
  exit 0
fi

comments=$(gh api "repos/$GITHUB_REPOSITORY/issues/$ISSUE_NUMBER/comments" --paginate \
  --jq "[.[] | select(.created_at >= \"$STARTED_AT\" and (.body | contains(\"Claude agent\")))] | length" \
  | awk '{s+=$1} END {print s+0}')
if [ "$comments" -gt 0 ]; then
  echo "Agent result: $comments new issue comment(s)"
  exit 0
fi

echo "::error::Agent finished without opening a PR or commenting on issue #$ISSUE_NUMBER"
exit 1
