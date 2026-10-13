# Life Journal

Eine cloudbasierte Personal-Life-Management-Web-App: Tagesplanung, Routinen, Aufgaben,
Kalender, Fitness, Ernährung, Ziele und Statistiken in einer Anwendung.

Mobile-first für das iPhone gebaut, installierbar als PWA, mit echter Datenbank,
echter Authentifizierung und persistenter Cloud-Speicherung.

## Online stellen

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMarvin1807%2FLife-Journal&project-name=life-journal&repository-name=life-journal)

Der einfachste Weg braucht nur ein Vercel-Konto, keine zweite Anmeldung
woanders:

1. Auf den Button klicken und das Projekt anlegen. Der erste Build läuft
   absichtlich ohne Datenbank durch.
2. Im Projekt auf *Storage*, dann *Create Database*, *Postgres* wählen und
   verbinden. Vercel trägt die Zugangsdaten selbst als Umgebungsvariablen ein.
3. Auf *Deployments* das letzte Deployment erneut ausführen (*Redeploy*).
   Dabei legt die App ihre 31 Tabellen selbst an.

Danach die Adresse in Safari öffnen, registrieren, fertig.

Sollte Vercel beim Verbinden melden, es gebe `DATABASE_URL` bereits: Das
stammt aus `.env.example`, das beim Import als Vorlage gelesen wird. Trage in
*Custom Prefix* einfach `STORAGE` ein. Die App erkennt auch Variablen mit
eigenem Präfix und ignoriert übernommene Platzhalterwerte.

### Mit eigener Datenbank

Wer lieber Supabase oder Neon direkt nutzt, setzt beim Anlegen des Projekts
`DATABASE_URL` auf den Verbindungsstring. Bei Supabase steht er unter
*Project Settings → Database → Connection string → URI*; das `[YOUR-PASSWORD]`
darin muss durch das echte Passwort ersetzt werden.

---

## Technik

| Bereich          | Wahl                                          |
| ---------------- | --------------------------------------------- |
| Framework        | Next.js 15 (App Router), React 19, TypeScript |
| Styling          | Tailwind CSS 4 mit eigenen Design-Tokens      |
| Datenbank        | PostgreSQL (Supabase, Neon oder selbst gehostet) |
| ORM / Migrationen| Drizzle ORM + drizzle-kit                     |
| Authentifizierung| Eigene Sessions, bcrypt, httpOnly-Cookies     |
| Validierung      | Zod auf jedem API-Endpunkt                    |
| Tests            | Vitest (Planungslogik + API-Integrationstests)|

Die Authentifizierung ist bewusst ohne externen Anbieter umgesetzt: Die App läuft damit
auf jeder PostgreSQL-Datenbank, ohne an einen Dienst gebunden zu sein.

---

## Schnellstart

Voraussetzung: Node.js 20 oder neuer und eine PostgreSQL-Datenbank
(z. B. ein kostenloses Supabase-Projekt).

```bash
npm install
npm run setup        # fragt den Verbindungsstring ab, erzeugt das Secret selbst
npm run db:migrate   # legt die 31 Tabellen an
npm run dev          # http://localhost:3000
```

`npm run setup` schreibt `.env.local`. Eine bestehende Datei wird nie
überschrieben. Wer den Wert lieber selbst setzt, kopiert `.env.example` nach
`.env.local`. `npm run db:migrate` ist nur nötig, wenn man die Tabellen vor dem
ersten Start anlegen will — `npm run build` erledigt das ohnehin.

Nach der Registrierung wird automatisch ein vollständiger Beispiel-Datensatz angelegt:
Standardtagesablauf, Morgen- und Abendroutine, vier Trainingspläne mit 16 Übungen,
23 vegetarische Lebensmittel, sechs Mahlzeiten, ein Ziel und erste Aufgaben.
Alle Werte sind reine Startwerte und vollständig editierbar.

### Umgebungsvariablen

| Variable                   | Pflicht | Bedeutung                                                        |
| -------------------------- | ------- | ---------------------------------------------------------------- |
| `DATABASE_URL`             | ja*     | PostgreSQL-Verbindungsstring.                                     |
| `POSTGRES_URL`             | –       | Alternative, die Vercel-Integrationen selbst setzen.              |
| `POSTGRES_URL_NON_POOLING` | –       | Direkte Verbindung, wird für Schemaänderungen bevorzugt.          |
| `SMTP_URL`                 | nein    | Ohne SMTP wird der Passwort-Link direkt in der Oberfläche gezeigt. |

\* Eine der drei Postgres-Variablen muss gesetzt sein. Ein eigenes Session-Secret
gibt es bewusst nicht: Sessions sind Zufalls-Token, die nur als SHA-256-Hash in
der Datenbank liegen. Es gäbe also nichts zu signieren.

---

## Deployment

Die App läuft auf jeder Plattform, die Next.js im Node-Modus ausführt (Vercel, Railway,
Fly.io, eigener Server).

1. PostgreSQL-Datenbank anlegen — z. B. ein neues Supabase-Projekt.
2. `DATABASE_URL` als Umgebungsvariable der Plattform setzen.
3. `npm run build && npm run start`.

Die fehlenden Tabellen legt der Build selbst an, abgesichert über eine
Datenbanksperre, damit parallele Deployments sich nicht in die Quere kommen.
Ist die Datenbank nicht erreichbar, scheitert das Deployment absichtlich,
statt eine kaputte App online zu stellen.

Bei Supabase liegt der Verbindungsstring unter
*Project Settings → Database → Connection string → URI*. Das Platzhalter-Passwort
darin muss durch das echte Datenbank-Passwort ersetzt werden.

**Notfalls von Hand:** `drizzle/schema-komplett.sql` lässt sich im Supabase
SQL Editor einfügen und ausführen. Das legt dieselben 31 Tabellen an und wird
nur gebraucht, wenn der automatische Weg blockiert ist.

HTTPS ist Voraussetzung: Session-Cookies werden in Produktion mit `secure` gesetzt und
die PWA-Installation funktioniert nur über HTTPS.

### Auf dem iPhone installieren

Seite in Safari öffnen → Teilen → *Zum Home-Bildschirm*. Die App startet danach im
Standalone-Modus ohne Browser-Leiste.

---

## Architektur

```
src/
├── app/
│   ├── (app)/          geschützte Seiten (Heute, Kalender, Aufgaben, …)
│   ├── api/            Route Handler, jeder Endpunkt auf die User-ID eingegrenzt
│   └── anmelden|registrieren|passwort-*   öffentliche Seiten
├── components/         UI-Bausteine je Bereich
├── db/                 Drizzle-Schema, Client, Migrationsrunner
├── hooks/              useResource (Laden/Neuladen), useNow (Live-Uhr)
└── lib/
    ├── planner.ts      reine Planungslogik, ohne Datenbank, voll getestet
    ├── plan-service.ts sammelt die Kandidaten eines Tages und speichert das Ergebnis
    ├── auth.ts         Sessions, Passwörter, Reset-Token
    ├── time.ts         Zeit- und Datumslogik in der Zeitzone des Nutzers
    └── seed.ts         Startdatensatz für ein neues Konto
```

### Zeit und Zeitzonen

Geplant wird in Minuten seit Mitternacht (0–1440) der lokalen Zeit des Nutzers.
Tage werden als `YYYY-MM-DD` in der eingestellten Zeitzone gespeichert. Dadurch
funktionieren tägliche und wöchentliche Wiederholungen unabhängig davon, wo der
Server steht, und Sommerzeit verschiebt keine Termine.

### Standardroutine vs. Tagesplan

Zwei getrennte Ebenen:

- **Aktivitäten + Regeln** beschreiben einen typischen Tag. Sie ändern sich nie
  automatisch.
- **Tagesplan + Zeitblöcke** sind die konkrete Planung eines Datums.

Wird ein Block heute verschoben, bleibt die Standardroutine unverändert. Über
*Als Standard übernehmen* kann die neue Zeit bewusst übernommen werden.

### Der Planungsalgorithmus

`planDay()` in `src/lib/planner.ts` arbeitet in drei Durchgängen:

1. **Fixe Einträge** (Schlaf, Termine, Arbeit) werden an ihrer Uhrzeit gesetzt.
   Überschneiden sich zwei, wird der Konflikt gemeldet — nie wird einer gelöscht.
2. **Flexible Einträge** werden nach Priorität so nah wie möglich an ihrer
   Wunschzeit platziert, mit Puffer zwischen den Aktivitäten.
3. **Zweiter Durchgang** für alles, was nicht gepasst hat: erst ohne Puffer,
   dann — nur für optionale und niedrig priorisierte Aktivitäten — auch außerhalb
   des Wunschfensters. Freizeit fällt dadurch nicht einfach unter den Tisch.

Zwei Grundsätze sind fest eingebaut:

- **Schlaf ist geschützt.** In das Schlaffenster wird nichts geplant.
- **Nicht jede Minute wird verplant.** Die eingestellte minimale freie Zeit bleibt
  erhalten; nur Schlaf, Arbeit, Mahlzeiten und Training dürfen sie antasten.

Bleibt etwas übrig, sagt die App das offen, statt den Tag zu überfüllen.

---

## Tests

```bash
npm test              # Planungslogik, braucht weder Server noch Datenbank
npm run dev           # in einem zweiten Terminal
npm run test:all      # zusätzlich API- und Randfalltests gegen die echte Datenbank
```

Die API-Tests erwarten die App unter `http://127.0.0.1:3100`; ein anderer Port geht
über `LJ_BASE_URL`.

`tests/planner.test.ts` prüft die Planungslogik: fixe Blöcke bleiben stehen,
Überschneidungen werden gemeldet statt gelöscht, die minimale freie Zeit wird
eingehalten, Freizeit wird nicht verworfen, Drag-and-drop verschiebt den Rest des
Tages korrekt.

`tests/api.test.ts` deckt die Testfälle aus der Anforderung ab: Registrierung,
Login, Logout, Passwort zurücksetzen, Einstellungen, Routinen, Aufgaben,
Tagesplanung, Verschieben, Konflikte, Training, Ernährung, Einkaufsliste, Ziele,
Statistiken, Datenpersistenz — und dass kein Konto die Daten eines anderen sieht.

---

## Datenschutz

- Passwörter werden mit bcrypt (12 Runden) gehasht.
- Sessions sind Zufalls-Token, die nur als SHA-256-Hash in der Datenbank liegen
  und sich einzeln widerrufen lassen.
- Jede Abfrage ist serverseitig auf die eingeloggte User-ID eingegrenzt.
- Nach einem Passwort-Reset werden alle bestehenden Sessions ungültig.
- Jeder API-Endpunkt validiert seine Eingaben mit Zod.
- *Meine Daten exportieren* in den Einstellungen liefert den kompletten Kontostand als JSON.

---

## Bewusste Grenzen

Damit klar ist, was die App kann und was nicht:

- **Benachrichtigungen** erscheinen nur, solange die App geöffnet ist. Echte
  Push-Nachrichten bräuchten einen Push-Dienst.
- **Bildschirmzeit** wird manuell eingetragen. Ein Browser hat keinen Zugriff auf
  die Nutzungszeiten des Betriebssystems.
- **Offline** funktioniert die Hülle der App; persönliche Daten kommen bewusst immer
  frisch vom Server, damit nie veraltete Stände angezeigt werden.
- **Passwort-Mails** werden nur mit konfiguriertem `SMTP_URL` verschickt. Ohne SMTP
  zeigt die App den Reset-Link direkt an.

## TikTok-Videos

Der Ordner [`tiktok-videos/`](tiktok-videos/README.md) enthält ein eigenständiges Werkzeug für deutsche „Was wäre wenn“-Kurzvideos. Es gehört nicht zur App.
