#!/usr/bin/env bash
#
# Validates that a commit message follows Conventional Commits:
#   <type>: <description>
#
# Allowed types: feat, fix, refactor, docs, test, chore, perf, ci, build, style, revert

COMMIT_MSG_FILE="$1"
COMMIT_MSG=$(head -1 "$COMMIT_MSG_FILE")

PATTERN="^(feat|fix|refactor|docs|test|chore|perf|ci|build|style|revert)(\(.+\))?: .+"

if [[ ! "$COMMIT_MSG" =~ $PATTERN ]]; then
  echo ""
  echo "ERROR: Invalid commit message format."
  echo ""
  echo "  Got: \"$COMMIT_MSG\""
  echo ""
  echo "  Expected: <type>: <description>"
  echo "  Optional: <type>(scope): <description>"
  echo ""
  echo "  Allowed types:"
  echo "    feat, fix, refactor, docs, test, chore,"
  echo "    perf, ci, build, style, revert"
  echo ""
  echo "  Examples:"
  echo "    feat: add account deletion"
  echo "    fix(wallet): correct balance calculation"
  echo "    refactor: extract shared types"
  echo ""
  exit 1
fi
