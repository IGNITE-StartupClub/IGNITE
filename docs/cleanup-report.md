# Cleanup-Report

Stand: Aufräum-Durchlauf 1 (ohne Komponenten, Layouts, Styles, Assets; die liegen beim Foundation-Agent). Nichts committet. `npm run build` läuft durch.

## Gelöscht

Alle getrackten Dateien per `git rm`, also über Git wiederherstellbar.

| Datei | Grund |
|---|---|
| `ARCHITECTURE.md` | Veraltet (Strapi-Migrationsnotizen); Nützliches steht jetzt im neuen `README.md` |
| `readme02.md` | Unveränderte README des Accessible-Astro-Starters |
| `netlify.toml`, `.netlify/` | Deployment läuft auf Vercel |
| `backup-job-positions.json` | Strapi-Backup, nirgends referenziert |
| `cp_logo.svg` | Nirgends referenziert |
| `everything-claude-code/` | Eingebetteter Git-Klon (Gitlink ohne `.gitmodules`), nicht Teil der Website. Working Tree war sauber und auf `origin/main`, also bei Bedarf neu klonbar |
| `dist/`, alle `.DS_Store` (außer in `src/content/materials`) | Build- bzw. OS-Output |
| `src/data/stakeholders.toon.ts` | Keine Importer (die Stakeholder-Map hat ihre Daten inline) |
| `src/pages/mdx-page copy.mdx` | Starter-Demo |
| `src/pages/accessible-components.astro` | Starter-Demo, nicht verlinkt |
| `src/pages/api/newsletter01.ts` | Alte Version von `newsletter.ts`, kein Aufrufer |
| `src/pages/api/subscribe.ts` | Kein `fetch('/api/subscribe')` in `src/`, nicht in Crons. Das Formular nutzt `/api/newsletter` |
| `src/pages/api/contact-config.ts` | Kein Aufrufer |
| `src/pages/api/questionnaire-config.ts` | Kein Aufrufer |
| `src/lib/confirm.ts` | Nur ein auskommentierter Import |
| `public/Toy_Rocket.glb`, `public/logos/placeholder.svg` | Unreferenziert bzw. nur von der gelöschten `stakeholders.toon.ts` genutzt |

Neu: `README.md` (Zweck, Befehle, Env-Variablen, Ordner). `.gitignore` ergänzt um `.vercel`.

## Behalten, aber fragwürdig (Entscheidung offen)

- **Doppelte Teamdaten**: `src/data/teams.js` (importiert von `Questionnaire.jsx`, `mitmachen.astro`) und `src/data/teamsData.ts` (importiert von `team.astro`). Beide leben; erst nach dem Komponenten-Umbau zusammenführen.
- **Fragebogen doppelt**: `questionnaireConfig.ts` wird von `Questionnaire.jsx` genutzt. `questionnaire.md` und `questionnaireParser.js` werden von `api/submit.ts` genutzt (Fragelabels). Zwei Quellen für dieselben Fragen können auseinanderlaufen. Empfehlung: `submit.ts` auf `questionnaireConfig.ts` umstellen und Markdown plus Parser löschen.
- **Seiten ohne Link** (nicht gelöscht):
  - `about.astro`: nicht verlinkt (Nav-Eintrag ist auskommentiert).
  - `stakeholder-journey.astro`: nicht verlinkt.
  - `feedback.astro`: nicht verlinkt, wird aber vermutlich per direktem Link/QR genutzt. Die API `/api/feedback` ist live.
  - `kontakt.astro`, `mitmachen.astro`, `team.astro`: nicht in der Navigation. `mitmachen` ist über die Hero-CTA verlinkt, `kontakt` über den Footer. `team` ist nur direkt erreichbar.
  - `peer-to-peer.mdx`, `IGNITEWorkshops.mdx`, `subscribe.astro`: im Menü (Events und Newsletter).
  - `impressum`, `datenschutz`: im Footer.
- **Live-API-Routen**: `newsletter` (Formulare, `feedback.ts`), `confirm`, `unsubscribe`, `contact`, `feedback`, `submit`, `cron/*` (in `vercel.json`).
- `package.json` (nicht angefasst): Script `migrate:strapi` zeigt auf eine nicht existierende Datei; Feld `homepage` verweist auf die Starter-Demo (netlify.app). Beides entfernen, sobald `package.json` frei ist.
- `LICENSE` (MIT, Mark Teekman, Starter): behalten. Der MIT-Hinweis muss bei Weiterverwendung des Starter-Codes erhalten bleiben.
- `scripts/export-applicants.mjs`: Einmal-Skript, behalten (nicht referenziert, aber bewusst als Wartungswerkzeug).
- `src/types/stakeholder-map.ts`: wird von der Stakeholder-Map genutzt, ggf. nach `stakeholder-journey` auflösen.

## Öffentliche Assets

Behalten: Favicons, Manifest, `og-image.jpg`, `team-logos/*` (Dateiname wird dynamisch aus dem Teamnamen gebaut, daher nicht per grep belegbar), `news/*` (Projekt-Frontmatter), `team/silas.jpg`, `img/advisory/*`.

Unreferenziert, aber bewusst nicht gelöscht (könnten im Redesign gebraucht werden):
- `public/img/mitmachen-hero.jpg`
- `public/news/schirmherrschaft.png`
- `public/img/partners/hult.svg`, `starthh.png`; `utopia.svg` und `cheftreff.png` werden nur dem Namen nach erwähnt

## Nicht getrackt / Entscheidung nötig

- Keine ungetrackten Dateien außer `docs/` und `src/styles/` (Foundation-Agent). Nichts außerhalb davon gelöscht.
- `src/content/to_publish/START_Collab.md`: nicht in `content.config.mjs` registriert (Collections: `projects`, `events`, `materials`), also ein unveröffentlichter Entwurf. Inhaltlich ähnlich wie der Eintrag `projects/StartBesuch.md`. Entweder nach `projects/` verschieben oder löschen.
- `.env` unangetastet.

## Ordnerstruktur (Ziel)

```
src/
  components/
    layout/    Header, Footer, MobileNav, ThemeToggle
    sections/  Startseiten-Sektionen (eine Datei pro Sektion)
    ui/        Button, Card, Section (Primitive)
    forms/     React-Formulare (.jsx)
  content/     Content Collections (md)
  data/        staticContent.ts + kleine typisierte Datendateien
  layouts/
  lib/
  pages/       Routen + api/
  styles/      global.css
  templates/emails/
public/
docs/
```

### Geplante Komponenten-Moves (nach Abschluss des Foundation-Agents)

| Aktuell (`src/components/`) | Ziel |
|---|---|
| `Header.astro`, `Footer.astro`, `Navigation.astro`, `ResponsiveToggle.astro`, `DarkMode.astro`, `SkipLinks.astro` | `layout/` (von Foundation teils schon ersetzt) |
| `Hero.astro`, `Feature.astro`, `news.astro`, `partners.astro`, `OpenTeams.jsx`, `KPIDashboard.jsx` | `sections/` |
| `Button.astro`, `ui/card-18.tsx`, `ui/button.tsx` | `ui/` |
| `Contact.jsx`, `FeedbackForm.jsx`, `NewsletterForm.jsx`, `SubscribeForm.jsx`, `Questionnaire.jsx` | `forms/` |
| `stakeholder-map/` | bei `pages/stakeholder-journey.astro` belassen oder löschen, falls die Seite entfällt |
| `LiquidEther/`, `Orb/`, `SplitText/`, `EventSearch.jsx`, `Counter.astro` | Löschung laut `redesign-plan.md` (Foundation-Agent) |
| `SiteMeta.astro`, `Logo.astro` | `layout/` |

Pfade in Imports (`../components/...`) müssen beim Verschieben mitgezogen werden (Pages, Layouts).

## Entscheidungen Durchlauf 2 (Unterseiten, 2026-10-04)

- **Gelöscht**: `src/content/to_publish/START_Collab.md` (Duplikat von `projects/StartBesuch.md`).
- **Archiviert** (`archive/`, außerhalb von `src/`, siehe `archive/README.md`): `team.astro`, `about.astro`, `stakeholder-journey.astro`, `stakeholder-map/`, `LiquidEther/`, `teamsData.ts`, `types/stakeholder-map.ts`. Navigationseintrag `/about` entfernt.
- **Feedback-Feature entfernt**: `feedback.astro`, `api/feedback.ts`, `FeedbackForm.jsx`. `README.md` bereinigt. Offen: `src/data/eventsData.ts` (nur für das Feedback-Formular, jetzt ohne Importer), Mongo-Collection `feedbacks` und `'feedbacks'` in `api/cron/db-report.ts`, Env-Variable `FEEDBACK_DIGEST_SECRET`.
- **Teamdaten**: `teams.js` heißt jetzt `openTeams.ts` (typisiert, offene Teams für Bewerbung und Mitmachen-Seite). `teamsData.ts` (Mitglieder) liegt im Archiv.
- **Formulare** liegen in `src/components/forms/` mit gemeinsamem `forms.css`.
- **Gelöscht**: `Orb/`, `ui/card-18.tsx`, `NewsGrid.jsx`, `MaterialsGrid.jsx`, `MaterialienPreview.jsx`, `OpenTeams.jsx`, `Feature.astro`, `CallToAction.astro`, Legacy-SCSS (`_article`, `_button`, `_color`, `_container`, `_list`, `_space-content`, `_breakpoint`).
