# Neues Drehbuch erzeugen

Diesen Text in Claude (oder ein anderes Sprachmodell) kopieren, das Thema
einsetzen und die Antwort als `drehbuecher/<id>.json` speichern.

```
Schreibe ein Drehbuch für ein deutsches TikTok im Stil "Was wäre wenn"-3D-Simulation.

Thema: <HIER THEMA, z. B. "Was wäre, wenn die Zugspitze ein Vulkan wäre?">

Regeln:
- 6 bis 9 Szenen, gesamt 35 bis 60 Sekunden Sprechzeit (ca. 12 bis 22 Wörter pro Szene).
- Szene 1 ist der Hook und stellt genau die Titelfrage.
- Jede Szene hat eine große Zeitmarke ("label") in Großbuchstaben, aufsteigend:
  z. B. "0 SEK", "10 MIN", "1 TAG", "1 JAHR", "1000 JAHRE". Letzte Szene: "ENDE".
- Jede Szene eskaliert. In der Mitte ein Fakt mit einer konkreten, korrekten Zahl.
- Zahlen im Sprechtext als Wörter ausschreiben.
- Letzte Szene: kurze Auflösung (beruhigend, wenn das Szenario unrealistisch ist)
  und eine Frage an die Zuschauer.
- "visual": englischer Bildprompt für einen KI-Video-Generator, eine Zeile,
  konkret (Kamera, Ort, Objekt, Licht). Kein Text im Bild.
- Fakten müssen wissenschaftlich vertretbar sein; Unsicheres als "könnte" formulieren.
- Keine realen Anschläge, Kriege oder echten Opfer.

Antworte nur mit JSON in genau diesem Format:
{
  "id": "kurzer-dateiname",
  "title": "Was wäre, wenn …?",
  "voice": "de-DE-ConradNeural",
  "rate": "+6%",
  "visual_style": "photorealistic 3D simulation render, cinematic, vertical 9:16",
  "caption": "TikTok-Beschreibung mit Emoji. Nur eine Simulation. #wasWäreWenn #simulation #wissen #fürdich",
  "scenes": [
    {"label": "0 SEK", "text": "…", "visual": "…"}
  ]
}
```
