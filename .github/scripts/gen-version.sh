#!/bin/bash

set -e

# Get base Git tag
git fetch --tags
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
VERSION=${LATEST_TAG#v}
IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"

# Get GitHub context
BRANCH=${GITHUB_REF#refs/heads/}
RUN_NUMBER=${GITHUB_RUN_NUMBER}
IS_PR=false

if [[ "$GITHUB_EVENT_NAME" == "pull_request" ]]; then
  IS_PR=true
fi

# Bump rules
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

# Output
echo "VERSION=$FINAL_VERSION" >> $GITHUB_ENV
echo "version=$FINAL_VERSION" >> $GITHUB_OUTPUT

# Inject into source
echo "export const VERSION = '$FINAL_VERSION';" > src/version.ts

echo "✅ Generated version: $FINAL_VERSION"