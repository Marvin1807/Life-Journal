---
name: gedankenexperimente
description: Erstellt deutsche TikToks im Stil von @mentalist_xyz – verstörende Gedankenexperimente und dunkle Fakten (KI, Bewusstsein, Internet, Wahrnehmung) als flache 2D-Vektoranimation mit Sprecherstimme (Piper/Thorsten, offline) und Ein-Wort-Untertiteln, 9:16, gerendert mit HyperFrames. Verwenden, sobald der Nutzer in dieser Nische ein neues Video, Thema oder eine Änderung nennt.
---

# Gedankenexperimente – deutsche TikToks im @mentalist_xyz-Stil

**Alles auf Deutsch**, deutsche Bezüge statt US, alles im Code (Canvas 2D in HyperFrames), keine KI-Clips,
keine Stockbilder. Analyse der Vorbilder: `tiktok-videos/gedankenexperimente/REFERENZ_ANALYSE.md`,
Themen: `tiktok-videos/gedankenexperimente/THEMEN_RECHERCHE.md`. Vor jedem Video lesen, wenn nicht im Kontext.

## Unterschiede zu „Was wäre wenn“ (Skill `was-waere-wenn`)

| | Gedankenexperimente | Was wäre wenn |
|---|---|---|
| Format | **9:16** (Nutzer-Vorgabe; Referenz ist 16:9) | 9:16 |
| Look | flache 2D-Vektorgrafik, Violett + Spotlight-Vignette, Korn | Low-Poly-3D, POV |
| Ton | **Sprecherstimme** + leises dunkles Musikbett, Ducking | keine Stimme |
| Text | **ein Wort**, Großbuchstaben, Rubik Black, hart geschnitten | kursive Sätze, HUD, Titel |
| Ende | letzte Pointe, Schnitt auf Schwarz, **kein** Titel/HUD/Endkarte | Endkarte |

## Wo was liegt

```
tiktok-videos/hyperframes/
  lib/flat2d.js            2D-Baukasten: spotlight, finish (Vignette/Korn/Scanlines), person (Mensch↔Roboter),
                           avatar, headProfile, phone, hand, bubble, heart, star, clock, donut, caption, rng, ramp …
  lib/fonts/rubik-*.woff2  Untertitel-Schrift (OFL)
  tools/sprecher.py        sprecher.json → audio/voice.wav + words.json + words.js (Wortzeiten)
  tools/sounddesign.py     Cue-Typ "voice" (Sprecherspur, Musik wird darunter leiser: "duck")
  videos/internet-tot/     erstes Video und Vorlage (scene.js, sprecher.json, audio/ton.py)
```

## Einrichtung (einmal pro Cloud-Container)

HuggingFace ist gesperrt, GitHub-Releases nicht:
```bash
pip install sherpa-onnx soundfile
mkdir -p /opt/tts && cd /opt/tts
curl -sL https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-de_DE-thorsten-high.tar.bz2 | tar xj
curl -sL https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-small.tar.bz2 | tar xj   # nur für --pruefen
```

## Ablauf für ein neues Video

1. **Thema** aus THEMEN_RECHERCHE.md oder vom Nutzer. **Fakten per Websuche prüfen**, Quelle merken.
   Schätzungen im Text als „Schätzung“ sprechen („Europol zitierte eine Schätzung: …“).
2. **Sprechtext** (im Chat kurz zeigen, dann bauen) – 200–230 Wörter ≈ 75–85 s:
   - **Hook (≤ 7 s):** These in der Du-Form, „Was, wenn …?“ + Verschärfung („Und du der Letzte …?“).
   - **Einordnung:** „Klingt verrückt. Aber …“ – woher die Idee kommt (Theorie, Experiment, Forscher).
   - **Mechanismus:** kurze Sätze, jeder Satz ein Bild.
   - **Beleg (Mitte):** 1–3 echte Zahlen mit Quelle im Satz („So steht es im … der Firma …“).
   - **Steigerung:** „Das ist jetzt.“ / Bezug zum Zuschauer.
   - **Interaktion:** „Du glaubst mir nicht? Geh/Such/Pausier …“ (nur Dinge, die man wirklich prüfen kann).
   - **Schlussfrage** an den Zuschauer, optional trockene Pointe (Video 1: „Diese Stimme gehört auch keinem Menschen.“).
3. **Ordner:** `bash tools/neues-video.sh <id> internet-tot`, dann `sprecher.json` schreiben.
   - `say` = wie es klingen soll (Lautschrift für Englisch: „Botts“, „Dedd Internett“, „Bäd Bott Riport“),
     `show` = Untertitel mit **gleicher Wortzahl** (Bindestrich-Teile als eigene Wörter: „Dead- Internet- Theorie.“).
   - `python3 tools/sprecher.py videos/<id>/sprecher.json --pruefen` → Whisper-Rücktranskription lesen,
     falsch gesprochene Wörter in `say` umschreiben. Ziel 2,5–2,8 Wörter/s (`speed` 1.0–1.05).
   - Die TTS variiert minimal zwischen Läufen → **nie feste Sekunden** in scene.js/ton.py, immer
     `L(i)` (Satzbeginn), `LE(i)`, `find(i, "Wort")` aus words.js.
4. **Szene** (`scene.js`): ein Shot pro Satz bzw. alle 3–5 s, Liste `SHOTS`. Jeder Shot
   `{ at, cap: { color, y }, draw(g, t, lt, cap) }`; `cap()` zeichnet das Wort an dieser Ebene
   (danach Gezeichnetes darf es überdecken, wie in der Referenz). Schnitt = 0,16 s Überblendung mit leichtem Blitz.
5. **Ton:** `audio/ton.py` (liest words.json) → `sound.json` → `python3 ../../tools/sounddesign.py audio/sound.json audio/sound.wav`.
6. **Prüfen:** `npx -y hyperframes@0.8.154 lint` (0 Fehler), dann `snapshot --at …` (ein Bild pro Shot +
   Momente mit Ereignis), Kontaktbögen **ansehen**, mindestens zwei Korrekturrunden.
7. **Rendern:** `bash tools/render-und-komprimieren.sh <id> tiktok-videos/output 2600k` im Hintergrund
   (≈ 25–35 s Renderzeit pro Videosekunde, nie zwei Renders gleichzeitig). Frames ziehen, ansehen,
   mit SendUserFile schicken + Caption.
8. **Committen und pushen** (ohne renders/ und output/).

## Zeitraster (~80 s)

| Zeit | Teil | Bild |
|---|---|---|
| 0–5 | Hook (2 Fragen) | sofort ein starkes Symbol (Herzschlag wird flach, Maske spaltet sich) |
| 5–14 | Einordnung | Ursprung der Idee (Forum, Labor, Buch) |
| 14–28 | Mechanismus | Menschen ↔ Maschinen, Ursache-Wirkung |
| 28–50 | Belege | Zahlen groß im Bild (Balken, Donut, Raster), Quelle als Dokument |
| 50–63 | Steigerung | „Das ist jetzt“, Ruck/Einschlag |
| 63–70 | Interaktion | Hand mit Handy |
| 70–80 | Schlussfrage + Pointe | Musik fällt weg, nur Stimme + Herzschlag; Kopf-Silhouette; Schnitt auf Schwarz |

## Regeln (Nutzer-Vorgaben haben Vorrang)

- **Was der Sprecher sagt, sieht man im Bild** (Wort „liken“ → Herzen, „rund um die Uhr“ → Uhr rast,
  „Schätzung“ → Stempel). Zahlen erscheinen groß, wenn sie gesagt werden.
- **Kein Shot/Motiv doppelt.** Rückgriff nur als bewusste Wendung (Zurückzoomen enthüllt Marionettenfäden).
- **Ereignis spätestens nach ~7 s**, danach alle 3–5 s etwas Neues (neuer Shot oder sichtbares Ereignis).
- **Echte Zahlen nur mit Quelle**, Animationen dürfen keine falschen Zwischenwerte zeigen
  (Balken füllen sich von 0 auf den echten Wert, nicht von einem erfundenen Startwert).
- **Untertitel:** ein Wort, mittig oder ober-/unterhalb des Hauptmotivs (`cap.y`), Farbe pro Shot aus der Palette
  (Mint #bdf5c8, Creme #f6e7c8, Cyan #58e6ff), lange Wörter werden automatisch schmaler.
- **Look:** Hintergrund `spotlight()`, zum Schluss `finish()`; Figuren ohne Mund, Punktaugen; Licht/Glow nur akzentuiert.
- Deterministisch: kein `Math.random()`/`Date.now()`, nur `rng(seed)` und `t`.
- Keine NS-Symbole, keine realen Opfer als Effekt; Ernstes ernst erzählen. Keine Logos echter Firmen nachbauen
  (Quelle als neutrales Dokument mit Namen).

## Sound-Rezept

1. **Stimme** (`voice`, duck 0.45) – trägt alles.
2. **Musikbett** bis zum Schlussteil: Moll-`pad` (A-Moll 110/131/165 Hz, gain ~0.16) + `drone` 55/82 Hz,
   ab den Belegen zusätzlich hohes `pad` und langsam steigender `sub`.
3. **Schnitte:** `whoosh` (gain 0.22). **Ereignisse:** `beep` (Herzmonitor/Tippen), `impact` (Jahreszahl,
   „Das ist jetzt“ + `tinnitus`), `static` (Bots/Glitch), `ding` (Likes/Kommentare), `ticks` (Uhr),
   `riser` vor Höhepunkten, `chime`/`shimmer` für Erkenntnis/Pointe.
4. **Schlussteil (wie Referenz B):** Musik raus, nur `heartbeat` + Stimme, am Ende `chime`, dann `silence`.
   Lautheit ≈ −17 dB RMS (macht sounddesign.py).

## Caption-Vorlage

Erster Satz = Hook als Frage, ein Satz Kontext mit Quelle, Frage an die Community, 4–6 Hashtags:
`#gedankenexperiment #deadinternettheory #ki #psychologie #fakten #fürdich`
