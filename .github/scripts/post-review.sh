#!/usr/bin/env bash
# Merges the results of the reviewer-* subagents into ONE PR comment and a job result.
#   issues            -> comment, exit 1
#   missing result(s) -> comment with a warning, exit 1
#   no issues         -> "No issues found" comment, exit 0
# Each run posts a new comment, so the PR keeps the full review/fix history.
# The hidden marker names the reviewed commit; claude-ci-fix.yml looks it up by SHA.
# Needs GH_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, HEAD_SHA and REVIEW_DIR (holds <aspect>.json).
# The expected aspects are the .claude/agents/reviewer-<aspect>.md files.
set -euo pipefail

MARKER="<!-- claude-review sha=$HEAD_SHA -->"

REVIEW_ASPECTS=$(find .claude/agents -name 'reviewer-*.md' -exec basename {} .md \; | sed 's/^reviewer-//' | sort | xargs)
if [ -z "$REVIEW_ASPECTS" ]; then
  echo "::error::No .claude/agents/reviewer-*.md files found"
  exit 1
fi

# Collect valid results, tagging each issue with its aspect. Aspects without a valid result
# are listed as missing.
results='[]'
missing=()
for aspect in $REVIEW_ASPECTS; do
  file="$REVIEW_DIR/$aspect.json"
  if jq -e '.issues | type == "array"' "$file" >/dev/null 2>&1; then
    results=$(jq --arg a "$aspect" --argjson r "$results" \
      '$r + [{aspect: $a, summary: (.summary // ""), issues: [.issues[] | . + {aspect: $a}]}]' "$file")
  else
    echo "::error::The $aspect reviewer did not write a valid result to $file"
    missing+=("$aspect")
  fi
done

count=$(jq '[.[].issues[]] | length' <<<"$results")
echo "Review result: $count issue(s), ${#missing[@]} missing aspect(s)"

if [ "$count" -gt 0 ]; then
  verdict="❌ **Changes requested** – $count issue(s)"
elif [ "${#missing[@]}" -gt 0 ]; then
  verdict="⚠️ **Review incomplete**"
else
  verdict="✅ **No issues found**"
fi

# One line per aspect: "- **security** ✅ summary" or "- **security** ❌ 2 issue(s) – summary"
aspects='map("- **\(.aspect)** \(if (.issues | length) > 0 then "❌ \(.issues | length) issue(s)" else "✅" end)\(if .summary != "" then " – \(.summary)" else "" end)") | join("\n")'
# One markdown bullet per issue: "- **aspect** `file:line` problem → suggestion"
# Missing or empty fields get a fallback, so the comment never shows "null".
items='[.[].issues[]] | map("- **\(.aspect)** `\(.file // "general")\(if .line then ":\(.line)" else "" end)` \(.problem // "" | if . == "" then "(no description)" else . end)\(.suggestion // "" | if . == "" then "" else " → \(.)" end)") | join("\n")'

body_file=$(mktemp)
{
  echo "$MARKER"
  echo "🤖 **Claude agent**"
  echo
  echo "$verdict"
  echo
  jq -r "$aspects" <<<"$results"
  for aspect in "${missing[@]}"; do
    echo "- **$aspect** ⚠️ no result (the reviewer did not run or its report was lost; re-run the workflow)"
  done
  if [ "$count" -gt 0 ]; then
    echo
    echo "### Issues"
    jq -r "$items" <<<"$results"
  fi
  echo
  echo "<sub>Commit ${HEAD_SHA:0:7}</sub>"
} > "$body_file"

gh pr comment "$PR_NUMBER" -R "$GITHUB_REPOSITORY" --body-file "$body_file"

if [ "$count" -gt 0 ]; then
  echo "::error::Reviewers found $count issue(s)"
  exit 1
fi
if [ "${#missing[@]}" -gt 0 ]; then
  echo "::error::No result from: ${missing[*]}"
  exit 1
fi
