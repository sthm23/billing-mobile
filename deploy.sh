#!/bin/bash
# Expo web release switch. NOT run from the server checkout: the GitHub workflow builds
# `dist/` (the server is too slow for Metro), uploads it as $ARCHIVE and pipes this file
# into `ssh ... bash -s`, so the server always runs the version from the deployed commit.
set -euo pipefail

APP_DIR=/var/www/billing-mobile
ARCHIVE="$APP_DIR/release.tgz"
DIST=dist            # nginx serves $APP_DIR/dist
NEXT=dist-next       # new build is unpacked here first
PREV=dist-prev       # previous build, kept for quick rollback

echo "🚀 Deploying Expo web..."

cd "$APP_DIR"

if [[ ! -f "$ARCHIVE" ]]; then
  echo "❌ $ARCHIVE not found" >&2
  exit 1
fi

echo "📦 Unpacking build..."
rm -rf "$NEXT"
mkdir "$NEXT"
tar -xzf "$ARCHIVE" -C "$NEXT"
rm -f "$ARCHIVE"

if [[ ! -f "$NEXT/index.html" ]]; then
  echo "❌ Build is missing index.html" >&2
  rm -rf "$NEXT"
  exit 1
fi

echo "🔁 Switching to the new build..."
rm -rf "$PREV"
if [[ -d "$DIST" ]]; then
  mv "$DIST" "$PREV"
fi
mv "$NEXT" "$DIST"

echo "✅ Expo web deployment complete!"
echo "🌐 Visit: https://sthm23.uz"
echo "↩️  Rollback: cd $APP_DIR && mv $DIST $NEXT && mv $PREV $DIST"
