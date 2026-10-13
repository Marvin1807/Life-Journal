# Referenzanalyse @man_ia_c

Grundlage sind drei heruntergeladene Videos, Bild für Bild (alle 2 s) und per
Spektrogramm ausgewertet:

| # | Titel | Ort | Farbwelt |
|---|---|---|---|
| 1 | What if oxygen disappeared for 5 seconds? | Dachterrasse, Großstadt | warm, Abendlicht → Sepia/Staub |
| 2 | What if electrons disappeared for 5 seconds? | Central Park, New York | grün → Blau-Weiß, Röntgen-/Drahtgitter-Look |
| 3 | What if every atom gained a proton for 3 seconds? | Japanisches Kirschblütenfest, Tokio | Nacht, Laternen → Gelb-Grün, Weltall |

Technische Daten: 576×1024 (TikTok-Download), 30 fps, **jedes Video genau 80 s**.

## Die wichtigste Erkenntnis

- **Keine Sprecherstimme.** Die Geschichte wird nur über Einblendungen erzählt.
  Im Spektrogramm sind keine Sprachformanten zu sehen, nur Sounddesign.
- **Eine einzige durchgehende Kamerafahrt, praktisch ohne Schnitte.** Die
  Szenenerkennung findet nur 2–3 harte Wechsel pro Video.
- **Echtzeit-3D im Low-Poly-Stil**, keine KI-Videoclips: kantige Figuren ohne
  Gesichter, Häuserblöcke als Quader mit Fensterraster, flache Schattierung,
  Nebel, Bloom und Partikel. Das sieht nach Three.js/WebGL aus und ist mit
  HyperFrames + Three.js direkt nachbaubar.

## Ablauf (bei allen drei identisch)

| Zeit | Phase | Was passiert |
|---|---|---|
| 0–4 s | Hook | Titelfrage groß in der Mitte über einer friedlichen Alltagsszene. Der Countdown „X VERSCHWINDET IN 0:07,033“ läuft in Echtzeit. |
| 4–8 s | Ort | Der Titel ist weg. Erste Einblendung nennt den Ort: „Du bist auf einer Dachterrasse in der Innenstadt.“ |
| 8 s | Ereignis | Harter Toneinschnitt. Das HUD springt auf „X KEHRT ZURÜCK IN 0:04,951“. |
| 8–54 s | Zeitlupe | Die 5 (bzw. 3) Sekunden werden auf rund 46 s gestreckt („ZEIT 11× VERLANGSAMT“). Alle ~4 s ein neuer Satz, Eskalation vom eigenen Körper → Stadt → Planet → Weltall. |
| 54–62 s | Rückkehr | „Dann kommt der Sauerstoff zurück.“ Das HUD wechselt auf eine neue Messgröße, die auf dich zuläuft („DAS FEUER 644 ft … 205 ft … HIER“). Explosion bzw. Druckwelle. |
| 62–71 s | Nachwirkung | HUD zeigt „HIER“ / „ZURÜCK“ / „VERGANGENE ZEIT 3,000 s“. Das Kameraglas bekommt Risse. Letzter Satz als Pointe („Dein Ring ist zurück. Als Pfütze.“). |
| 71–72 s | Schwarz | Eine Sekunde Schwarzbild. |
| 72–80 s | Endkarte | Anthrazit (#141414), Titel erneut, das Schlüsselwort farbig (z. B. „electrons“ hellblau), darunter zwei Zeilen Fakten in Monospace. |

## Bildschirmelemente (Positionen für 1080×1920)

**Titel** (0–4 s und Endkarte)
- Serifenschrift, normal, weiß, weicher Schatten, ~78 px, 2 Zeilen, zentriert.
- In der Szene bei ~y = 430–520, auf der Endkarte mittig.

**HUD links** (durchgehend), linker Rand ~55 px, Oberkante ~y = 790
1. Bezeichnung: Großbuchstaben, Grotesk (Inter-artig), halbfett, ~22 px, weite Laufweite.
   Beispiele: `OXYGEN DISAPPEARS IN`, `ELECTRONS RETURN IN`, `FLUORINE IN THE AIR`,
   `DISTANCE FROM YOU`, `THE FIRE`, `FLUORINE WALL`, `TIME ELAPSED`.
2. Wert: Serifenschrift, ~52 px, Millisekunden-genau und laufend:
   `0:04.951`, `20.946%`, `90,865,554 mi`, `644 ft`, am Ende das Wort `HERE` / `BACK`.
3. Unterzeile: Großbuchstaben, ~15 px, ~60 % Deckkraft, weite Laufweite. Ein Kontext-Fakt,
   der mitwächst: `AIR PRESSURE 11.6 PSI · −21%`, `HYDROGEN CLOUD 470 FT HIGH`,
   `THE GROUND HAS DROPPED 36 FT`, `TIME SLOWED DOWN 11×`, `NO CLOUDS · NO ICE · NO OCEANS`.

**Untertitel** (ein Satz)
- Kursive Serifenschrift, weiß, ~40 px, zentriert bei ~y = 1270, weicher Schatten.
- Ein Satz pro ~4 s, 0,5 s Ein- und Ausblenden, maximal 2 Zeilen.
- Zweite Person, Präsens, kurz, ein Fakt pro Satz.

**Endkarte**
- Titel ~66 px, Schlüsselwort in Akzentfarbe.
- Faktenzeilen: Monospace, Großbuchstaben, ~16 px, grau (#8a8a8a), sehr weite Laufweite.
  Beispiel: `OXYGEN IS 21% OF THE AIR / AND 46% OF THE ROCK UNDER YOUR FEET`.

**Video 3 zusätzlich:** Ein Periodensystem als Overlay oben, in dem die
Elemente „weiterrutschen“ (`HYDROGEN → HELIUM`, `GOLD → MERCURY`).

## Schreibstil der Einblendungen

Alle Sätze aus Video 1, als Beispiel für den Rhythmus:

1. You are on a rooftop bar downtown.
2. Everyone's ears pop at once.
3. Oxygen is 21% of the air.
4. Every engine stops.
5. The river is 89% oxygen.
6. It turns into hydrogen gas.
7. Glass and concrete are half oxygen.
8. So is the ground beneath you.
9. For now, nothing can burn.
10. Then the oxygen comes back.
11. The hydrogen is still here.

Muster: Ort → Körpergefühl → Zahl → Alltag kippt → überraschende Zahl → Folge →
„So is …“-Steigerung → falsche Entwarnung („For now …“) → Wende → Pointe.

## Kamera und Bild

- POV auf Augenhöhe, langsames Schwenken und Driften; Handkamera-Wackeln bei Erschütterungen.
- Erste-Person-Hände als emotionaler Anker (Video 2 und 3).
- Pro Phase eine neue Farbwelt bzw. ein neuer Render-Stil (Drahtgitter, Glühen, Staub).
- Herauszoomen bis ins All, wenn es planetar wird (HUD wechselt auf „DISTANCE FROM YOU“).
- Am Ende Risse im „Kameraglas“ (weiße, verästelte Linien mit Lichtpunkt im Zentrum).

## Ton (ohne Stimme)

- 0–8 s: Umgebung (Stimmengewirr, Stadt) und ein sanfter Ton, der langsam steigt.
- 8 s: harter Schnitt, tiefer Drone-Ton (~700 Hz Grundton) und ein Uhrticken, das mit dem Countdown schneller wird.
- Steigerungen über Riser, Klangschwaden und Rauschen.
- Rückkehr: Explosion bzw. Wumms, danach Nachhall.
- Endkarte: leiser Ausklang, die letzte Sekunde still.

## Umsetzung auf Deutsch

- HyperFrames-Komposition mit Three.js (Low-Poly-Szene im Code, deterministisch renderbar)
  plus HTML-Overlay für HUD, Untertitel und Endkarte.
- Deutsche Zahlenschreibweise: `0:04,951`, `20,946 %`, `90.865.554 km`, Meter statt Fuß.
- Deutsche Orte statt New York/Tokio: Dachterrasse in Berlin, Englischer Garten,
  Hamburger Hafen, Oktoberfest, Kölner Dom.
- Schriften (frei verfügbar): Serife „EB Garamond“ oder „Newsreader“, HUD „Inter“,
  Endkarte „JetBrains Mono“.
- Ton: Sounddesign aus lizenzfreien Effekten (Ambience, Ticken, Drone, Riser, Wumms).
