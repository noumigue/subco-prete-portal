#!/usr/bin/env bash

set -euo pipefail

branch="${1:-dev-pilotes}"

if ! command -v git >/dev/null 2>&1; then
  echo "git not found"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash changes before publishing."
  exit 1
fi

git fetch --all --prune

current_branch="$(git branch --show-current)"

if [[ "$current_branch" != "$branch" ]]; then
  git checkout "$branch"
fi

git checkout main
git merge --no-ff --no-edit "$branch"
git push origin main
git checkout "$branch"

