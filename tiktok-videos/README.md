# Deutsche „Was wäre wenn“-TikToks

Ein Werkzeug, das aus einem kurzen Drehbuch ein fertiges TikTok (1080×1920)
baut: deutsche Erzählerstimme, Wort-für-Wort-Untertitel, große Zeitmarken
pro Szene, Titel oben, Hintergrundmusik mit automatischem Leiserdrehen.
Format und Aufbau sind den Simulations-Accounts wie
[@whatifworld99](https://www.tiktok.com/@whatifworld99) nachempfunden – die
Analyse steht in [ANALYSE.md](ANALYSE.md).

Fünf fertige deutsche Drehbücher liegen in `drehbuecher/`:

| Datei | Titel |
|---|---|
| `asteroid-nordsee.json` | Was wäre, wenn ein Asteroid in die Nordsee stürzt? |
| `mond-verschwindet.json` | Was wäre, wenn der Mond verschwindet? |
| `sonne-verschwindet.json` | Was wäre, wenn die Sonne verschwindet? |
| `erde-stoppt.json` | Was wäre, wenn die Erde aufhört, sich zu drehen? |
| `menschen-verschwinden.json` | Was wäre, wenn alle Menschen verschwinden? |

## Einrichten (einmalig)

1. **Python 3.10+** und **ffmpeg** installieren
   - Mac: `brew install python ffmpeg`
   - Windows: `winget install Python.Python.3.12 Gyan.FFmpeg`
2. Im Ordner `tiktok-videos`:
   ```bash
   python -m venv .venv
   source .venv/bin/activate        # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

## Ein Video bauen – 4 Schritte

**1. Bild-Prompts holen**
```bash
python make_video.py drehbuecher/asteroid-nordsee.json --prompts
```
Gibt pro Szene einen englischen Prompt aus.

**2. Clips erzeugen** – jeden Prompt in einen KI-Video-Generator geben
(z. B. Kling, Google Veo, Runway, Hailuo, Sora; Format 9:16, 5 s) und die
Ergebnisse so ablegen:
```
assets/asteroid-nordsee/01.mp4
assets/asteroid-nordsee/02.mp4
…
```
Standbilder (`01.png`, `02.jpg`) gehen auch, die bekommen automatisch einen
langsamen Zoom. Kürzere Clips werden geloopt, längere abgeschnitten. Fehlt
eine Datei, erscheint ein Platzhalter mit dem Prompt – praktisch zum Testen.

**3. Musik (optional)** – eine lizenzfreie epische Spur als
`assets/music.mp3` ablegen (oder pro Drehbuch `"music": "assets/xyz.mp3"`).
Sie wird unter die Stimme gelegt und beim Sprechen leiser gedreht. Tipp: In
der TikTok-App lieber einen trendenden Sound dazunehmen und die Musik hier
weglassen.

**4. Rendern**
```bash
python make_video.py drehbuecher/asteroid-nordsee.json
python make_video.py drehbuecher/*.json          # alle auf einmal
```
Ergebnis: `output/asteroid-nordsee.mp4` plus `output/asteroid-nordsee.txt`
mit der fertigen Caption und den Hashtags.

`--offline` baut eine stumme Testversion ohne Internet, `--keep-temp` lässt
die Zwischendateien in `build/` liegen.

## Neue Videos

Vorlage in [NEUES_DREHBUCH.md](NEUES_DREHBUCH.md) in Claude kopieren, Thema
einsetzen, JSON als `drehbuecher/<id>.json` speichern, fertig. Ein Thema pro
Tag ist ein guter Rhythmus.

## Anpassen

Im Drehbuch:

| Feld | Bedeutung |
|---|---|
| `voice` | Stimme. Gut: `de-DE-ConradNeural` (tief, Erzähler), `de-DE-KillianNeural`, `de-DE-FlorianMultilingualNeural`, `de-DE-SeraphinaMultilingualNeural` (weiblich) |
| `rate` / `pitch` | Tempo (`+10%`) und Tonhöhe (`-5Hz`) |
| `style.words_per_caption` | Wörter pro Untertitel-Einblendung (Standard 3) |
| `style.highlight` | Farbe des aktuellen Worts, ASS-Format `&H00BBGGRR` (Standard Gelb) |
| `music`, `music_volume` | Musikdatei und Lautstärke (Standard 0.18) |
| `outro_seconds` | Stille am Ende (Standard 0.6) |

Eigene Schrift: als `assets/font.ttf` ablegen (z. B. Montserrat ExtraBold
von Google Fonts – sieht am meisten nach TikTok aus).

Die Stimme läuft über `edge-tts` (kostenlos, braucht Internet). Für eine
noch natürlichere Stimme lässt sich ElevenLabs anbinden – sag Bescheid.

## Vor dem Posten

- In TikTok das Label **„KI-generierter Inhalt“** setzen, wenn die Clips aus
  einem KI-Generator kommen (Pflicht laut TikTok-Richtlinien).
- Caption aus der `.txt` übernehmen; der Hinweis „Nur eine Simulation“ ist
  schon drin.
- Keine fremden Videos oder Ausschnitte der Vorbild-Accounts verwenden – nur
  Format und Idee übernehmen.

## HyperFrames: Videos im @man_ia_c-Stil (Hauptformat)

Die eigentlichen Videos entstehen komplett im Code: Low-Poly-3D mit Three.js,
gerendert von [HyperFrames](https://github.com/heygen-com/hyperframes), ohne
Sprecherstimme. Format und Look sind in
[REFERENZ_ANALYSE.md](REFERENZ_ANALYSE.md) beschrieben. Der Claude-Skill
`was-waere-wenn` (`.claude/skills/was-waere-wenn/SKILL.md`) enthält den
kompletten Ablauf; in Claude Code reicht: „Mach ein Video: Was wäre, wenn …?“

```
hyperframes/
  lib/                 gemeinsamer Baukasten (3D, Overlay, Schriften, Three.js, GSAP)
  tools/               sounddesign.py, neues-video.sh
  videos/<id>/         ein HyperFrames-Projekt pro Video
  renders/             fertige MP4s (nicht im Git)
```

Ein Video selbst rendern (Node.js 22+ und ffmpeg nötig):

```bash
cd hyperframes/videos/niemand-arbeitet
npx -y hyperframes@0.8.154 preview      # Vorschau im Browser
npx -y hyperframes@0.8.154 render -o ../../renders/niemand-arbeitet.mp4
```

Neues Video anlegen: `bash hyperframes/tools/neues-video.sh <id>`.

Das Claude-Code-Plugin `hyperframes@hyperframes` ist für dieses Repo aktiviert
(`.claude/settings.json`). In der Claude-Cloud vor HyperFrames-Befehlen:
`export HYPERFRAMES_BROWSER_PATH=$(find /opt/pw-browsers -name chrome-headless-shell -type f | head -1)`.
