#!/bin/bash

set -e

git fetch --tags
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
VERSION=${LATEST_TAG#v}
IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"

BRANCH=${GITHUB_REF#refs/heads/}
RUN_NUMBER=${GITHUB_RUN_NUMBER}
IS_PR=false

if [[ "$GITHUB_EVENT_NAME" == "pull_request" ]]; then
  IS_PR=true
fi

SUFFIX=""
if [[ "$BRANCH" == feature/* ]]; then
  ((MINOR+=1))
  PATCH=0
  if $IS_PR; then
    SUFFIX="-alpha.$RUN_NUMBER"
  fi
elif [[ "$BRANCH" == hotfix/* ]]; then
  ((PATCH+=1))
  if $IS_PR; then
    SUFFIX="-hotfix.$RUN_NUMBER"
  fi
elif [[ "$BRANCH" == release/* ]]; then
  ((MINOR+=1))
  PATCH=0
elif [[ "$BRANCH" == main ]]; then
  ((PATCH+=1))
fi

FINAL_VERSION="v${MAJOR}.${MINOR}.${PATCH}${SUFFIX}"

# ✅ Export as GitHub Actions env variable
echo "VERSION=$FINAL_VERSION" >> $GITHUB_ENV
echo "version=$FINAL_VERSION" >> $GITHUB_OUTPUT

echo "✅ Injected VERSION=$FINAL_VERSION"