#!/usr/bin/env bash
# Rendert videos/<id> und komprimiert es per 2-Pass auf < 30 MB (zum Verschicken im Chat).
#   bash tools/render-und-komprimieren.sh <id> <ausgabeordner> [video-bitrate, Standard 2900k; ab 85 s Länge 2400k nehmen]
set -euo pipefail
id=$1; out=$2; br=${3:-2900k}
HF="$(cd "$(dirname "$0")/.." && pwd)"
export HYPERFRAMES_BROWSER_PATH="${HYPERFRAMES_BROWSER_PATH:-$(find /opt/pw-browsers -name chrome-headless-shell -type f 2>/dev/null | head -1)}"
cd "$HF/videos/$id"
npx -y hyperframes@0.8.154 render -o "../../renders/$id.mp4" --quiet 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -iE "error|fail" | tail -3 || true
mkdir -p "$out"; tmp=$(mktemp -d); cd "$tmp"
ffmpeg -y -loglevel error -i "$HF/renders/$id.mp4" -c:v libx264 -preset medium -b:v "$br" -pass 1 -an -f mp4 /dev/null
ffmpeg -y -loglevel error -i "$HF/renders/$id.mp4" -c:v libx264 -preset medium -b:v "$br" -pass 2 -c:a aac -b:a 160k -movflags +faststart "$out/$id.mp4"
rm -rf "$tmp"
ls -la "$out/$id.mp4"; ffprobe -v error -show_entries format=duration -of csv=p=0 "$out/$id.mp4"
