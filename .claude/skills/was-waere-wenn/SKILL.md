---
name: was-waere-wenn
description: Erstellt deutsche "Was wäre, wenn …?"-TikToks im Stil von @man_ia_c – Low-Poly-3D in Three.js, gerendert mit HyperFrames, ohne Sprecherstimme, mit Countdown-HUD, kursiven Untertiteln und Endkarte. Verwenden, sobald der Nutzer ein neues Video, ein Thema, ein Szenario oder eine Änderung an einem seiner Videos nennt.
---

# Was wäre wenn – deutsche TikToks im @man_ia_c-Stil

Dieser Chat produziert die TikToks des Nutzers. **Alle Videos sind auf Deutsch**:
Titel, HUD, Untertitel, Endkarte, Zahlenformat (`0:04,951`, `1.234 t`, Meter/Kilometer),
Orte (Berlin, Hamburg, München, Köln, Alpen, Nordsee …). Kein englischer Text im Bild.

Alles entsteht **im Code mit HyperFrames + Three.js**. Keine KI-Videoclips, keine Stockfotos.
Die genaue Analyse der Vorbilder steht in `tiktok-videos/REFERENZ_ANALYSE.md`. Lies sie vor
jedem neuen Video, wenn sie nicht schon im Kontext ist.

## Wo was liegt

```
tiktok-videos/hyperframes/
  lib/                     gemeinsamer Baukasten (nicht pro Video kopieren)
    lowpoly.js             Häuser, Menschen (instanziert), Autos/Bus, Fernsehturm, Lampen,
                           Himmel, Sterne, Kamerapfad, Farb-Keyframes, seeded rng()
    ww-overlay.js          Titel, HUD (Label/Wert/Unterzeile), Untertitel, Schwarzbild, Endkarte
    ww.css                 Look der Texte (Maße aus den Referenzen)
    fonts/                 EB Garamond (Serif/Kursiv), Inter (HUD), JetBrains Mono (Endkarte)
    three.module.min.js, three.core.min.js, gsap.min.js   lokal, weil CDNs gesperrt sein können
  tools/sounddesign.py     synthetisches Sounddesign aus einer Cue-Liste (JSON → WAV)
  tools/neues-video.sh     legt einen neuen Videoordner aus einer Vorlage an
  videos/<id>/             ein HyperFrames-Projekt pro Video
    index.html             Komposition (Szene + Overlay-Config)
    audio/sound.json       Cue-Liste, audio/sound.wav wird daraus erzeugt
    lib -> ../../lib       Symlink
  renders/<id>.mp4         fertige Videos (nicht im Git)
```

Erstes fertiges Video und Vorlage: `videos/niemand-arbeitet/`.

## Ablauf für ein neues Video

1. **Thema klären.** Nur nachfragen, wenn kein Thema genannt ist. Länge: Standard 30 s,
   wenn der Nutzer nichts sagt (die Vorbilder sind 80 s; dann die Zeiten unten strecken).
2. **Drehbuch schreiben** (im Chat kurz zeigen, dann direkt bauen):
   - Titel: „Was wäre, wenn …?“ mit einem Schlüsselwort in Akzentfarbe.
   - Ort: ein konkreter deutscher Alltagsort mit Menschen.
   - 6–8 Untertitel: zweite Person, Präsens, ein Fakt pro Satz, 3–9 Wörter.
     Muster: Ort → Körper/Alltag → Zahl → Alltag kippt → überraschende Folge →
     Steigerung → Wende → Pointe (kurz, trocken, gern mit Witz).
   - HUD-Phasen: vor dem Ereignis ein Countdown („X IN 0:05,999“), danach eine laufende
     Messgröße („NIEMAND ARBEITET SEIT 3,667 TAGEN“), Unterzeile mit einem Fakt, der
     mitzählt. Am Ende ein Wort statt einer Zahl („JETZT“, „HIER“, „ZURÜCK“).
   - Endkarte: Titel + zwei Faktenzeilen in Großbuchstaben.
   - **Fakten prüfen** (Websuche), Zahlen deutsch formatieren. Unsicheres weglassen.
3. **Ordner anlegen:** `bash tiktok-videos/hyperframes/tools/neues-video.sh <id>` und dann
   `index.html` umschreiben: Overlay-Config, Szene, Kamerapfad, Licht-Keyframes.
4. **Ton:** `audio/sound.json` an die Zeiten anpassen, dann
   `python3 tools/sounddesign.py videos/<id>/audio/sound.json videos/<id>/audio/sound.wav`.
5. **Prüfen** (im Videoordner): `npx -y hyperframes@0.8.154 lint` muss 0 Fehler melden.
   Dann `snapshot --at …` an jedem Phasenwechsel, Kontaktbogen ansehen und gegen die
   Regeln unten prüfen. Erst danach rendern.
6. **Rendern:** `npx -y hyperframes@0.8.154 render -o ../../renders/<id>.mp4 --quiet`
   (dauert in der Cloud etwa 10–15 min für 30 s, also im Hintergrund laufen lassen).
   Danach 6–8 Frames per ffmpeg ziehen und ansehen; das Video mit SendUserFile schicken.
7. **Committen und pushen** (ohne `renders/`).

In der Claude-Cloud vor jedem HyperFrames-Befehl:
`export HYPERFRAMES_BROWSER_PATH=$(find /opt/pw-browsers -name chrome-headless-shell -type f | head -1)`

## Zeitraster (30 s)

| Zeit | Phase |
|---|---|
| 0–3,1 | Titel über friedlicher Alltagsszene, Countdown läuft |
| 3,2–6 | Untertitel nennt den Ort |
| 6 | Ereignis: harter Toneinschnitt (impact + drone + Ticken), HUD springt um, Kamera ruckt |
| 6–24 | alle ~3 s ein Satz; Eskalation; Farbwelt und Licht wechseln pro Phase |
| 24–27 | Wende + Pointe, neue HUD-Größe bzw. Wort |
| 27–27,4 | Schwarz, Ton still |
| 27,4–30 | Endkarte #141414 |

Für 80 s: Ereignis bei 8 s, ein Satz alle ~4 s, Wende bei ~54 s, Endkarte ab 72 s.

## Vorgaben des Nutzers (haben Vorrang vor den Referenzen)

- **Nur POV (Ich-Perspektive)** auf Augenhöhe, mit sichtbaren Händen, die etwas halten, das zur
  Szene passt (Kaffeebecher, Handy mit passendem Bildschirmtext, Einkaufswagen, Müllsack,
  Geldscheine, Hand am Wasserhahn). Keine Vogelperspektive, keine Kamerakräne.
- **Pro Story-Beat eine eigene Szene**, die genau zeigt, was der Untertitel sagt
  („Regale sind leer“ → man steht im Supermarktgang und sieht die Regale sich leeren;
  „kein Wasser“ → Spüle, Hahn, der Strahl versiegt). Harte Schnitte mit 0,14 s Aufblende
  aus Schwarz, ein Whoosh im Ton auf jedem Schnitt. Zeitraffer innerhalb der Szene.
- Vorlage für diesen Aufbau: `videos/niemand-arbeitet/scene.js` (`SCENES`, `ENV`, `POSES`).

## Look-Regeln

- Low-Poly, flat shading, kantige Figuren ohne Gesichter, Häuser als Quader mit Fensterraster.
- Kamera ruhig mit leichtem Geh-Wippen (`walk`) und Handkamera-Wackeln über `shake()`;
  beim Ereignis ein kurzer Ruck.
- Jede Szene braucht etwas im Vordergrund (Hände, Menschen, Möbel), nie leere Flächen.
  Nichts darf durch die Kamera laufen. Ärmel nach unten neigen (rotation.x > 0), sonst
  füllen sie das Bild. Hände im Abstand 0,5–0,85 m vor der Kamera.
- Licht kommt von hinten oder von der Seite, nicht frontal (sonst Gegenlicht = schwarze Flächen).
  Nachtszenen bleiben lesbar: blaues Mondlicht, Hemi ≥ 0,5, Belichtung hoch.
- Text nur über `ww-overlay.js`: Titel oben (y ≈ 400), HUD links (y ≈ 815), Untertitel kursiv
  mittig (y ≈ 1250), Endkarte zentriert. Keine Emojis, keine Wort-für-Wort-Untertitel.
- Kein Sprecher. Ton: Atmo vor dem Ereignis, danach Drone und Ticken, Whooshes bei
  Satzwechseln, Effekte passend zur Handlung (powerdown, impact, wind, chord, bell).
- Deterministisch: kein `Math.random()`, kein `Date.now()`; nur `rng(seed)` und `t`.

## Baukasten (Kurzreferenz)

- `building({ w, h, d, color, tex })` → `{ mesh, material }`; `material.emissiveIntensity`
  schaltet Fensterlicht (Blackout, Abend). Texturen: `windowTextures(seed, "altbau"|"plattenbau")`.
- `crowd(n, seed)` → `set(i, { x, z, rotY, swing, armRaise, visible, scale })`, danach `commit()`.
- POV/Sets in `lib/props.js`: `hand(side)` (+ `userData.curl(0..1)`), `coffeeCup()`, `phone()` +
  `phoneScreen()`, `billFan()`, `trashBag()`, `shoppingCart()`, `supermarketAisle()`,
  `trashCorner()`, `subwayPlatform()`, `livingRoom()`, `kitchenSink()`, `storefront()`,
  `office()`, `textPanel()` für Schilder, `tileTexture()`, `cobbleTexture()`.
- `crowd(...).set(i, { sit: true, armRaise })` für sitzende Figuren (Büro, Bahn).
- `car(seed, "car"|"bus")`, `fernsehturm()`, `streetLamp(glowTexture())`, `createSky()`,
  `createStars()`, `cameraPath([{ t, pos, look }])`, `colorAt(keys, t)`, `valueAt(keys, t)`.
- Overlay: `createOverlay(el, { title, hud, subtitles, black, endcard })`, Formatierer
  `de(x, nachkommastellen)`, `countdown(sekunden)`, `curve(keys, t)`.
- Neue Bausteine (Wasser, Explosion, Planet, Hände …) in `lib/lowpoly.js` ergänzen,
  damit spätere Videos sie wiederverwenden.

## Inhaltliche Grenzen

Keine realen Anschläge, Kriege oder echten Opfer als Szenario. Physik, Natur, Gesellschaft,
Weltall und Alltag sind die Nische. Caption für TikTok am Ende vorschlagen (mit
„Nur eine Simulation“ und 4–6 Hashtags wie `#wasWäreWenn #simulation #wissen #fürdich`).
