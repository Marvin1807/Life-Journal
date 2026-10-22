#!/usr/bin/env bash
# Legt einen neuen Videoordner aus einer Vorlage an.
#   bash tools/neues-video.sh <id> [vorlage]
# Beispiel: bash tools/neues-video.sh schwerkraft-aus niemand-arbeitet
set -euo pipefail

cd "$(dirname "$0")/.."
id="${1:?Bitte eine ID angeben, z. B. schwerkraft-aus}"
template="${2:-niemand-arbeitet}"

[[ -d "videos/$template" ]] || { echo "Vorlage videos/$template fehlt"; exit 1; }
[[ ! -e "videos/$id" ]] || { echo "videos/$id existiert schon"; exit 1; }

mkdir -p "videos/$id/audio"
cp "videos/$template/index.html" "videos/$template/hyperframes.json" "videos/$template/package.json" \
   "videos/$template/.gitignore" "videos/$id/"
cp "videos/$template/audio/sound.json" "videos/$id/audio/"
[[ -f "videos/$template/scene.js" ]] && cp "videos/$template/scene.js" "videos/$id/"
# Sprecher-Videos (Gedankenexperimente): Sprechtext und Ton-Generator mitnehmen
[[ -f "videos/$template/sprecher.json" ]] && cp "videos/$template/sprecher.json" "videos/$id/"
[[ -f "videos/$template/audio/ton.py" ]] && cp "videos/$template/audio/ton.py" "videos/$id/audio/"
ln -s ../../lib "videos/$id/lib"
printf '{ "id": "%s", "name": "%s" }\n' "$id" "$id" > "videos/$id/meta.json"
sed -i "s/\"name\": \"$template\"/\"name\": \"$id\"/" "videos/$id/package.json"
sed -i "s/$template/$id/g" "videos/$id/index.html"
[[ -f "videos/$id/scene.js" ]] && sed -i "s/$template/$id/g" "videos/$id/scene.js"

echo "✔ videos/$id angelegt (Kopie von $template)."
echo "  Nächste Schritte: index.html anpassen, audio/sound.json anpassen, dann"
echo "  python3 tools/sounddesign.py videos/$id/audio/sound.json videos/$id/audio/sound.wav"
