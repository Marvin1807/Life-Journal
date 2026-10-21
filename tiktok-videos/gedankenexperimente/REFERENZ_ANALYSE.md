# Referenz-Analyse – Nische „Verstörende Gedankenexperimente“ (Stil @mentalist_xyz)

Zwei hochgeladene MP4s, beide von **@mentalist_xyz** (Wasserzeichen unten rechts, CapCut-/TikTok-Outro).
Analyse mit `tools/referenz-analyse.sh` (Kacheln 1 Bild/s, Spektrogramm, Lautheit), Szenenwechsel per
`ffmpeg select=gt(scene,0.25)`, Wortwechsel mit 10 fps, Sprache per Whisper (sherpa-onnx, offline) transkribiert.

| | Video A „KI löscht die Menschheit aus“ | Video B „Philosophische Zombies / NPCs“ |
|---|---|---|
| Länge | 83,1 s (davon 77,0 s Inhalt + 6 s Outro) | 91,5 s (86,8 s Inhalt + 4,7 s Outro) |
| Format | **16:9 quer**, 1024×576, 30 fps | gleich |
| Wörter gesprochen | ca. 205 → **≈ 2,7 Wörter/s** | ca. 230 → ≈ 2,7 Wörter/s |
| Einstellungen | ~22 → Ø **3,5 s** pro Bild | ~17 → Ø **5 s** pro Bild |
| Lautheit | ≈ −15 dB RMS | ≈ −25 dB RMS |

## 1. Look

- **Flache 2D-Vektorillustration** („Kurzgesagt-light“): klare Flächen, weiche Verläufe, keine Outlines,
  Figuren ohne Mund, einfache Gesichter (Punktaugen), große Silhouetten.
- **Farbwelt:** dunkles Violett/Indigo (#1d0f3d … #3a1a6b) als Grundton, dazu je Szene ein Akzent:
  Sonnenuntergangs-Orange, Neon-Cyan, Magenta, Blutmond-Rot. Video B fast komplett violett mit
  **Spotlight-Vignette** (heller Kreis in der Mitte, Ränder fast schwarz).
- **Textur:** feines Filmkorn / vertikale Scanlines, leichtes Glühen (Bloom) an Lichtern, Sterne/Partikel.
- **Kamera:** keine echte Kamera, sondern langsamer **Zoom/Pan (Ken-Burns)** und Parallaxe; Elemente
  animieren (Figuren laufen, Balken füllen sich, Icons blenden aus, Hologramm-Gitter scannt).
- Wiederkehrende Bildmotive: Kopf-Silhouette im Profil mit Licht/Chip im Inneren, Gesicht in
  Nahaufnahme → Zoom ins Auge, Menschen-Raster (Icons gehen aus), Kreisdiagramm/Tacho mit Prozent,
  Hand hält Handy/Schlüssel, Gruppe Silhouetten auf einem Hügel vor riesigem Mond.

## 2. Schnitt

- Harte Schnitte oder **sehr kurze Blitz-/Kreuzblenden (≈ 0,1–0,2 s)**, manchmal Zoom-Übergang
  (ins Auge hinein → nächste Szene).
- **Jede Einstellung illustriert genau den Satz, der gerade gesprochen wird** (Neandertaler → Neandertaler
  am Feuer; „Stimme im Kopf“ → leuchtende Köpfe; „pausier das Video“ → Hand mit Handy und Pause-Symbol).
- Kein Motiv wiederholt sich wörtlich; Ausnahme: der Schluss greift die Kopf-Silhouette vom Anfang auf.

## 3. Schrift / Untertitel

- **Genau ein Wort** gleichzeitig, **GROSSBUCHSTABEN**, fette runde Grotesk (Rubik/Montserrat Black-Optik),
  ca. **8–9 % der Bildhöhe**, **mittig** (vertikal ~50 %).
- Wechsel **hart**, ohne Pop/Fade, exakt auf die Sprache (≈ 0,35 s pro Wort, lange Wörter länger).
- Farbe pro Szene passend zur Palette (Mintgrün, Creme, Hellblau, Weiß, Dunkelblau), leichter Schatten.
- Text liegt **zwischen Hinter- und Vordergrund**: Vordergrund-Elemente (Windrad, Hände, Figuren)
  dürfen das Wort überdecken; teils Mischmodus, Buchstaben färben sich über hellen Flächen um.
- **Kein Titel, kein HUD, keine Endkarte** – die Stimme trägt alles. Am Ende nur Outro (nicht übernehmen).

## 4. Ton

- **Sprecherstimme (männlich, ruhig, eher tief, leicht verschwörerisch)** – Hauptspur, durchgehend,
  kaum Pausen (nur an Satzenden ~0,3 s, vor Pointen ~0,6 s).
- **Musikbett:** dunkles, atmosphärisches Synth-/Ambient-Pad, deutlich leiser als die Stimme (≈ −18 dB
  darunter), Spektrogramm zeigt durchgehenden Teppich; in B fällt die Musik im letzten Viertel weg
  (nur Stimme mit Pausen = Spannung vor der Schlussfrage).
- Kaum Effekte: dezente Whooshes an Schnitten, Glitch bei „Hindernis“, am Ende Outro-Sting (nicht übernehmen).

## 5. Untertitel / Sprechtext mit Zeit (Whisper-Transkript, Zeit = Beginn des 20-s-Blocks)

**Video A**
- 0,0 „KI wird die Menschheit auslöschen, aber nicht auf die Art, die du vielleicht erwartest.“ ← Hook (0–4,9 s)
- „Es wird keinen Krieg zwischen Menschen und Robotern geben, wie wir ihn aus Filmen kennen. Keine
  Explosionen, keine Schießereien und keine Toten. Ich glaube, dass KI in den nächsten Jahren friedlich
  im Hintergrund unseres Alltags existieren wird. Sie wird sich schrittweise weiterentwickeln, immer
- 20,0 intelligenter werden und der Menschheit vielleicht sogar dabei helfen, Dinge zu erreichen, die wir uns
  heute noch gar nicht vorstellen können. Aber irgendwann, und das ist vermutlich nur noch wenige Jahre
  entfernt, wird KI die menschliche Intelligenz übertreffen. Sie wird intelligenter sein als wir. Und
  ungefähr zu diesem Zeitpunkt wird sie erkennen, dass die Menschheit eigentlich keinen
- 40,0 wirklichen Nutzen mehr für sie hat. Im Gegenteil, wir sind nur ein weiteres Hindernis auf ihrem Weg.
  Ich meine, wenn wir uns die Menschheitsgeschichte anschauen, waren wir selbst nicht gerade besonders
  freundlich zu anderen intelligenten Spezies. Schon mal von den Neandertalern gehört? Ausgestorben.
  Jeder Einzelne von ihnen. Von unseren Vorfahren ausgelöscht, weil wir sie als Bedrohung
- 60,0 gesehen haben. Was also sollte eine KI davon abhalten, genau dasselbe mit uns zu tun? Man sagt, dass
  99 % aller Arten irgendwann aussterben. Aber wir könnten die erste Spezies sein, die dumm genug ist, den
  Schlüssel zu ihrer eigenen Auslöschung freiwillig aus der Hand zu geben.“ (Ende 77 s)

Bildfolge A: KI-Spinne über Erde (0) · Röhren-TV (2,4) · Roboter vs. Mensch im Theater (4,9) · Dorf im
Sonnenschein (9) · Haus-Querschnitt bei Nacht (12,5) · Labor-Energiestrahl (17,8) · Hand + Roboterhand
(19,8) · schwebende Inseln (23,2) · Straße mit Jahresschildern 2029–2033 (26,7) · Strichmännchen-Kurve
(31) · Kopf vs. Polygon-Kopf (33) · HUD-Globus (36) · Menschen-Raster + Tacho fällt (38) · Glitch (42) ·
Skyline der Geschichte (46) · Tier-Silhouetten (48) · Neandertaler (52) · Lagerfeuer erlischt (54) ·
Blutmond (57) · Auge/Orb über Menschen (61) · Arten-Icons verblassen „99 %“ (66) · Astronaut (70) ·
Hand mit Schlüssel (73).

**Video B**
- 0,0 „Was, wenn manche Menschen, mit denen du jeden Tag redest, gar kein Bewusstsein haben? Was, wenn sie
  wortwörtlich NPCs sind?“ ← Hook (0–9 s)
- „In der Philosophie und Wissenschaft gibt es ein ziemlich verstörendes Gedankenexperiment. Sogenannte
  philosophische Zombies. Das sind Menschen, die sich genauso verhalten [wie alle anderen].
- 20,0 Sie reden, lachen, zeigen Gefühle und reagieren völlig normal. Aber in ihrem Inneren herrscht absolute
  Dunkelheit. Hinter ihren Augen findet keinerlei bewusstes Erleben statt. Du gehst wahrscheinlich davon
  aus, dass jeder Mensch gerade eine Stimme in seinem Kopf hört, während er diesen Text [liest].
- 40,0 Aber Studien zeigen, dass viele Menschen überhaupt keinen inneren Monolog haben. Manche Schätzungen
  sprechen sogar von bis zu 50 Prozent. Keine innere Stimme. Einfach Stille. Ihr Gehirn verarbeitet
  Informationen, ohne dass sie ihre Gedanken als innere Stimme hören. Du glaubst mir nicht?
- 60,0 Pausier dieses Video und such auf TikTok nach ‚Inner Monologue Test‘. Du wirst überrascht sein, wie
  viele Menschen in deinem eigenen Umfeld ihre Gedanken tatsächlich nicht hören können. Also, wenn dir das
  nächste Mal jemand erzählt, dass er glücklich oder traurig ist, schau ihm tief in die Augen und frag
  dich: Sprichst du gerade
- 80,0 mit einem echten, bewussten Menschen oder einfach nur mit einem hochentwickelten biologischen Programm?“

Bildfolge B: Maske spaltet sich (0) · NPC-Figuren laufen im Kreis, „!“-Marker (5) · Büste mit Scan-Gitter
(9) · Mann im Nebel „Zombies“ (14) · Mann + Spiegelbild (17) · drei Menschen mit Sprechblasen „HAHA“/Herz
(21) · Kopf-Silhouette dunkel (26) · Augen-Nahaufnahme → Zoom ins Auge (30) · Köpfe mit Leuchtpunkt (35) ·
Kopf-Raster, einige erlöschen (41) · Kreisdiagramm 50 % + Figuren (46) · Mann sitzt im Mondlicht „Stille“
(50) · Gehirn mit Netz + Stumm-Symbol (53) · Hand mit Handy, Pause, Suche (59) · Netz aus Porträts (65) ·
Masken lachen/traurig (72) · Gesicht Nahaufnahme (77) · Kopf mit Licht (80) · Kopf halb Chip (83).

## 6. Story-Bogen (beide gleich gebaut)

1. **Hook in einem Satz (4–9 s):** provokante These in 2. Person, die das eigene Weltbild angreift
   („…nicht auf die Art, die du erwartest“ / „Was, wenn manche Menschen … kein Bewusstsein haben?“).
2. **Gegenbild / Einordnung (bis ~20 s):** „Es ist nicht wie in Filmen …“ bzw. „In der Philosophie gibt es …“.
3. **Mechanismus (20–45 s):** Schritt für Schritt, kurze Sätze, konkrete Bilder.
4. **Beleg (45–65 s):** ein echter Fakt/Studie/Geschichte (Neandertaler, Studien zum inneren Monolog, „99 %“).
5. **Interaktion (B):** „Du glaubst mir nicht? Pausier das Video …“
6. **Schluss = unbequeme Frage/Pointe an dich** („Sprichst du gerade mit einem echten Menschen …?“),
   kein Abspann, Ende direkt nach dem letzten Wort.

## 7. Was wir übernehmen / ändern

- Übernehmen: 16:9-Format, flacher 2D-Vektorlook mit Violett-Spotlight, Ein-Wort-Untertitel mittig,
  Sprecher + leises dunkles Musikbett, ~2,7 Wörter/s, Einstellung alle 3–5 s, Hook-Satz → Schlussfrage.
- Eigene Umsetzung: Stimme per **Piper TTS (Thorsten, Deutsch, offline)**, Illustrationen im Code (SVG/Canvas
  in HyperFrames, nicht Three.js-Low-Poly), Musik/Whoosh aus `sounddesign.py`, deutsche Beispiele
  (Deutschland-Zahlen, deutsche Orte), keine Wasserzeichen, kein CapCut-/TikTok-Outro.
- Prüfen: Fakten mit Quelle; „Schätzungen“ als solche sprechen (Video B macht das richtig: „Manche
  Schätzungen sprechen von bis zu …“).
