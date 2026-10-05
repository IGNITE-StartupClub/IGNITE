# IGNITE Startup Club Website

Website des IGNITE Startup Club (Leuphana Universität Lüneburg).
Astro 5 (SSR, `output: 'server'`) auf Vercel, React für Formulare, Tailwind v3 + SCSS, MDX/Markdown für Inhalte.
UI-Texte sind Deutsch.

## Befehle

```bash
npm install
npm run dev       # localhost:4321
npm run build     # Produktions-Build
npm run preview   # Build lokal ansehen
```

Kein Test-Setup. ESLint/Prettier manuell: `npx eslint .` / `npx prettier --write .`

## Umgebungsvariablen (`.env`, nicht committen)

| Variable | Zweck |
|---|---|
| `RESEND_API_KEY` | Transaktions-Mails (Bewerbung, Kontakt, Bestätigung) |
| `RESEND_HOLY_GRAIL` | Newsletter-Mails (separater Resend-Key) |
| `AUDIENCE_ID` | Resend-Audience für Kontakte |
| `MONGODB_URI`, `MONGODB_DB` | MongoDB |
| `ENCRYPTION_SECRET` | 32-Byte-Hex-Key (AES-256-GCM für Bewerberdaten) |
| `EMAIL_RECIPIENT_1`, `EMAIL_RECIPIENT_2` | Admin-Empfänger (2 optional) |
| `SITE_URL` | Öffentliche URL für Bestätigungslinks |
| `CRON_SECRET` | Absicherung der Cron-Endpunkte |

## Ordnerstruktur

```
src/
  components/   UI (.astro statisch, .jsx interaktiv)
  content/      Content Collections (events, projects; materials = eigenes Git-Repo)
  data/         Inhalte: staticContent.ts, teamsData.ts, Fragebogen, Events, KPIs
  layouts/      DefaultLayout, MarkdownLayout
  lib/          Hilfsfunktionen (cn)
  pages/        Routen; api/ = Server-Endpunkte (inkl. api/cron)
  styles/       globale Styles
  templates/emails/  HTML-Mails (Betreff- und HTML-Funktion je Datei)
public/         statische Assets
scripts/        einmalige Wartungsskripte
docs/           Planung und Berichte
```

## Inhalte ändern

- Texte, Navigation, Footer, FAQ: `src/data/staticContent.ts`
- Team: `src/data/teamsData.ts`
- E-Mail-Texte: `src/templates/emails/`
- News: Markdown in `src/content/projects/`, Events in `src/content/events/`

## API

`submit` (Bewerbung, verschlüsselt in MongoDB), `contact`, `newsletter` (Double-Opt-in), `confirm`, `unsubscribe`, `cron/*` (siehe `vercel.json`).

Lizenz: MIT (siehe `LICENSE`, basiert auf dem Accessible Astro Starter).
