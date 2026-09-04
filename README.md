# Trainings-Tracker

React-Native-App (Expo) zum Tracken von Essen und Training – vorbelegt mit den Werten aus
`trainingsplan_badminton.md`, aber **alle Werte sind änderbar**.

## Starten

```
npm install
npx expo start
```

Dann in der **Expo Go** App auf dem Handy den QR-Code scannen
(iOS: Kamera-App, Android: Expo Go → „Scan QR code“).
Handy und Rechner müssen im selben WLAN sein.

Alternativ: `npm run ios`, `npm run android`, `npm run web`.

## Als echte App aufs iPhone (EAS Build)

Danach läuft die App eigenständig mit eigenem Icon – ohne Laptop, ohne Expo Go.

**Voraussetzung:** kostenloser Expo-Account (expo.dev) **und** ein kostenpflichtiger
Apple-Developer-Account (99 €/Jahr). Apple erlaubt das Installieren eigener Apps auf
einem echten iPhone nur mit Developer-Mitgliedschaft.

```bash
npx eas login                                  # Expo-Account
npx eas init                                   # Projekt verknüpfen
npx eas device:create                          # iPhone registrieren (QR auf dem Handy öffnen)
npx eas build --platform ios --profile preview # Build in der Cloud, ca. 10–20 Min
```

Am Ende zeigt EAS einen QR-Code / Link – auf dem iPhone öffnen, installieren, fertig.

Hinweise:
- Das Ad-hoc-Profil ist ein Jahr gültig, danach einmal neu bauen.
- Ein neuer Build über dieselbe Bundle-ID (`io.github.jolina2002.trainingstracker`)
  behält die erfassten Daten.
- Neue Geräte müssen vor dem Build mit `eas device:create` registriert werden.

### Ohne Apple-Developer-Account

Dann geht die App über EAS Update in die Expo-Cloud und läuft ohne Laptop –
allerdings innerhalb von Expo Go statt mit eigenem Icon:

```bash
npx eas update --branch preview
```

## Live: die App auf dem iPhone

**https://jolina2002.github.io/trainings-tracker/**

In **Safari** öffnen (nur Safari kann installieren) → Teilen-Menü → **„Zum Home-Bildschirm"**.
Danach: eigenes Icon, Vollbild ohne Safari-Leiste, offline nutzbar.

Nach Codeänderungen neu veröffentlichen:

```bash
./scripts/deploy-pages.sh git@github.com:Jolina2002/trainings-tracker.git
```

Das Skript baut die Web-App und schiebt sie in den `gh-pages`-Branch. Die Commit-Identität
wird dabei lokal auf die GitHub-noreply-Adresse gesetzt, damit keine dienstliche
Mailadresse in dem öffentlichen Repo landet.

**Deine Daten** liegen ausschließlich im Speicher deines iPhones und werden nirgendwohin
übertragen. Unter „Plan → Daten sichern" kannst du sie als Text exportieren und
wiederherstellen – nutz das ab und zu, Safari räumt lokalen Speicher unter Umständen auf.

## Web-App selbst bauen

```bash
npx expo export -p web && node scripts/make-pwa.mjs
```

Ergebnis:

| Datei | Zweck |
|---|---|
| `dist/` | installierbare Web-App: manifest, Service Worker, Icons |
| `dist/standalone.html` | alles in einer Datei (452 KB), z. B. für Artifact-Upload |
| `dist/artifact.html` | dieselbe Datei ohne `<html>`/`<head>` |

Für die echte Homescreen-App muss `dist/` unter einer https-Adresse liegen –
jeder statische Host reicht (GitHub Pages, Netlify Drop, Cloudflare Pages):

1. Inhalt von `dist/` hochladen
2. Adresse auf dem iPhone in **Safari** öffnen (nicht Chrome – nur Safari kann installieren)
3. Teilen-Menü → **„Zum Home-Bildschirm"**

Danach: eigenes Icon, Vollbild ohne Safari-Leiste, offline nutzbar
(Service Worker cacht die App beim ersten Öffnen).

**Daten:** liegen im lokalen Speicher des Browsers. Unter „Plan → Daten sichern"
kannst du alles als Text exportieren und wiederherstellen – nutz das ab und zu,
Safari räumt lokalen Speicher unter Umständen auf.

## Apple Health per Kurzbefehl

Apple Health hat keine Web-Schnittstelle – eine Web-App kommt nicht heran. Ein
Kurzbefehl darf Health aber lesen und die Werte in die Zwischenablage legen.

**Kurzbefehl anlegen** (App „Kurzbefehle" → neuer Kurzbefehl):

1. „Gesundheitsdaten abrufen" (*Find Health Samples*) – Typ **Schritte**,
   sortiert nach Startdatum, Filter „Datum ist heute"
2. „Statistik berechnen" (*Calculate Statistics*) → **Summe**
3. „Gesundheitsdaten abrufen" – Typ **Gewicht**, absteigend, Limit 1
4. „Text"-Aktion mit den beiden Ergebnissen:
   ```
   schritte=[Summe]
   gewicht=[Gewicht]
   ```
5. „In die Zwischenablage kopieren"

Optional als Automation täglich abends laufen lassen.

**In der App:** Plan → Health-Import → einfügen → „Werte übernehmen".

Der Import ist tolerant: `=` oder `:`, Zeilen oder Semikolon, deutsches
Dezimalkomma, Groß-/Kleinschreibung egal. Erkannt werden `schritte`, `gewicht`,
`wasser` (`2,5 l` und `2500 ml`) und `datum` (`04.09.2026` oder `2026-09-04`,
Standard ist heute).

## Aufbau

| Tab | Inhalt |
|---|---|
| **Heute** | Kalorien & Makros, Trinkmenge, Schritte, Gewicht, Training des Tages |
| **Essen** | Mahlzeiten protokollieren – aus der Lebensmittel-Bibliothek oder frei eingegeben |
| **Training** | Wochenansicht, Übungen abhaken, Sätze/Gewicht/RPE/Notiz protokollieren |
| **Plan** | Alle Einstellungen: Profil & Bedarfsrechner, Tagesziele, Wochentag-Ziele, Wochenplan, Trainingseinheiten, Mahlzeiten, Lebensmittel |

## Daten

Alles liegt lokal auf dem Gerät (AsyncStorage), kein Backend, kein Account.
„Plan → Zurücksetzen“ stellt die Startwerte wieder her und löscht alle Einträge.

## Code

```
src/
  types.ts      Datenmodell
  defaults.ts   Startwerte aus dem Trainingsplan
  store.tsx     Context-Store + Persistenz
  calc.ts       Makro-Summen
  util.ts       Datum, Zahlen, BMR
  theme.ts      Farben
  ui.tsx        UI-Bausteine (Card, Bar, Sheet, Felder …)
  screens/      Today, Food, Training, Settings
```
