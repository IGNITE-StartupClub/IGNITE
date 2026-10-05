# theresidency.com: Analyse, 1:1

Quellen: die 9 Mobile-Screenshots (iPhone, 390pt) plus der echte Quellcode (HTML und Webflow-CSS von livetheresidency.com, abgerufen am 04.10.2026). Die Zahlen unten sind aus dem CSS gemessen, nicht geschätzt.

---

## 1. Warum die Seite funktioniert, in einem Satz

Sie trifft **sehr wenige Entscheidungen und hält sie konsequent durch**: eine Hintergrundfarbe, eine Textfarbe, zwei Schriften, ein Betonungsmittel (kursive Serif), ein Bildmotiv, eine Card, ein Section-Abstand. Darin steckt die Wirkung. Kein einzelnes Element ist spektakulär, aber nichts davon wirkt zufällig.

---

## 2. Typografie (der wichtigste Hebel)

| Element | Schrift | Größe | Gewicht | Zeilenhöhe | Laufweite |
|---|---|---|---|---|---|
| Hero-H1 | **Manrope** (Sans) | 57.5px, Desktop 74px | 500 | 100% | -1.6px |
| Betonungswort im Hero („*live and grow*“) | **Serif kursiv** | gleich | 600 | gleich | -0.1rem |
| Section-H2 | **STIX Two Text** (Serif) | 44px, mobil ~40px | **300** (Light!) | 120% | -0.9px |
| Betonungswort in H2 („*support and connect*“, „*global*“) | Serif kursiv | gleich | 600 | | |
| Body | Manrope | 24px, dann 22/20/18px nach Breakpoint | 400 bis 500 | 1.3 bis 1.5 | -0.32 bis -0.48px |
| FAQ-Frage | Manrope | 24px, mobil 16 bis 20px | 500 | 120% | |
| Wortmarke | Serif | | | | |

**Was daran gut ist:**

1. **Kontrast durch Mischung, nicht durch Größe.** Die Headline mischt aufrechte Sans mit kursiver Serif *im selben Satz*. Das eine kursive Wort trägt die Bedeutung („support and connect“, „global“, „who“, „residents“). Kein Fettdruck, keine Farbe, kein Verlauf. Das ist das Signatur-Element der Seite.
2. **Leichte Headlines (300).** Große Serif in Light wirkt teuer und ruhig. Fette große Schrift schreit, leichte große Schrift spricht.
3. **Body ist groß.** 18 bis 24px Fließtext. Das zwingt zu wenig Text pro Screen und macht die Seite auf dem Handy angenehm.
4. **Negative Laufweite überall**, auch im Body (-0.4px). Das macht Manrope dichter und „editorial“.
5. **Line-height 100 bis 120% für Headlines**, nicht 1.5. Headlines sind kompakte Blöcke.

## 3. Farbe

| Token | Wert |
|---|---|
| Hintergrund | `#f8f8f8` (white smoke, nicht reines Weiß) |
| Text | `#181818` (nero, nicht reines Schwarz) |
| Sekundärtext | `#696969` / `#727272` |
| Akzentfarbe | **keine** |

**Was daran gut ist:** Es gibt nur zwei Werte. Beide sind leicht vom Extrem weggezogen (kein #fff, kein #000), deshalb wirkt der Kontrast weich statt hart. Farbe kommt **ausschließlich aus Bildern** (Stadtfotos der Häuser, Portraits). Dadurch wirken die Bilder doppelt stark.

## 4. Whitespace und Raster

- Section-Padding: **100px oben und unten, 52px seitlich** (Desktop), auf dem Handy etwa 24 bis 48px seitlich.
- Container: **728 bis 940px**. Der Text läuft also schmal, ungefähr 55 bis 65 Zeichen pro Zeile.
- Breakpoints: 479 / 767 / 991 / 1280 / 1440 / 1920.
- **Eine Idee pro Screen.** Auf dem Handy sieht man nie zwei Sections gleichzeitig vollständig.
- Abstand zwischen Headline und Text ist groß (~40px), zwischen Absätzen ~30px. Text-Absätze sind kurz (2 bis 3 Zeilen auf Desktop).

## 5. Struktur und Erzählung (die Section-Reihenfolge)

```
1. Hero            "live and grow with the ambitious" + Textlink "apply now"
2. Warum           "the residency exists to support and connect ambitious builders" + 3 kurze Absätze
3. Wo              "live with global talent" + horizontaler Slider mit Häusern (Bilder)
4. Was dich erwartet  "what to expect" + 4 Absätze mit konkreten Namen (a16z, Sam Altman)
5. Für wen         "who this is for": 3 Zeilen (inventors / visionaries / founders) in einer Card mit Bild
6. Beweis          "our residents": Cards mit Foto, Name, "chapter 02", 3 Zeilen Story
7. FAQ             "questions?": 9 Fragen, Haarlinien, + / ×
8. Final CTA       "apply like over 10,000+ builders" + Button
9. Footer          Wortmarke, Claim, Socials, Links, riesige Wortmarke unten
```

**Was daran gut ist:**

- Es ist eine **Argumentationskette**, keine Feature-Liste: Warum gibt es uns → wo → was bekommst du → bist du gemeint → hier sind Leute wie du → Restzweifel (FAQ) → jetzt bewerben.
- **Die Hauptaktion steht genau zweimal da**: ganz oben als leiser Textlink (gestrichelte Unterstreichung), ganz unten als einziger richtiger Button. Dazwischen kein CTA. Die Seite drängt nicht.
- **Beweis über Menschen, nicht über Zahlen.** Konkrete Namen, Firmen, Investoren. „chapter 02“ statt „Cohort 2023“ ist kleine, eigene Sprache.
- FAQ beantwortet echte Einwände („kann ich nebenbei studieren?“: „leider nein“). Ehrlich und kurz.

## 6. Komponenten

| Komponente | Umsetzung | Warum gut |
|---|---|---|
| Header | Logo links, Hamburger rechts, sticky, leicht durchscheinend mit Blur | minimal, nimmt nichts weg |
| Hero-CTA | **Textlink mit gestrichelter Unterstreichung**, kein Button | elegant, wirkt einladend statt verkaufend |
| Card | weiß auf #f8f8f8, Radius ~24px, dünner Rand, viel Innenabstand | eine einzige Card-Sprache für „who“ und „residents“ |
| Resident-Card | Foto ~80px quadratisch mit Radius 8px links, Name Serif, Kapitel kursiv, Text darunter, Links unterstrichen | Hierarchie nur über Schrift, nicht über Farbe |
| FAQ | volle Breite, Frage links, `+` rechts, 1px Linie darunter, Antwort klappt auf, `+` wird `×` | ruhig, keine Boxen |
| Footer | Wortmarke + Claim, Social-Icons, Linkliste untereinander, riesige Wortmarke am Ende | schließt die Seite ab wie eine Buchrückseite |

## 7. Bildsprache

Ein einziges Motiv durchgängig: **antike Marmorstatuen mit moderner Technik** (VR-Brille, Raumanzug, Laptop). Freigestellt, Graustufen bzw. Marmorweiß, unten weich ausgeblendet. Das ist generierte Bildsprache, die eine **Idee** trägt („klassische Größe trifft Zukunft“) und keine falsche Behauptung aufstellt. Echte Fotos gibt es nur dort, wo eine Behauptung steht (Residents, Häuser).

## 8. Copy

- Zweite Person, direkt: „ambitious builders like yourself“.
- Kurze Sätze, konkrete Substantive (Wohnen, Coworking, Demo Day, wöchentliche Syncs).
- Konkrete Namen statt Adjektiven.
- Durchgehend klein geschrieben (Markenentscheidung).

---

## 9. Was wir **nicht** übernehmen (Schwächen der Seite)

| Schwäche | Warum nicht |
|---|---|
| Alles kleingeschrieben | Im Deutschen sind Substantive groß. Kleinschreibung wirkt hier fehlerhaft statt stilvoll. |
| 10 Google-Font-Familien geladen, jQuery, Webflow-Runtime | schlechte Performance, DSGVO-Problem. Wir hosten 2 Schriften selbst. |
| Alle Bilder mit `alt=""` | Barrierefreiheit kaputt. Wir schreiben echte Alt-Texte. |
| Bunte Verlaufs-Card im Final CTA | bricht die eigene Disziplin. Wir nehmen eine flache, invertierte Fläche. |
| „10,000+ builders“, Emoji ❤ | unbelegte Zahl, Emoji als Deko. Bei uns nur echte Zahlen aus `kpiData.ts`. |
| Unsichtbarer Webflow-Restcontent („This is some text inside of a div block“) | unsauber. |
| Hero-H1 in Sans, H2 in Serif | funktioniert dort, ist aber inkonsistent. Wir nehmen Serif für alle Headlines und Sans nur für Body/UI. |

---

## 10. Übersetzung auf IGNITE (verbindlich für die Umsetzung)

### Typografie
- Headlines: **Newsreader** (Serif, variabel mit Optical Size), Gewicht **300 bis 400**, `leading 1.05 bis 1.2`, `tracking-tight`.
- Betonung: **genau ein kursives Wort oder eine kursive Phrase pro Headline**, Newsreader Italic 500 bis 600. Im Dark Theme in `--color-accent-text` (helles Lila), im Light Theme in `--color-fg` (Lila nur für Links/CTA). Markup: `<em>` in der Copy in `staticContent.ts`, Komponente stylt `h1 em, h2 em`.
- Body: **Manrope**, 18px mobil, 20px ab `md`, 22px Lead-Absätze, Gewicht 400/500, `leading 1.45`, `letter-spacing -0.01em`.
- Normale Groß-/Kleinschreibung.

### Farbe (zwei Themes, Toggle)
- **Light** = theresidency 1:1, leicht ins Lila getönt: bg `hsl(255 20% 97%)`, Text `hsl(255 12% 10%)`, Muted `hsl(255 5% 40%)`.
- **Dark** = IGNITE-Vibe: bg `hsl(255 10% 5%)`, Text `hsl(255 20% 96%)`.
- **Lila `#5227FF`** ist die einzige Farbe: Primary-Button, Links, Fokus. Sonst kommt Farbe nur aus Fotos.

### Whitespace
- Section-Padding mobil `py-24 px-6`, Desktop `py-32 px-12`, Hero und Final CTA mehr.
- Text-Container max. `42rem` (~65 Zeichen), breite Elemente (Slider, Card-Reihen) max. `72rem`.
- Eine Idee pro Screen.

### Startseite, neue Section-Reihenfolge (ersetzt Section Map im Plan)

| # | Section | Headline-Vorschlag (Copy bitte bestätigen) | Inhalt |
|---|---|---|---|
| 1 | Hero | „Gründe *gemeinsam* mit den Ambitionierten der Leuphana“ | eine Zeile Sub, **Textlink „Mitmachen“ mit gestrichelter Unterstreichung**, optional Hero-Bild (siehe Bildsprache) |
| 2 | Warum | „IGNITE existiert, um *Gründungsgeist* an der Leuphana zu entfachen“ | 2 bis 3 kurze Absätze aus der FAQ „Was ist IGNITE“ |
| 3 | Was dich erwartet | „Was dich *erwartet*“ | Workshops, Hackathon, Podcast, Community, Stipendium als **kurze Absätze mit kursiver Kernphrase**, keine Box-Grid |
| 4 | Für wen | „*Für wen* das ist“ | 3 Zeilen in einer Card (z.B. Studierende mit eigener Idee / die eine suchen / die im Team bauen wollen) |
| 5 | Menschen | „Unser *Advisory Board*“ / später „Unsere *Gründer:innen*“ | Resident-Card-Muster: Foto klein, Name Serif, Rolle kursiv, 2 bis 3 Zeilen |
| 6 | Wirkung | „Was wir *bisher* bewegt haben“ | echte Zahlen aus `kpiData.ts`, ruhig, ohne Count-Animation |
| 7 | Neuigkeiten | „*Neuigkeiten*“ | 3 neueste Einträge, horizontaler Scroll mobil (wie die Häuser-Slider), Link „Alle Neuigkeiten“ |
| 8 | FAQ | „Fragen?“ (ganz kursiv, zentriert) | native `<details>`, Haarlinien, + / × |
| 9 | Final CTA | „Werde Teil von *IGNITE*“ | flache invertierte Fläche, **einziger richtiger Button** |
| – | Footer | | Wortmarke + Claim, Linkgruppen, Socials, Jahr dynamisch, riesige Wortmarke unten |

Die Hauptaktion steht genau zweimal da: Hero (Textlink) und Final CTA (Button). Im Header steht zusätzlich ein kleiner Mitmachen-Link.

### Bildsprache (offene Entscheidung, Phase 7)
theresidency lebt vom Statuen-Motiv. Für IGNITE zwei Optionen:
- **A:** ein eigenes, konsequent art-direktiertes Motiv (z.B. Funke/Feuer-Thema passend zu „IGNITE“, monochrom, freigestellt). Generiert ist erlaubt, weil es eine Idee trägt. Ablauf: schriftliche Art Direction, 3 Kandidaten, du wählst.
- **B:** nur echte Event-Fotos aus `public/news/`, einheitlich behandelt (gleicher Ausschnitt, gleiche Rundung).
Bis zur Entscheidung: kein Hero-Bild, nur Typografie.
