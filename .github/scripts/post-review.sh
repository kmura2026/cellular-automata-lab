#!/usr/bin/env bash
# Turns the reviewer agent's JSON result into a PR comment and a job result.
#   blocking findings     -> comment, exit 1
#   non-blocking only     -> comment, exit 0
#   no findings           -> "No issues found" comment, exit 0
# Each run posts a new comment, so the PR keeps the full review/fix history.
# The hidden marker names the reviewed commit; claude-ci-fix.yml looks it up by SHA.
# Needs GH_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, HEAD_SHA, REVIEW_FILE.
set -euo pipefail

MARKER="<!-- claude-review sha=$HEAD_SHA -->"

if ! jq -e '(.blocking | type == "array") and (.non_blocking | type == "array")' \
  "$REVIEW_FILE" >/dev/null 2>&1; then
  echo "::error::Reviewer agent did not write a valid result to $REVIEW_FILE"
  exit 1
fi

blocking=$(jq '.blocking | length' "$REVIEW_FILE")
non_blocking=$(jq '.non_blocking | length' "$REVIEW_FILE")
echo "Review result: $blocking blocking, $non_blocking non-blocking"

if [ "$blocking" -gt 0 ]; then
  verdict="❌ **Changes requested** – $blocking blocking issue(s)"
elif [ "$non_blocking" -gt 0 ]; then
  verdict="✅ **Approved with comments** – no blocking issues"
else
  verdict="✅ **No issues found**"
fi

# One markdown bullet per finding: "- `file:line` problem → suggestion"
# Missing or empty fields get a fallback, so the comment never shows "null".
items='map("- `\(.file // "general")\(if .line then ":\(.line)" else "" end)` \(.problem // "" | if . == "" then "(no description)" else . end)\(.suggestion // "" | if . == "" then "" else " → \(.)" end)") | join("\n")'

body_file=$(mktemp)
{
  echo "$MARKER"
  echo "🤖 **Claude agent**"
  echo
  echo "$verdict"
  echo
  jq -r '.summary // empty' "$REVIEW_FILE"
  if [ "$blocking" -gt 0 ]; then
    echo
    echo "### Blocking"
    jq -r ".blocking | $items" "$REVIEW_FILE"
  fi
  if [ "$non_blocking" -gt 0 ]; then
    echo
    echo "### Non-blocking"
    jq -r ".non_blocking | $items" "$REVIEW_FILE"
  fi
  echo
  echo "<sub>Commit ${HEAD_SHA:0:7}</sub>"
} > "$body_file"

gh pr comment "$PR_NUMBER" -R "$GITHUB_REPOSITORY" --body-file "$body_file"

if [ "$blocking" -gt 0 ]; then
  echo "::error::Reviewer found $blocking blocking issue(s)"
  exit 1
fi
