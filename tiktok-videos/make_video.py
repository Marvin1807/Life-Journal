#!/usr/bin/env python3
"""Baut aus einem Drehbuch (JSON) ein fertiges TikTok-Video im 9:16-Format.

Ablauf pro Video:
  1. Sprecherstimme pro Szene erzeugen (edge-tts, deutsche Neural-Stimmen)
     inklusive Zeitstempel für jedes einzelne Wort.
  2. Pro Szene ein Bild/Clip aus assets/<video-id>/ nehmen. Fehlt es, wird ein
     Platzhalter erzeugt, auf dem steht, was dort hingehört.
  3. Untertitel Wort für Wort (TikTok-Stil), Titel oben, Zeitmarke pro Szene.
  4. Alles mit ffmpeg zusammensetzen, optional mit Hintergrundmusik.

Aufruf:
  python make_video.py drehbuecher/mond-verschwindet.json
  python make_video.py drehbuecher/*.json
  python make_video.py drehbuecher/x.json --offline   # ohne Internet: stumme Testversion
  python make_video.py drehbuecher/x.json --prompts   # nur KI-Bildprompts ausgeben
"""

from __future__ import annotations

import argparse
import asyncio
import json
import math
import shutil
import subprocess
import sys
import textwrap
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
W, H, FPS = 1080, 1920, 30
SCENE_GAP = 0.25  # Pause zwischen zwei Szenen in Sekunden
DEFAULT_VOICE = "de-DE-ConradNeural"
IMAGE_EXT = (".png", ".jpg", ".jpeg", ".webp")
VIDEO_EXT = (".mp4", ".mov", ".webm", ".mkv")

FONT_CANDIDATES = [
    ROOT / "assets" / "font.ttf",
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
    Path("C:/Windows/Fonts/arialbd.ttf"),
]


@dataclass
class Word:
    start: float
    end: float
    text: str


@dataclass
class Scene:
    index: int
    text: str
    visual: str
    label: str = ""
    audio: Path | None = None
    duration: float = 0.0
    words: list[Word] = field(default_factory=list)


def run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        sys.exit(f"ffmpeg-Fehler:\n{' '.join(cmd)}\n{result.stderr[-2000:]}")


def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


def font(size: int) -> ImageFont.FreeTypeFont:
    for candidate in FONT_CANDIDATES:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default(size)


def font_name() -> str:
    custom = ROOT / "assets" / "font.ttf"
    if custom.exists():
        return ImageFont.truetype(str(custom), 10).getname()[0]
    return "DejaVu Sans"


# --------------------------------------------------------------------------- #
# 1. Stimme
# --------------------------------------------------------------------------- #

async def tts_scene(scene: Scene, voice: str, rate: str, pitch: str, out: Path) -> None:
    import edge_tts

    communicate = edge_tts.Communicate(scene.text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    words: list[Word] = []
    with out.open("wb") as fh:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                fh.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 1e7
                words.append(Word(start, start + chunk["duration"] / 1e7, chunk["text"]))
    scene.audio = out
    scene.duration = probe_duration(out)
    scene.words = words


def offline_scene(scene: Scene, out: Path) -> None:
    """Stumme Tonspur mit geschätzter Sprechdauer, damit sich alles ohne Internet testen lässt."""
    tokens = scene.text.split()
    per_word = 0.36
    duration = len(tokens) * per_word + 0.3
    run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", f"{duration:.3f}",
         "-c:a", "libmp3lame", "-b:a", "48k", str(out)])
    scene.audio = out
    scene.duration = duration
    scene.words = [Word(i * per_word, (i + 1) * per_word, t) for i, t in enumerate(tokens)]


# --------------------------------------------------------------------------- #
# 2. Bild / Clip pro Szene
# --------------------------------------------------------------------------- #

def find_asset(asset_dir: Path, index: int) -> Path | None:
    for ext in VIDEO_EXT + IMAGE_EXT:
        for name in (f"{index:02d}{ext}", f"{index}{ext}"):
            if (asset_dir / name).exists():
                return asset_dir / name
    return None


def placeholder(scene: Scene, title: str, out: Path) -> Path:
    hue = (scene.index * 47) % 360
    img = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        r = int(10 + 40 * t + 30 * math.sin(math.radians(hue)))
        g = int(12 + 25 * t + 20 * math.sin(math.radians(hue + 120)))
        b = int(30 + 70 * t + 30 * math.sin(math.radians(hue + 240)))
        draw.line([(0, y), (W, y)], fill=(max(r, 0), max(g, 0), max(b, 0)))
    draw.text((W / 2, 720), f"SZENE {scene.index:02d}", font=font(90), fill="white", anchor="mm")
    draw.text((W / 2, 820), "Platzhalter – ersetze durch", font=font(40), fill=(200, 200, 220), anchor="mm")
    draw.text((W / 2, 870), f"assets/<id>/{scene.index:02d}.mp4 oder .png", font=font(40),
              fill=(200, 200, 220), anchor="mm")
    body = textwrap.fill(scene.visual, 38)
    draw.multiline_text((W / 2, 1040), body, font=font(36), fill=(170, 180, 210), anchor="mm",
                        align="center", spacing=10)
    img.save(out)
    return out


def scene_clip(scene: Scene, source: Path, duration: float, out: Path) -> None:
    frames = max(int(round(duration * FPS)), 1)
    if source.suffix.lower() in VIDEO_EXT:
        vf = (f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
              f"fps={FPS},setsar=1,format=yuv420p")
        cmd = ["ffmpeg", "-y", "-stream_loop", "-1", "-i", str(source), "-t", f"{duration:.3f}",
               "-vf", vf, "-an"]
    else:
        # Bild auf 9:16 zuschneiden, dann langsamer Zoom (Ken-Burns), wie bei Slideshow-Shorts üblich.
        fitted = out.with_suffix(".fit.png")
        ImageOps.fit(Image.open(source).convert("RGB"), (W, H), Image.LANCZOS).save(fitted)
        zoom_in = scene.index % 2 == 1
        z = "min(1+0.12*on/{n},1.12)" if zoom_in else "max(1.12-0.12*on/{n},1)"
        vf = (f"scale={W * 2}:{H * 2},zoompan=z='{z.format(n=frames)}':d={frames}"
              f":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS},setsar=1,format=yuv420p")
        cmd = ["ffmpeg", "-y", "-loop", "1", "-i", str(fitted), "-frames:v", str(frames), "-vf", vf]
    run(cmd + ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", str(out)])


# --------------------------------------------------------------------------- #
# 3. Untertitel (ASS)
# --------------------------------------------------------------------------- #

def ass_time(t: float) -> str:
    t = max(t, 0)
    h, rem = divmod(t, 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def ass_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("{", "(").replace("}", ")").replace("\n", "\\N")


def build_ass(title: str, scenes: list[Scene], starts: list[float], total: float, style: dict) -> str:
    fn = font_name()
    highlight = style.get("highlight", "&H0000E5FF")  # ASS: &HAABBGGRR -> Gelb
    words_per_line = int(style.get("words_per_caption", 3))
    lines = [
        "[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "WrapStyle: 0", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, "
        "Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, "
        "Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        f"Style: Caption,{fn},92,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,7,3,2,60,60,560,1",
        f"Style: Title,{fn},64,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,-1,0,0,0,100,100,0,0,3,18,0,8,70,70,170,1",
        f"Style: Label,{fn},120,&H0000E5FF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,2,0,1,8,4,8,60,60,430,1",
        "", "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    if title:
        lines.append(f"Dialogue: 2,{ass_time(0)},{ass_time(total)},Title,,0,0,0,,{ass_escape(title)}")

    for scene, start in zip(scenes, starts):
        if scene.label:
            lines.append(
                f"Dialogue: 1,{ass_time(start)},{ass_time(start + scene.duration)},Label,,0,0,0,,"
                f"{{\\fad(150,150)}}{ass_escape(scene.label)}"
            )
        # Wörter zu kurzen Häppchen gruppieren, aktuelles Wort farbig hervorheben.
        groups = [scene.words[i:i + words_per_line] for i in range(0, len(scene.words), words_per_line)]
        for g_idx, group in enumerate(groups):
            next_start = groups[g_idx + 1][0].start if g_idx + 1 < len(groups) else scene.duration
            for w_idx, word in enumerate(group):
                w_start = start + word.start
                w_end = start + (group[w_idx + 1].start if w_idx + 1 < len(group) else next_start)
                parts = []
                for j, other in enumerate(group):
                    text = ass_escape(other.text.upper())
                    parts.append(f"{{\\c{highlight}}}{text}{{\\c&H00FFFFFF}}" if j == w_idx else text)
                pop = "{\\fscx108\\fscy108\\t(0,90,\\fscx100\\fscy100)}" if w_idx == 0 else ""
                lines.append(
                    f"Dialogue: 0,{ass_time(w_start)},{ass_time(w_end)},Caption,,0,0,0,,{pop}{' '.join(parts)}"
                )
    return "\n".join(lines) + "\n"


# --------------------------------------------------------------------------- #
# 4. Zusammenbauen
# --------------------------------------------------------------------------- #

def build(script_path: Path, offline: bool, keep_temp: bool) -> Path:
    data = json.loads(script_path.read_text(encoding="utf-8"))
    vid = data["id"]
    title = data.get("title", "")
    voice = data.get("voice", DEFAULT_VOICE)
    rate = data.get("rate", "+0%")
    pitch = data.get("pitch", "+0Hz")
    style = data.get("style", {})

    work = ROOT / "build" / vid
    if work.exists():
        shutil.rmtree(work)
    work.mkdir(parents=True)
    asset_dir = ROOT / "assets" / vid
    out_dir = ROOT / "output"
    out_dir.mkdir(exist_ok=True)

    scenes = [
        Scene(i + 1, s["text"], s.get("visual", ""), s.get("label", ""))
        for i, s in enumerate(data["scenes"])
    ]

    print(f"▶ {vid}: {len(scenes)} Szenen")
    for scene in scenes:
        audio = work / f"voice_{scene.index:02d}.mp3"
        if offline:
            offline_scene(scene, audio)
        else:
            asyncio.run(tts_scene(scene, voice, rate, pitch, audio))
        print(f"  Stimme Szene {scene.index:02d}: {scene.duration:.1f}s")

    # Zeitachse: jede Szene so lang wie ihr Sprechtext plus kurze Pause.
    starts, t = [], 0.0
    for scene in scenes:
        starts.append(t)
        scene.duration += SCENE_GAP
        t += scene.duration
    total = t + float(data.get("outro_seconds", 0.6))
    scenes[-1].duration += total - t

    # Bilder/Clips
    clips = []
    for scene in scenes:
        source = find_asset(asset_dir, scene.index)
        if source is None:
            source = placeholder(scene, title, work / f"placeholder_{scene.index:02d}.png")
            print(f"  Szene {scene.index:02d}: Platzhalter (kein Asset in {asset_dir.relative_to(ROOT)})")
        clip = work / f"clip_{scene.index:02d}.mp4"
        scene_clip(scene, source, scene.duration, clip)
        clips.append(clip)

    concat_list = work / "clips.txt"
    concat_list.write_text("".join(f"file '{c.name}'\n" for c in clips))
    base = work / "base.mp4"
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list), "-c", "copy", str(base)])

    # Sprachspur: Szenen mit Pausen aneinanderhängen
    voice_inputs, filters = [], []
    for i, (scene, start) in enumerate(zip(scenes, starts)):
        voice_inputs += ["-i", str(scene.audio)]
        ms = int(start * 1000)
        filters.append(f"[{i}:a]aresample=48000,adelay={ms}|{ms}[a{i}]")
    mix = "".join(f"[a{i}]" for i in range(len(scenes)))
    filters.append(f"{mix}amix=inputs={len(scenes)}:normalize=0,apad,atrim=0:{total:.3f}[voice]")
    voice_track = work / "voice.m4a"
    run(["ffmpeg", "-y", *voice_inputs, "-filter_complex", ";".join(filters), "-map", "[voice]",
         "-c:a", "aac", "-b:a", "192k", str(voice_track)])

    ass = work / "captions.ass"
    ass.write_text(build_ass(title, scenes, starts, total, style), encoding="utf-8")

    music = data.get("music") or "assets/music.mp3"
    music_path = (ROOT / music) if not Path(music).is_absolute() else Path(music)
    out = out_dir / f"{vid}.mp4"
    # Relative Pfade, weil der subtitles-Filter mit "C:\\..." unter Windows nicht klarkommt.
    sub_filter = f"subtitles=filename={ass.name}:fontsdir=../../assets"
    cmd = ["ffmpeg", "-y", "-i", base.name, "-i", voice_track.name]
    if music_path.exists():
        vol = float(data.get("music_volume", 0.18))
        # Musik leiser drehen, sobald gesprochen wird (Ducking).
        cmd += ["-stream_loop", "-1", "-i", str(music_path), "-filter_complex",
                f"[0:v]{sub_filter}[v];[2:a]volume={vol},aresample=48000[m];"
                f"[m][1:a]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[duck];"
                f"[duck][1:a]amix=inputs=2:normalize=0,atrim=0:{total:.3f}[a]",
                "-map", "[v]", "-map", "[a]"]
    else:
        cmd += ["-vf", sub_filter, "-map", "0:v", "-map", "1:a"]
    cmd += ["-t", f"{total:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out.resolve())]
    result = subprocess.run(cmd, cwd=work, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        sys.exit(f"ffmpeg-Fehler beim Endschnitt:\n{result.stderr[-2000:]}")

    caption = data.get("caption", "")
    (out_dir / f"{vid}.txt").write_text(caption + "\n", encoding="utf-8")
    if not keep_temp:
        shutil.rmtree(work)
    print(f"✔ {out.relative_to(ROOT)} ({total:.1f}s)")
    return out


def print_prompts(script_path: Path) -> None:
    data = json.loads(script_path.read_text(encoding="utf-8"))
    style = data.get("visual_style", "")
    print(f"# {data['id']} – {data.get('title', '')}")
    print(f"# Dateien ablegen unter: assets/{data['id']}/01.mp4, 02.mp4, …\n")
    for i, scene in enumerate(data["scenes"], 1):
        print(f"{i:02d}: {scene.get('visual', '')}{', ' + style if style else ''}\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Deutsche 'Was wäre wenn'-TikToks aus Drehbüchern bauen.")
    parser.add_argument("scripts", nargs="+", type=Path, help="Drehbuch-JSON-Dateien")
    parser.add_argument("--offline", action="store_true", help="ohne Stimme (stumm), zum Testen")
    parser.add_argument("--prompts", action="store_true", help="nur die Bild-/Video-Prompts ausgeben")
    parser.add_argument("--keep-temp", action="store_true", help="Zwischendateien in build/ behalten")
    args = parser.parse_args()

    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg fehlt. Installation: https://ffmpeg.org/download.html")
    for path in args.scripts:
        if args.prompts:
            print_prompts(path)
        else:
            build(path, args.offline, args.keep_temp)


if __name__ == "__main__":
    main()
