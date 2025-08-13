#!/bin/bash

set -e

git fetch --tags
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
VERSION=${LATEST_TAG#v}
IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"

# Resolve branch name robustly for both push and PR runs
RUN_NUMBER=${GITHUB_RUN_NUMBER}
if [[ -n "${GITHUB_HEAD_REF:-}" ]]; then
  BRANCH="$GITHUB_HEAD_REF"            # PR source branch
else
  BRANCH="${GITHUB_REF_NAME:-${GITHUB_REF#refs/heads/}}"  # push branch or fallback
fi

# Bump rules and suffix policy
SUFFIX=""
case "$BRANCH" in
  feature/*)
    ((MINOR+=1))
    PATCH=0
    SUFFIX="-alpha.$RUN_NUMBER"
    ;;
  hotfix/*)
    ((PATCH+=1))
    SUFFIX="-hotfix.$RUN_NUMBER"
    ;;
  release/*)
    ((MINOR+=1))
    PATCH=0
    ;;
  master)
    ((PATCH+=1))
    ;;
esac

FINAL_VERSION="v${MAJOR}.${MINOR}.${PATCH}${SUFFIX}"

# Export as GitHub Actions env variable
echo "VERSION=$FINAL_VERSION" >> "$GITHUB_ENV"
echo "version=$FINAL_VERSION" >> "$GITHUB_OUTPUT"

echo "✅ Injected VERSION=$FINAL_VERSION on branch $BRANCH"