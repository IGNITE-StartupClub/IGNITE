# IGNITE Redesign: Plan

Erstellt mit Opus 5.5 (Planung). Umsetzung ausschließlich durch Sonnet-5.5-Agenten.
Grundlage: Landing-Page-Skill (ausgewählte Teile), Referenz theresidency.com (Screenshots), bestehende Codebase.

## 1. Brief (kurz)

- **Was:** IGNITE, studentische Gründer:innen-Community an der Leuphana Lüneburg.
- **Für wen:** ambitionierte Studierende (Mitglieder), zweitrangig Partner, Advisors, Sponsoren.
- **Die eine Aktion:** `Mitmachen` (/mitmachen). Alles andere ist sekundär.
- **Sprache:** Deutsch.
- **Ziel:** gleicher Vibe (dunkel, ambitioniert), aber deutlich ruhiger, sauberer, professioneller. Dunkel mit IGNITE-Lila als einziger Kernfarbe.

## 2. Direction

**Charakter:** Editorial, ruhig, selbstbewusst. Wie theresidency.com, aber invertiert auf Dunkel.

**Was wir von theresidency.com übernehmen:**
- Serif-Display-Headlines mit **einem kursiven Wort** als Betonung („Dein *Gründungsfunke* an der Leuphana“).
- Sans-Serif für Body, große Lesegröße (18px mobile), großzügiger Zeilenabstand.
- Sehr viel Whitespace, eine Idee pro Screen.
- FAQ als Liste mit Haarlinien und `+`/`×`, kein Kasten.
- Eine Card-Sprache (Residents-Cards): Bild klein links, Name in Serif, Rolle kursiv, Text darunter.
- Footer mit Wortmarke, kurzem Claim, Linkliste, großer Wortmarke am Ende.
- Header: Logo links, Hamburger rechts (mobil), sticky mit leichtem Hintergrund.

**Was es nicht ist:** keine Gradients, keine Blobs/Background-Dots, kein LiquidEther/Orb/3D, kein Pink/zweiter Akzent, keine Scroll-Mouse, keine Typewriter-/Counter-Animationen, keine Icon-in-Box-Cards, keine Eyebrows, kein `tracking-wide`.

**Farben (70/20/10, dunkel + Lila):** Update auf Wunsch: nicht schwarz-weiß, Lila bleibt Kernfarbe.
| Token | Wert | Zweck |
|---|---|---|
| `--color-bg` | `hsl(255 10% 5%)` | Seite (70%), leicht violett getöntes Schwarz |
| `--color-bg-subtle` | `hsl(255 9% 9%)` | alternierende Sections, Cards |
| `--color-bg-inverted` | `hsl(255 30% 96%)` | eine helle Section (Final CTA) |
| `--color-fg` | `hsl(255 20% 96%)` | Text |
| `--color-fg-muted` / `--color-fg-subtle` | `hsl(255 8% 68%)` / `hsl(255 6% 58%)` | Sekundärtext, Meta (AA) |
| `--color-border` | `hsl(255 8% 17%)` | Haarlinien |
| `--color-primary` | `#5227FF` | Primary-Button (10%), weißer Text (~6.8:1) |
| `--color-accent-text` | `#B19EEF` | Links, kursives Betonungswort, Fokusring |
| `--color-danger` / `--color-success` | | nur Formularfeedback |

Eine Akzentfarbe: das alte Magenta (`#8C3974`) wird auf Lila gemappt. Keine Verläufe.

**Typografie:** Display `Newsreader Variable` (inkl. Italic), Body `Inter Variable` (Nutzerwunsch: Inter bleibt). Self-hosted via `@fontsource-variable/*`, kein Google-Fonts-Link. Skala 1.333, fluid mit `clamp()`. Display `leading-[1.05] tracking-tight`, Body `leading-relaxed`. Gewichte 400/500/600/700.

**Radius:** ein Wert für Cards (`1rem`), Buttons `999px` (Pill-Button) ODER `0.75rem`, einmal festlegen und überall gleich.

**Motion:** nur Hover-Transitions (150ms, Farbe/BG), Mobile-Nav-Overlay. `prefers-reduced-motion` global.

## 3. Ausgewählte Skill-Regeln (gelten für jede Zeile)

- Jede Section ist eine Komponente (`src/components/sections/*.astro`), `index.astro` ist nur eine Liste von Imports.
- Jede Komponente: `interface Props`, Defaults, kurzer Doc-Kommentar oben (Zweck, Props, Datenquelle).
- Copy kommt aus `src/data/staticContent.ts`, nie aus Komponenten.
- Tokens only: keine `text-[#...]`, keine `mt-[37px]`.
- **Eine** Card-Komponente (`Card.astro`), **ein** `Button.astro` mit genau drei Varianten (`primary`, `secondary`, `ghost`) und allen States (hover, active, focus-visible, disabled).
- Mobile first: Basis-Klassen = Mobile, `md:`/`lg:` ergänzen.
- Komponenten > 200 Zeilen splitten.
- Keine Em-Dashes in Copy, keine Eyebrows, keine erfundenen Zahlen/Logos/Testimonials.
- Native vor Custom: FAQ mit `<details>`, keine Accordion-Lib.
- Body-Copy linksbündig, max ~65ch. Headlines in der Länge variieren. Sections wechseln Ausrichtung/Fläche.
- WCAG 2.2 AA: Fokusring sichtbar, Touch-Targets ≥ 44px, Skip-Link, Mobile-Nav mit Escape/Focus-Trap/Scroll-Lock.

**Bewusste Abweichung vom Skill:** React bleibt für interaktive Formulare (Mitmachen, Kontakt, Newsletter, Feedback, Questionnaire), weil diese mit API-Routen verdrahtet sind. Rein dekorative React-Komponenten (LiquidEther, Orb, SplitText, three/r3f) fliegen raus. Tailwind bleibt v3 (kein Upgrade im Redesign).

## 4. Startseite: Section Map

> **Ersetzt:** Die gültige Section-Reihenfolge, Typo- und Whitespace-Werte stehen in `docs/theresidency-analysis.md` §10. Die Tabelle unten ist die erste Fassung.

**Hell/Dunkel-Toggle:** Semantische Tokens doppelt (`[data-theme=dark]` Standard, `[data-theme=light]`), No-Flash-Script im `<head>`, `ThemeToggle.astro` im Header, Wahl in `localStorage`, Fallback `prefers-color-scheme`.


| # | Section | Job | Datei |
|---|---|---|---|
| 1 | Hero | Versprechen + `Mitmachen`. Serif-Headline mit kursivem Wort, eine Zeile Sub, ein Button. Zentriert, viel Luft. | `sections/Hero.astro` |
| 2 | Intro | „IGNITE existiert, um …“ Großer Serif-Statement-Satz links + 2–3 kurze Absätze (aus FAQ „Was ist IGNITE“). | `sections/Intro.astro` |
| 3 | Was wir machen | Features als nummerierte Liste mit Haarlinien (01–06), 2-spaltig ab `md`, keine Icons, keine Box-Grid. | `sections/Offerings.astro` |
| 4 | Wirkung | KPI-Zahlen aus `kpiData.ts` als ruhige Zahlenreihe (Serif-Zahl, Sans-Label), keine Count-Animation. | `sections/Impact.astro` |
| 5 | Advisory Board | Bestehende Daten, neu im Card-Stil (Foto klein, Name Serif, Rolle kursiv). | `sections/Advisors.astro` |
| 6 | Neuigkeiten | 3 neueste News aus Content-Collection, eine Card-Sprache, Link „Alle Neuigkeiten“. | `sections/LatestNews.astro` |
| 7 | FAQ | `Fragen?` Serif-Headline, `<details>`-Liste mit Haarlinien. | `sections/Faq.astro` |
| 8 | Final CTA | Invertierte (helle) Fläche, Headline + `Mitmachen`. | `sections/FinalCta.astro` |
| – | Footer | Wortmarke, Claim, Linkgruppen (Navigation, Rechtliches, Social), Newsletter optional, Jahr dynamisch, große Wortmarke unten. | `layout/Footer.astro` |

## 5. Code-Aufräumen

- `DefaultLayout.astro`: Background-Dots + Keyframes raus, Google-Fonts-Link raus, globale Styles nach `src/styles/global.css`.
- SCSS-Basis (`src/assets/scss/base/*`): Farbtokens auf die neue Palette (dunkel + Lila) mappen, damit Unterseiten automatisch mitziehen; Ungenutztes löschen.
- Löschen, wenn nirgends importiert (per grep verifizieren): `LiquidEther/`, `Orb/`, `SplitText/`, `EventSearch.jsx`, `Counter.astro`, `ContentMedia.astro`, `partners.astro`, `ui/card-18.tsx`, `pages/accessible-components.astro`, `pages/mdx-page copy.mdx`, `public/Toy_Rocket.glb`, `scripts/migrate-to-strapi.js`.
- Ungenutzte Dependencies entfernen (`three`, `@react-three/*`, `ogl`, `gsap`, `@gsap/react`, `framer-motion`, `crypto-browserify`, `astro-sitemap` (doppelt zu `@astrojs/sitemap`), `@astrojs/partytown`, `astro-compress`, `nodemailer`, `uuid`) **nur** wenn grep 0 Treffer liefert.
- `package.json`: Name/Beschreibung/Repo auf IGNITE.
- `src/content/materials` ist ein eigenes Git-Repo: **nicht anfassen.**
- API-Routen, E-Mail-Templates, Env-Variablen: **nicht anfassen.**

## 6. Umsetzung (Sonnet 5.5)

1. **Foundation** (ein Agent, sequentiell zuerst): Tokens, Fonts, Layout, `Button`, `Card`, `Section`, Header/Mobile-Nav, Footer, Dead-Code + Deps, Build grün.
2. **Parallel danach:**
   - **Startseite:** Sections 1–8 nach Section Map.
   - **Unterseiten:** mitmachen, team, about, kontakt, news, materialien, subscribe, feedback, Workshops/Peer-to-Peer/Legal (MDX via MarkdownLayout), 404, Formular-Styles auf die neue Palette.
3. **QA** (ein Agent): Build, Anti-Slop-Greps, Screenshots 390px + 1280px, keine horizontale Overflow, Tastatur/Fokus, Mobile-Nav.

Am Ende: CLAUDE.md „Project rules“ um die neuen Konventionen ergänzen.

## 7. Kurskorrektur (04.10.2026, Nutzerfeedback)

- **Inter** ist Hauptschrift, auch für Headlines. Serif (Newsreader Italic) nur für die kursiven Akzentwörter.
- Mehr IGNITE-CI zurück: mehr Lila, Gradient-Akzente wo sie vorher Sinn hatten.
- Altes Card-Design (Gradient-Border, Tiefe) zurück in die eine `Card.astro`.
- Neuigkeiten wie vorher (NewsGrid/card-18), Advisory-Board-Karten im alten Stil, 2-spaltig, cleaner.
- Logo: exakt das Original (Inter, animiert). Nie verändern.
- Mitmachen-Button: alter Gradient-Outline-Button als `secondary`-Variante.
- Navbar: der Nutzer liefert eine eigene Komponente.
- Referenz für den Vibe: git `HEAD` (= origin/main, Live-Seite).
- Bewusste Abweichung vom Anti-Slop-Regelwerk (Gradients) auf ausdrücklichen Nutzerwunsch.
