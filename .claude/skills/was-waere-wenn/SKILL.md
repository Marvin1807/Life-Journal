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

Claude-Code-Mods (`tiktok-videos/claude-mods/`, im Projekt aktiviert):
- **regel-waechter** prüft vor jedem `hyperframes render` scene.js, index.html und sound.json gegen
  die Regeln unten. Bei Fehlern (z. B. wiederholter Ort, Länge ≠ sound.json, sound.wav veraltet)
  stoppt er den Render einmal; derselbe Befehl erneut läuft trotzdem. `/regeln [id]` prüft auf Zuruf.
- **render-monitor** zeigt über der Eingabe Fortschritt, Restzeit und die Stelle im Video, die
  gerade gerendert wird (Schätzung aus der gemessenen Renderzeit pro Videosekunde).
- **video-pipeline**: `/videos` öffnet die Liste mit Status (Drehbuch, Ton, gerendert, fertig,
  gepostet). `/videos ton <id>` baut sound.wav neu und mischt sie in die fertigen MP4s,
  `/videos rendern <id>` rendert im Hintergrund und komprimiert nach `tiktok-videos/output/`,
  `/videos gepostet <id>` markiert, `/videos neu <id> [vorlage]` legt einen Ordner an.

## Ablauf für ein neues Video

1. **Thema klären.** Nur nachfragen, wenn kein Thema genannt ist. Ideen und Hook-Regeln
   (Zeitfenster im Titel, deutscher Ort, echte Zahl früh) stehen in `tiktok-videos/THEMEN_RECHERCHE.md`. **Länge: Standard 75 s**
   (60–80 s wie die Vorbilder), damit die Geschichte Zeit hat. Kürzer nur auf ausdrücklichen Wunsch.
2. **Drehbuch schreiben** (im Chat kurz zeigen, dann direkt bauen):
   - Titel: „Was wäre, wenn …?“ mit einem Schlüsselwort in Akzentfarbe.
   - Ort: ein konkreter deutscher Alltagsort mit Menschen.
   - 14–18 Untertitel (bei 75 s): zweite Person, Präsens, ein Fakt pro Satz, 3–9 Wörter,
     als **Kette** („Dann …“, „Und noch …“), jede Zeile ist die Folge der vorigen.
     Story-Regeln siehe Abschnitt „Story (Pflicht)“ und `tiktok-videos/STORY_ANALYSE.md`.
     Muster: Ort → Körper/Alltag → Zahl → Alltag kippt → überraschende Folge →
     Steigerung → Wende → Pointe (kurz, trocken, gern mit Witz).
   - HUD-Phasen: vor dem Ereignis ein Countdown („X IN 0:05,999“), danach eine laufende
     Messgröße („NIEMAND ARBEITET SEIT 3,667 TAGEN“), Unterzeile mit einem Fakt, der
     mitzählt. Am Ende ein Wort statt einer Zahl („JETZT“, „HIER“, „ZURÜCK“).
   - Endkarte: Titel + zwei Faktenzeilen in Großbuchstaben.
   - **Fakten prüfen** (Websuche), Zahlen deutsch formatieren. Unsicheres weglassen.
3. **Ordner anlegen:** `bash tiktok-videos/hyperframes/tools/neues-video.sh <id>` und dann
   `index.html` umschreiben: Overlay-Config, Szene, Kamerapfad, Licht-Keyframes.
4. **Ton (Pflicht, nach dem Rezept unten):** `audio/sound.json` Szene für Szene schreiben, dann
   `python3 tools/sounddesign.py videos/<id>/audio/sound.json videos/<id>/audio/sound.wav`.
   Das Skript meldet RMS (Ziel ≈ −17 dB) und Peak. Nur den Ton geändert? Nicht neu rendern,
   sondern mit ffmpeg die Tonspur im fertigen MP4 ersetzen (`-map 0:v -map 1:a`).
5. **Prüfen** (im Videoordner): `npx -y hyperframes@0.8.154 lint` muss 0 Fehler melden.
   Dann `snapshot --at …` an jedem Phasenwechsel, Kontaktbogen ansehen und gegen die
   Regeln unten prüfen. Erst danach rendern.
6. **Rendern:** `npx -y hyperframes@0.8.154 render -o ../../renders/<id>.mp4 --quiet`
   im Hintergrund (Bash `run_in_background`, `timeout: 7200000`). Dauer in der Cloud ≈ 22 s pro
   Videosekunde, also ~28 min für 75 s. Vorher in `index.html` `data-duration` (Root, Canvas,
   Overlay, Audio) und die GSAP-Timeline (`.set({}, {}, 75)`) sowie `"duration"` in
   `audio/sound.json` auf die Videolänge setzen.
   Danach 8–10 Frames per ffmpeg ziehen und ansehen; das Video mit SendUserFile schicken
   (vorher mit `-crf 20` unter 30 MB bringen).
7. **Committen und pushen** (ohne `renders/`).

In der Claude-Cloud vor jedem HyperFrames-Befehl:
`export HYPERFRAMES_BROWSER_PATH=$(find /opt/pw-browsers -name chrome-headless-shell -type f | head -1)`

## Was die Kanal-Daten zeigen (Stand 21.10.2026, @anderewelt7)

| Video | Länge | Ø geschaut | bis zum Ende |
|---|---|---|---|
| Sauerstoff | 75 s | 17,7 s | 4,0 % |
| Wal | 75 s (20 s ruhiger Anfang) | 10,7 s | 1,8 % |
| Nur noch 100 | 61 s (persönlich, offene Frage) | 16,4 s | **16,3 %** |
| Regen | 91 s | 18,2 s | 4,7 % |
| Roadster | 96 s | 16,1 s | 1,8 % |

Folgerungen (haben Vorrang vor dem Zeitraster unten):
- **Länge 35–45 s.** Zuschauer bleiben im Schnitt nur 16–18 s, egal wie lang das Video ist.
- **Bis 2 s etwas Überraschendes, bis 15 s die stärksten Bilder.** Kein ruhiger Einstieg.
- **Persönlicher Bezug + offene Frage bis zum Schluss** („du“, „deine Mama“, „Wer ist Nummer 101?“) –
  das einzige Video mit >15 % Komplett-Ansichten hatte genau das.
- **Loop-Ende** statt langer Endkarte, damit Wiederholungen zählen.
- Das Zeitraster unten bei 40 s Länge sinngemäß stauchen (Ereignis ~1–2 s, Höhepunkt ~30 s).

## Zeitraster (75 s, Standard)

**Nutzer-Vorgabe:** Der Anfang darf nicht lang dauern, es muss ständig etwas passieren. Das
Ereignis kommt spätestens bei **~7 s**, danach alle 3–5 s ein neuer, sichtbarer Vorfall
(nie mehr als ~5 s ohne neues Geschehen im Bild).

| Zeit | Akt | Inhalt |
|---|---|---|
| 0–3,5 | Hook | Titel über belebter Szene; Countdown läuft schon (kurz, ~7 s) |
| 3,5–7 | Ironie | 1–2 Sätze: Der Zuschauer weiß, was gleich passiert („In 3 Sekunden …“) |
| ~7 | Auslöser | Countdown erreicht 0: Toneinschnitt, Kamera ruckt, HUD wechselt auf Messgröße 1 |
| 7–25 | 1 · Sofortfolgen | Schlag auf Schlag: 4–5 sichtbare Vorfälle direkt nach dem Ereignis |
| 25–45 | 2 · Eskalation | Messgröße 1 wächst stark (×4, ×16, ×75 …), weitere Vorfälle als Kette |
| 45–60 | 3 · Steigerung | neue Messgröße, der Ort verwandelt sich weiter |
| 60–68 | Höhepunkt | eine Entfernung/Zeit läuft auf dich zu → „HIER“; ein letzter Satz |
| 68–70 | Nachklang | Bild steht/zerfällt, Ton bricht ab |
| 70–70,5 | Schwarz | Stille |
| 70,5–75 | Endkarte | Titel + Zeile 1 Aufklärung/Mythos + Zeile 2 echter Fakt; darunter Frage an die Community |

Bei ausdrücklich gewünschten 30 s: Auslöser bei 6 s, ein Satz alle ~3 s, Höhepunkt bei 24 s, Endkarte ab 27,4 s.

## Story (Pflicht)

1. **Ein kurzer Countdown (~7 s) startet das Video**, danach trägt eine zulaufende Messgröße/Entfernung bis zum Höhepunkt.
2. **Dramatische Ironie, aber kurz:** Der Zuschauer weiß mehr als die Menschen im Bild – höchstens die ersten ~7 s.
3. **Pro Akt eine Messgröße**, die sichtbar und stark wächst; am Ende ein Wort statt einer Zahl.
4. **Untertitel als Kette** mit „Dann …“/„Und …“; trockene Kurzsätze als Pointen
   („Es explodiert. Natürlich.“ / „Berlin hat keine Vulkane.“).
5. **HUD-Unterzeile darf ein eigener Running Gag sein** (bei leichten Themen).
6. **Das Ende greift den Hook auf** (Ironie oder Auflösung), die Endkarte klärt auf und endet mit
   einer Frage an die Zuschauer („Was soll als Nächstes schiefgehen? Schreib es in die Kommentare.“).
7. **Ton:** Orts-Atmo läuft durch; statt vieler Musikwechsel ein langer, stetiger Anstieg
   (`riser`/`pad` mit `from`→`to`) bis zum Höhepunkt, dann Schnitt auf Rumpeln, Endkarte still.

## Vorgaben des Nutzers (haben Vorrang vor den Referenzen)

- **Nur POV (Ich-Perspektive)** auf Augenhöhe, mit sichtbaren Händen, die etwas halten, das zur
  Szene passt (Kaffeebecher, Handy mit passendem Bildschirmtext, Einkaufswagen, Müllsack,
  Geldscheine, Hand am Wasserhahn). Keine Vogelperspektive, keine Kamerakräne.
- **Was der Untertitel sagt, muss man sehen** („Regale sind leer“ → Supermarktgang, die Regale
  leeren sich; „kein Wasser“ → Spüle, der Strahl versiegt). Zeitraffer innerhalb der Szene.
- **Kein Clip, kein Ort, keine Einstellung darf sich wiederholen.** Nie zum Anfangsort
  zurückspringen, keine Rückblende, kein zweites Mal dieselbe Straße. Lieber **eine Hauptszene,
  die sich verwandelt**; ein neuer Ort nur, wenn die Geschichte dorthin weiterzieht (du gehst
  weiter, die Folge breitet sich aus), jeder Ort genau einmal, höchstens 4–5 Orte in 75 s.
  Schnitte: 0,14 s Aufblende aus Schwarz + Whoosh.
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
- Kein Sprecher. Ton nach dem Sound-Rezept (nächster Abschnitt).
- Deterministisch: kein `Math.random()`, kein `Date.now()`; nur `rng(seed)` und `t`.

## Sound-Rezept (Pflicht für jedes Video)

Abgeleitet aus den Spektrogrammen der drei @man_ia_c-Videos: keine Stimme, viel Sub-Bass,
Glissandi, Einschläge mit Hall, Glocken, Funkeln, leise Endkarte. Lautheit ≈ −17 dB RMS
(macht `tools/sounddesign.py` automatisch). `python3 tools/sounddesign.py --list` zeigt alle Typen.
Vollständige Beispiele: `videos/sonne-weg/audio/sound.json`, `videos/niemand-arbeitet/audio/sound.json`.

Drei Schichten, immer alle drei:

1. **Atmo pro Szene** (`ambience` mit `preset`): exakt von Schnitt zu Schnitt, harte Kanten.
   Presets: beach, street, subway, supermarket, backyard, room, storm, underwater, office,
   night, crowd. Fehlt eine passende, neues Preset in `sounddesign.py` ergänzen.
2. **Musik/Spannung**
   - vor dem Ereignis: leises Dur-`pad` + `riser`, der genau auf das Ereignis zuläuft
   - Ereignis: `impact` (verb 0.5–0.6) + `tinnitus` (3–4 s, leise) + Atmo bricht ab
   - danach bis zur Wende: `sub` (40–50 Hz) + Moll-`pad` + `ticks` (werden schneller);
     ab der Mitte zusätzlich `heartbeat`
   - jeder Schnitt: `whoosh` (gain ≈ 0.33, verb 0.3)
   - dramatische Momente: `drop` (fallendes Glissando, z. B. Licht geht aus), `chime` (Glocke,
     z. B. 392 Hz bei einer Erkenntnis), `shimmer` (Funkeln bei Magie/Leben/Erlösung)
   - vor der Wende: `reverse` auf die Wende, dann Dur-`chord` mit Hall
   - Schwarzbild: `silence`; Endkarte: sehr leises `pad` + `bell`
3. **Foley zu allem, was man sieht** (synchron zum Bild):
   - Gehen → `footsteps` mit passendem `surface` (sand, snow, street, tile, wood, ice), rate 1.85
   - Hände: Wasserhahn `squeak` + `water` + `drip`; Geld/Papier `flutter`; Wagen `rattle`;
     Eis `ice_crack`; Kälte/Feuer `crackle`; Strom aus `flicker` + `powerdown`;
     Durchsage `ding`; Kasse `beep`; Aufprall/Pointe `splat`
   - Zeitpunkte aus `scene.js` übernehmen (dieselben Sekunden wie die Animation).

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
