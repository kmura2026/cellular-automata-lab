#!/usr/bin/env bash
# Turns the reviewer agent's JSON result into a PR comment and a job result.
#   blocking findings     -> comment, exit 1
#   non-blocking only     -> comment, exit 0
#   no findings           -> remove an old review comment if any, exit 0
# Keeps one review comment per PR (found by MARKER) and updates it on each run.
# Needs GH_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, HEAD_SHA, REVIEW_FILE.
set -euo pipefail

MARKER="<!-- claude-review -->"

if ! jq -e '(.blocking | type == "array") and (.non_blocking | type == "array")' \
  "$REVIEW_FILE" >/dev/null 2>&1; then
  echo "::error::Reviewer agent did not write a valid result to $REVIEW_FILE"
  exit 1
fi

blocking=$(jq '.blocking | length' "$REVIEW_FILE")
non_blocking=$(jq '.non_blocking | length' "$REVIEW_FILE")
echo "Review result: $blocking blocking, $non_blocking non-blocking"

old_comment=$(gh api "repos/$GITHUB_REPOSITORY/issues/$PR_NUMBER/comments" --paginate \
  --jq ".[] | select(.body | contains(\"$MARKER\")) | .id" | tail -n 1)

if [ "$blocking" -eq 0 ] && [ "$non_blocking" -eq 0 ]; then
  if [ -n "$old_comment" ]; then
    gh api -X DELETE "repos/$GITHUB_REPOSITORY/issues/comments/$old_comment" >/dev/null
    echo "Removed outdated review comment $old_comment"
  fi
  exit 0
fi

if [ "$blocking" -gt 0 ]; then
  verdict="❌ **Changes requested** – $blocking blocking issue(s)"
else
  verdict="✅ **Approved with comments** – no blocking issues"
fi

# One markdown bullet per finding: "- `file:line` problem → suggestion"
items='map("- `\(.file // "general")\(if .line then ":\(.line)" else "" end)` \(.problem)\(if .suggestion then " → \(.suggestion)" else "" end)") | join("\n")'

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

if [ -n "$old_comment" ]; then
  gh api -X PATCH "repos/$GITHUB_REPOSITORY/issues/comments/$old_comment" \
    -F "body=@$body_file" >/dev/null
else
  gh pr comment "$PR_NUMBER" -R "$GITHUB_REPOSITORY" --body-file "$body_file"
fi

if [ "$blocking" -gt 0 ]; then
  echo "::error::Reviewer found $blocking blocking issue(s)"
  exit 1
fi
