#!/usr/bin/env bash
# Turns the reviewer agent's JSON result into a PR comment and a job result.
#   issues    -> comment, exit 1
#   no issues -> "No issues found" comment, exit 0
# Each run posts a new comment, so the PR keeps the full review/fix history.
# The hidden marker names the reviewed commit; claude-ci-fix.yml looks it up by SHA.
# Needs GH_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, HEAD_SHA, REVIEW_FILE.
set -euo pipefail

MARKER="<!-- claude-review sha=$HEAD_SHA -->"

if ! jq -e '.issues | type == "array"' "$REVIEW_FILE" >/dev/null 2>&1; then
  echo "::error::Reviewer agent did not write a valid result to $REVIEW_FILE"
  exit 1
fi

count=$(jq '.issues | length' "$REVIEW_FILE")
echo "Review result: $count issue(s)"

if [ "$count" -gt 0 ]; then
  verdict="❌ **Changes requested** – $count issue(s)"
else
  verdict="✅ **No issues found**"
fi

# One markdown bullet per issue: "- `file:line` problem → suggestion"
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
  if [ "$count" -gt 0 ]; then
    echo
    echo "### Issues"
    jq -r ".issues | $items" "$REVIEW_FILE"
  fi
  echo
  echo "<sub>Commit ${HEAD_SHA:0:7}</sub>"
} > "$body_file"

gh pr comment "$PR_NUMBER" -R "$GITHUB_REPOSITORY" --body-file "$body_file"

if [ "$count" -gt 0 ]; then
  echo "::error::Reviewer found $count issue(s)"
  exit 1
fi
