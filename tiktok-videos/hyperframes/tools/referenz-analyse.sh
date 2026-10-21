#!/usr/bin/env bash
# Zerlegt ein Referenzvideo für die Analyse: Kacheln (1 Bild/s mit Zeitstempel), Untertitel-Ausschnitte, Spektrogramm, Lautheit.
#   bash tools/referenz-analyse.sh <video.mp4> <ausgabeordner>
set -euo pipefail
f=$1; o=$2; mkdir -p "$o"
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f"); n=$(python3 -c "import math;print(math.ceil($d/30))")
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height -of compact "$f"
ffmpeg -y -loglevel error -i "$f" -vf "fps=1,scale=320:-1,drawtext=text='%{pts\:hms}':x=5:y=5:fontsize=16:fontcolor=yellow,tile=6x5" -frames:v "$n" "$o/kacheln%d.png"
ffmpeg -y -loglevel error -i "$f" -lavfi "showspectrumpic=s=1400x300:legend=0:scale=log" "$o/spektrogramm.png"
ffmpeg -i "$f" -af "astats=metadata=1:reset=30,ametadata=print:key=lavfi.astats.Overall.RMS_level" -f null - 2>&1 | grep RMS_level | awk -F= 'NR%30==0{printf "%.0f ", $2}' > "$o/lautheit-pro-sekunde.txt"
ls "$o"
