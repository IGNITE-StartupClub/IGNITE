# Iteration 2: Vibe, Hero, Navigation

Stand 04.10.2026, Art Direction von Opus nach Screenshot-Review (1280px und 390px, Light Theme).

## Diagnose: warum es nicht überzeugt

1. **Hero ohne Spannung.** Drei zentrierte Textzeilen untereinander (`IGNITE`, Claim, Subline) plus ein Button, darunter 200px Leere. Zwei Headlines konkurrieren (`IGNITE` als H1 und der Claim). Kein Bild, keine Bewegung, kein Beweis, dass es diese Community wirklich gibt. Wirkt wie ein Template.
2. **Navigation unentschlossen.** „Startseite“ ist überflüssig (das Logo führt nach Hause), auf Desktop erscheint zusätzlich ein Hamburger, „Mitmachen“ ist ein gestrichelter Textlink statt der Hauptaktion. Keine Haltung.
3. **Kursiv-Serif überall.** Jede Card-Überschrift hat ein lila Kursivwort. Der Akzent ist dadurch kein Akzent mehr.
4. **Uniformes 3×2-Card-Raster.** Sechs gleich große Kästen mit dicken lila Rahmen, winziger Text, viel Leerfläche unten. Das ist das generischste Muster, das es gibt.
5. **Zu wenig IGNITE.** Es gibt echte Event-Fotos (`public/news/`), echte Zahlen (`kpiData.ts`), ein starkes Logo (Rakete im Kreis) und eine Farbe (#311763 / #5227FF). Nichts davon trägt den ersten Screen.

## Richtung: „Funke“

Dunkel als Bühne (Dark ist Standard), Lila als Energie, echte Fotos als Beweis. Selbstbewusst, studentisch, nicht corporate. theresidency-Disziplin bleibt: wenige Entscheidungen, konsequent.

### Navigation (komplett neu)
- **Desktop:** schwebende Pill-Navigation, zentriert, `max-w-wide`, 12 bis 16px vom oberen Rand, abgerundet (full), Hintergrund `bg` mit ~80% Deckkraft und Blur, Haarlinie. Links: Logo. Mitte: Neuigkeiten, Events (Dropdown: IGNITE Workshops, Peer-to-Peer), Materialien, Newsletter. Rechts: Theme-Toggle (Icon), **Mitmachen als primärer Pill-Button** (lila Fill oder Gradient). Kein „Startseite“, kein Hamburger ab `lg`.
- Beim Scrollen: wird minimal kompakter (Höhe), sonst keine Show.
- **Mobil:** Logo links, rechts kleiner Mitmachen-Button + Menü-Button. Menü = Vollbild-Overlay auf `bg`, große Links (text-display-sm, Inter 700), untereinander mit Haarlinien, unten Theme-Toggle + Social-Links. Escape, Fokusfalle, Scroll-Lock, Fokus zurück.
- Aktive Seite sichtbar markiert (`aria-current="page"`).

### Hero (komplett neu)
- **Links ausgerichtet**, zweispaltig ab `lg`: links Text, rechts Bild.
- **Eine H1**, groß (text-display-lg, Inter 800, tight): „Dein *Gründungsfunke* an der Leuphana.“ Das Schlüsselwort mit dem lila Verlauf (`.text-gradient`), nicht Serif. Das Wort `IGNITE` muss nicht als zweite Headline stehen, das Logo sagt es.
- Subline 1 bis 2 Zeilen (text-lead, fg-muted): Gründer*innen-Community für Studierende aller Fachrichtungen.
- **Zwei CTAs:** Mitmachen (primär, lila) + „Was wir machen“ (Ghost, Anker zu #angebot).
- **Beweis-Zeile** direkt darunter: die 4 echten KPIs aus `kpiData.ts` als kleine Zahlenreihe (Zahl fett, Label muted), ohne Cards, ohne Count-up.
- **Rechts:** Collage aus 3 echten Event-Fotos aus `public/news/` (z.B. kickoff, cheftreff, openweekly), leicht versetzt/überlappend, abgerundet (`rounded-card`), dezenter lila Rahmen oder Schatten. Mobil: ein Foto in voller Breite unter dem Text oder eine horizontale Reihe. Bilder über `astro:assets` oder mit width/height + `loading="eager"` nur für das erste.
- Hero-Höhe: ca. 85 bis 90vh Desktop, kein leerer Raum darunter.
- Optional dezente Bewegung: Fotos faden einmal ein (200ms, gestaffelt), `prefers-reduced-motion` respektiert. Keine Partikel, keine Blobs.

### Typografie-Regel
- Inter überall. **Serif-Kursiv nur noch an höchstens 3 Stellen auf der ganzen Startseite** (z.B. „Was dich *erwartet*“, „*Fragen?*“, Final CTA). Aus Card-Titeln komplett raus.
- Gradient-Text höchstens 2× (Hero-Schlüsselwort, eine Zahl/Headline).

### „Was dich erwartet“: Bento statt Raster
- Bento-Grid ab `md`: Workshops & Events groß (2 Spalten, mit echtem Foto), Hackathon groß oder hoch, Rest kleiner. Mobil: einfache Liste.
- Card-Rahmen dünner (1 bis 1.5px Gradient oder Haarlinie, Gradient nur bei Hover), Text größer (base, nicht sm).
- Icons in lila Kreisen (CI) bleiben.

### Restliche Sections
- Rhythmus: Hero (dark) → Bento (subtle) → Warum/Statement (default, links, groß) → Advisory (default) → News (subtle) → FAQ (default) → Final CTA (brand #311763).
- „Für wen“-Card und Impact-Section entfallen als eigene Sections, wenn die KPIs in den Hero gewandert sind (Impact) und „Für wen“ in den Warum-Text passt. Weniger Sections, mehr Wirkung.

### Qualitätsschranke
- Screenshots 390 und 1280 in **Dark und Light** nach jedem großen Schritt, selbst prüfen, max. 3 Iterationsschleifen, dann abgeben.

## Umgesetzt (Iteration 2)

- **Navigation neu:** `Header.astro` ist eine schwebende Pill (fixed, Blur, Haarlinie, wird beim Scrollen kompakter), Links Neuigkeiten, Events (Dropdown), Materialien, Newsletter, Theme-Toggle und Mitmachen als primärer Pill-Button (`Button size="sm"`). Kein Hamburger ab `lg`, `aria-current="page"` mit Punkt-Markierung. `MobileNav.astro` ist ein Vollbild-Overlay (große Inter-700-Links, Haarlinien, unten Socials und Theme-Toggle) mit Escape, Fokusfalle, Scroll-Lock und Fokus-Rückgabe. `main` hat `padding-top: var(--header-height)`, `html` hat `scroll-padding-top`.
- **Hero neu:** linksbündig, zweispaltig ab `lg`. Eine H1 mit Gradient-Schlüsselwort (`--text-hero`), zwei CTAs, KPI-Zeile aus `kpiData`, rechts Foto-Collage (Kick-off, ChefTreff, Open Weekly). Fotos sind optimierte Kopien in `src/assets/photos/` (astro:assets), einmaliges gestaffeltes Einblenden.
- **Startseite:** Hero, Bento (`id="angebot"`, Layout über `features[].layout`), Warum (mit "Für wen"), Advisory, News, FAQ, Final CTA. `Audience` und `Impact` entfernt. Serif-Kursiv 3x, Gradient-Text 2x.
- **Card:** Haarlinie, Gradient-Rand nur bei Hover, größere Texte. **Button:** Variante `outline`, Größe `sm`.
- **Footer:** ruhige Spalten, Newsletter, Social-Icons unten, Riesen-Wordmark entfernt.

## Iteration 3: theresidency-Ruhe

- **Rhythmus:** Section-Abstände moderat erhöht (md 7rem/9rem mobil/Desktop), h2 Gewicht 550, h1 700, Tracking -0.035em, Lead bis 1.5rem.
- **Hero reduziert:** zentrierte H1 (Gradient-Schlüsselwort), eine Subline, ein CTA, darunter EIN großes Bild (`rounded-card`). Motiv über `homepage.heroImage {src, alt}` in `staticContent.ts` austauschbar (Dateiname in `src/assets/photos` oder öffentliche URL). KPI-Zeile in die Warum-Section verschoben.
- **Warum:** Statement-Headline, drei Absätze mit Serif-Kursiv-Phrase (`.em-inline`), eine "Für wen"-Card mit drei Zeilen ohne Icons.
- **Advisory:** Resident-Card (quadratisches Foto 8px, Name groß, Rolle in Serif-Kursiv, Bio, unterstrichener LinkedIn-Link), Join-Card gestrichelt und ruhig.
- **FAQ:** zentriertes "Fragen?", volle Breite (max 4xl), Fragen bis 1.5rem, `+` wird `×`. **Final CTA:** flach, zentriert, "Werde *Teil* von IGNITE".
- **Regel:** der Markenname "IGNITE" steht nie in `<em>` (Serif); Kommentar in `global.css`.
- **Polish:** Community und Fact-Sheet bekommen einen Button statt Leerraum; Podcast/Hackathon ein dezentes Icon-Wasserzeichen.
- Offen: Advisory-Fotos von leuphana.de sind Hotlinks; Podcast-Karte ohne Link hat noch etwas Leerraum unten.
