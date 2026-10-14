# Claude-Code-Mods für die Was-wäre-wenn-Videos

Drei Mods, im Projekt über `.claude/settings.json` (Marketplace `was-waere-wenn-mods`) aktiviert.

| Mod | Was er macht | Befehl |
|---|---|---|
| `regel-waechter` | Prüft vor jedem HyperFrames-Render `scene.js`, `index.html` und `audio/sound.json` gegen die Skill-Regeln (60–80 s, 14–18 Untertitel, keine Überlappung, Countdown, „HIER“, Endkarte mit Frage und Fakt, kein Ort doppelt, Ton passt zur Länge, `sound.wav` aktuell, keine verbotenen Symbole). Fehler stoppen den Render einmal, Hinweise gehen an Claude. | `/regeln [id]` |
| `render-monitor` | Band über der Eingabe: Fortschrittsbalken, Restzeit, Stelle im Video mit Untertitel. Lernt die Renderzeit pro Videosekunde mit. | – |
| `video-pipeline` | Panel mit allen `videos/<id>`: Länge, letzte Änderung, Status Drehbuch / Ton / gerendert / fertig / gepostet und nächster Schritt. | `/videos`, `/videos ton <id>`, `/videos rendern <id> [trotzdem]`, `/videos gepostet <id>`, `/videos neu <id> [vorlage]` |

Prüfen und testen:

```bash
claude plugin validate tiktok-videos/claude-mods/<mod>
claude plugin test tiktok-videos/claude-mods/<mod>
```
