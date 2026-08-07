#!/bin/bash
set -e
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$(dirname "$0")"

# Padded 128x128 store icon (source in store-assets, copy to public/icons)
rsvg-convert -w 128 -h 128 icon-src.svg -o "${ROOT}/public/icons/icon-128.png"
rsvg-convert -w 128 -h 128 icon-src.svg -o icon-128.png

# 1280x800 product screenshot
"$CHROME" --headless --disable-gpu --force-device-scale-factor=1 --window-size=1280,800 --screenshot=screenshot-1280x800.png "file://${PWD}/screenshot-src.html"

# 440x280 promotional tile
"$CHROME" --headless --disable-gpu --force-device-scale-factor=1 --window-size=440,280 --screenshot=promo-tile-440x280.png "file://${PWD}/tile-src.html"

echo "Generated store assets:"
file icon-128.png
file screenshot-1280x800.png
file promo-tile-440x280.png
