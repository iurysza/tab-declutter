#!/bin/bash
# Regenerates every icon and store image from the sources in this folder.
# Needs rsvg-convert, sips (macOS) and Google Chrome.
set -euo pipefail
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$(dirname "$0")"

# Toolbar icons use the full-bleed mark. The 128px icon uses the padded store variant.
for size in 16 32 48; do
  rsvg-convert -w "$size" -h "$size" icon-src.svg -o "${ROOT}/public/icons/icon-${size}.png"
done
rsvg-convert -w 128 -h 128 icon-store-src.svg -o "${ROOT}/public/icons/icon-128.png"
cp "${ROOT}/public/icons/icon-128.png" icon-128.png

# Screenshots reuse the real popup CSS, brand mark and lens copy from src/.
(cd "$ROOT" && bun store-assets/extract-real.tsx)
shoot() { # $1 scene time, $2 output
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --force-device-scale-factor=1 --window-size=1920,1200 --blink-settings=preferredColorScheme=0 \
    --screenshot="$2" "file://${PWD}/screenshot-src.html?t=$1" 2>/dev/null
  sips -z 800 1280 "$2" >/dev/null
}
shoot 10.6 screenshot-1280x800.png
shoot 13.3 screenshot-lenses-1280x800.png
rm -f real.js

"$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --force-device-scale-factor=1 --window-size=440,280 \
  --screenshot=promo-tile-440x280.png "file://${PWD}/tile-src.html" 2>/dev/null

file icon-128.png screenshot-*.png promo-tile-440x280.png
