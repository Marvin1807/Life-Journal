# Life Journal

Eine cloudbasierte Personal-Life-Management-Web-App: Tagesplanung, Routinen, Aufgaben,
Kalender, Fitness, Ernährung, Ziele und Statistiken in einer Anwendung.

Mobile-first für das iPhone gebaut, installierbar als PWA, mit echter Datenbank,
echter Authentifizierung und persistenter Cloud-Speicherung.

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

`npm run setup` schreibt `.env.local` und würfelt `AUTH_SECRET` zufällig aus.
Eine bestehende Datei wird nie überschrieben. Wer die Werte lieber selbst
setzt, kopiert `.env.example` nach `.env.local`.

Nach der Registrierung wird automatisch ein vollständiger Beispiel-Datensatz angelegt:
Standardtagesablauf, Morgen- und Abendroutine, vier Trainingspläne mit 16 Übungen,
23 vegetarische Lebensmittel, sechs Mahlzeiten, ein Ziel und erste Aufgaben.
Alle Werte sind reine Startwerte und vollständig editierbar.

### Umgebungsvariablen

| Variable       | Pflicht | Bedeutung                                                       |
| -------------- | ------- | --------------------------------------------------------------- |
| `DATABASE_URL` | ja      | PostgreSQL-Verbindungsstring. Bei Supabase den Pooler verwenden. |
| `AUTH_SECRET`  | ja      | Mindestens 32 zufällige Zeichen.                                 |
| `SMTP_URL`     | nein    | Ohne SMTP wird der Passwort-Link direkt in der Oberfläche angezeigt. |

---

## Deployment

Die App läuft auf jeder Plattform, die Next.js im Node-Modus ausführt (Vercel, Railway,
Fly.io, eigener Server).

1. PostgreSQL-Datenbank anlegen — z. B. ein neues Supabase-Projekt.
2. `DATABASE_URL` und `AUTH_SECRET` als Umgebungsvariablen der Plattform setzen.
3. `npm run db:migrate` einmalig gegen die Produktionsdatenbank ausführen —
   lokal reicht `DATABASE_URL=<produktion> npm run db:migrate`.
4. `npm run build && npm run start`.

Bei Supabase liegt der Verbindungsstring unter
*Project Settings → Database → Connection string → URI*. Das Platzhalter-Passwort
darin muss durch das echte Datenbank-Passwort ersetzt werden.

**Ohne Node auf dem eigenen Rechner:** Statt Schritt 3 den Inhalt von
`drizzle/schema-komplett.sql` in den Supabase SQL Editor einfügen und ausführen.
Das legt dieselben 31 Tabellen an. Danach nicht mehr `npm run db:migrate`
verwenden, sonst kollidieren die Migrationen.

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
- Sessions liegen als SHA-256-Hash in der Datenbank und lassen sich einzeln widerrufen.
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
