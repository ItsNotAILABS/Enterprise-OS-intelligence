#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# build-release.sh — Local release package builder
#
# Usage:
#   ./releases/build-release.sh [version]
#
# Builds zip archives for all publishable SDKs and generates CHECKSUMS.sha256.
# Output goes to dist/packages/
#
# This mirrors what the release-packages.yml GitHub Action does, so you can
# test locally before pushing a release tag.
#
# VIVIT · MEMINIT · GUBERNAT
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

VERSION="${1:-$(node -p "require('./sdk/effecttrace-governance-organism/package.json').version")}"
echo "Building release packages v${VERSION}"
echo "─────────────────────────────────────────"

rm -rf dist/packages
mkdir -p dist/packages

PACKAGES=(
  "sdk/effecttrace-governance-organism"
  "sdk/student-ai"
  "sdk/analyst-ai"
  "sdk/paralegal-ai"
  "sdk/worker-ai"
  "sdk/builder-ai"
  "sdk/tool-ai"
  "sdk/organism-ai"
  "sdk/birth-ai"
  "sdk/meridian-sovereign-os"
  "sdk/silver-canister"
  "sdk/bronze-canister"
  "sdk/gold-canister"
  "sdk/enterprise-integration-sdk"
  "sdk/sovereign-memory-sdk"
  "sdk/intelligence-routing-sdk"
  "sdk/organism-runtime-sdk"
  "sdk/document-absorption-engine"
  "sdk/sovereign-protocol-sdk"
  "sdk/blockchain-operations-engine"
  "sdk/backend-orchestration-engine"
  "sdk/edge-coordination-engine"
  "sdk/agent-runtime-mesh-sdk"
  "sdk/virtual-chip-packager"
)

BUILT=0
for pkg_dir in "${PACKAGES[@]}"; do
  if [ -d "$pkg_dir" ] && [ -f "$pkg_dir/package.json" ]; then
    PKG_NAME=$(node -p "require('./$pkg_dir/package.json').name" 2>/dev/null || echo "")
    PKG_VERSION=$(node -p "require('./$pkg_dir/package.json').version" 2>/dev/null || echo "")

    if [ -n "$PKG_NAME" ]; then
      CLEAN_NAME=$(echo "$PKG_NAME" | sed 's/@medina\///' | sed 's/\//-/g')
      ZIP_NAME="${CLEAN_NAME}-v${PKG_VERSION}.zip"

      echo "  📦 $PKG_NAME@$PKG_VERSION -> $ZIP_NAME"
      (cd "$pkg_dir" && zip -qr "../../dist/packages/$ZIP_NAME" . -x '*/node_modules/*' -x '*/.git/*')
      BUILT=$((BUILT + 1))
    fi
  fi
done

# Package production apps
if [ -d "production-apps" ]; then
  ZIP_NAME="production-apps-v${VERSION}.zip"
  echo "  📦 production-apps -> $ZIP_NAME"
  (cd production-apps && zip -qr "../dist/packages/$ZIP_NAME" . -x '*/node_modules/*')
  BUILT=$((BUILT + 1))
fi

# Generate checksums
(cd dist/packages && sha256sum *.zip > CHECKSUMS.sha256)

echo ""
echo "─────────────────────────────────────────"
echo "✅ Built $BUILT packages in dist/packages/"
echo ""
echo "To create a release, push a tag:"
echo "  git tag release-v${VERSION}"
echo "  git push origin release-v${VERSION}"
echo ""
echo "Or trigger manually via GitHub Actions workflow_dispatch."
