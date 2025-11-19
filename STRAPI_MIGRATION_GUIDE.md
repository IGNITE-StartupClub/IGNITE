# Anleitung: Migration zu Strapi für Features, FAQs und Questionnaire

Diese Anleitung erklärt, wie du die neuen Strapi Content-Types einrichtest und die Inhalte von der Website in Strapi überträgst.

## Schritt 1: Content-Types in Strapi erstellen

1. Öffne dein Strapi Dashboard
2. Befolge die Anleitung in `strapi-content-types/QUICK_SETUP.md`
3. Erstelle die folgenden Content-Types:
   - **Feature** (Collection)
   - **FAQ** (Collection)
   - **Questionnaire** (Single Type mit Komponenten)

## Schritt 2: Berechtigungen setzen

1. Gehe zu **Settings** → **Users & Permissions Plugin** → **Roles** → **Public**
2. Aktiviere für jeden Content-Type:
   - `find` (für Collections: features, faqs)
   - `findOne` (für Single Type: questionnaire)
3. Speichern

## Schritt 3: Daten in Strapi eingeben

### Features

Erstelle folgende 6 Features in Strapi (in dieser Reihenfolge):

| Order | Icon | Title | Description |
|-------|------|-------|-------------|
| 1 | ion:diamond-outline | Workshops & Events | Wir lernen gemeinsam von Expert:innen & Peer-to-Peer über Startups und Entrepreneurship.<br><br><p class="text-neutral-500 my-3">Du willst einen Workshop im Rahmen unserer Initiative geben?</p><br><a class="button secondary" href="/kontakt">Jetzt kontaktieren!</a> |
| 2 | ion:document-attach-outline | Fact-Sheet | Wir analysieren die Angebote zum Thema Entrepreneurship an der Leuphana Universität. |
| 3 | ion:flame-outline | Hackathon | Wir veranstalten einen Hackathon, um innovative Ideen zu entwickeln und zu testen. Wir organisieren 2-3 tägige Events, um in kurzer Zeit Startup Ideen auszuarbeiten. |
| 4 | ion:mic-outline | IGNITE Podcast | Im Utopia interviewen wir Startup Gründende und Leuphana Alumni. |
| 5 | ion:people-outline | Community | Wir verbinden Studierende, Alumni und Gründende mit dem Ziel, ein starkes Netzwerk aufzubauen. |
| 6 | ion:cash-outline | IGNITE Stipendium | Wir möchten in Zukunft angehendenden Gründenden einen Co-Working Platz und Förderung im Utopia ermöglichen.<br><br><p class="text-neutral-500 my-3">Dafür suchen wir Partner:innen, die uns unterstützen.</p><br><a class="button secondary" href="/kontakt">Partner werden</a> |

**Hinweis:** Die Description unterstützt HTML-Tags wie `<p>`, `<a>`, etc.

### FAQs

Erstelle folgende 6 FAQs in Strapi:

| Order | Question | Answer | Open by Default |
|-------|----------|--------|----------------|
| 1 | Was ist IGNITE? | <p>Wir sind eine studentische Initiative an der Leuphana Universität Lüneburg, die sich leidenschaftlich für Entrepreneurship und Startup-Kultur einsetzt. Unser Ziel ist es, Gründungsgeist zu fördern, Studierende zu vernetzen und praxisnahe Erfahrungen im Bereich Unternehmensgründung zu ermöglichen.</p> | Yes |
| 2 | Welche Erwartungen stellen wir an die Mitglieder? | <p>Der durchschnittliche Aufwand liegt bei etwa 3–5 Stunden pro Woche – je nach Projektphase etwas mehr oder weniger. Wir erwarten regelmäßige Teilnahme an Team-Meetings, aktive Projektarbeit und proaktive Kommunikation.</p> | No |
| 3 | Wie profitiere ich von meinem Ehrenamt? | <p>Du erhältst exklusiven Zugang zu Unternehmen, Gründer:innen, Investor:innen und Alumni, nimmst an praxisorientierten Workshops teil und erhältst individuelles Feedback in Mentoring-Sessions.</p> | No |
| 4 | Wie läuft der Bewerbungs- und Onboarding-Prozess ab? | <p>Du füllst das Online-Formular auf unserer Website aus, bekommst eine Rückmeldung per E-Mail mit Einladung zum persönlichen Gespräch und startest nach positiver Entscheidung mit einem strukturierten Onboarding.</p> | No |
| 5 | Welche Rollen und Gremien gibt es innerhalb der Initiative? | <p>Wir arbeiten in projektbezogenen Teams, die sich um verschiedene Themen kümmern, wie z.B. Workshops, Events, Podcast, Community-Building. Jedes Team hat eine:n Teamleiter:in, die/der für die Koordination verantwortlich ist.</p> | No |
| 6 | Kann man IGNITE sponsoren? | <p>Ja, wir suchen aktiv nach Sponsoren, die uns bei der Umsetzung unserer Projekte unterstützen. Wenn du Interesse hast, kontaktiere uns gerne über das <a href="/kontakt">Kontaktformular</a></p> | No |

**Hinweis:** Das Answer-Feld ist Rich Text und unterstützt HTML.

### Questionnaire

#### Schritt 3.1: Startup Interest Options erstellen

Erstelle in der Questionnaire-Konfiguration folgende 5 Startup Interest Options:

| Order | Value | Label |
|-------|-------|-------|
| 1 | interested | Ich finde Startups/Gründen spannend |
| 2 | want-to-work | Ich möchte in einem Startup arbeiten (angestellt) |
| 3 | want-to-found-no-idea | Ich möchte gründen, habe aber noch keine Idee |
| 4 | want-to-found-with-idea | Ich möchte gründen und habe eine Idee |
| 5 | already-founded | Ich habe bereits gegründet |

#### Schritt 3.2: Questions erstellen

Erstelle folgende Questions:

**Question 1 (Step 3):**
- questionId: `q1`
- step: `3`
- label: `Was reizt dich persönlich an unserer noch jungen Initiative – und warum gerade jetzt?`
- fieldType: `textarea`
- rows: `4`
- placeholder: (leer lassen)
- required: `true`
- order: `1`

**Question 2 (Step 5):**
- questionId: `q4`
- step: `5`
- label: `Welche konkreten Stärken oder Fähigkeiten könntest du sofort in die Teams einbringen? (z. B. Design, Marketing, Finanzen, Technik, Organisation, Netzwerken)`
- fieldType: `textarea`
- rows: `4`
- placeholder: (leer lassen)
- required: `true`
- order: `2`

**Question 3 (Step 5):**
- questionId: `q5`
- step: `5`
- label: `Wie viel Zeit kannst du realistisch pro Woche für IGNITE investieren?`
- fieldType: `textarea`
- rows: `3`
- placeholder: `z. B. 5-10 Stunden pro Woche...`
- required: `true`
- order: `3`

#### Schritt 3.3: Questionnaire Konfiguration

Fülle die Questionnaire Single Type mit folgenden Werten:

- **step1ButtonText:** `Bewerbung ausfüllen`
- **step2Label:** `Wähle 2-3 Teams, in denen du mitarbeiten möchtest:`
- **step2MinTeams:** `2`
- **step2MaxTeams:** `3`
- **step2HintTooFew:** `Bitte wähle mindestens 2 Teams aus.`
- **step2HintMaximum:** `Du hast die maximale Anzahl von 3 Teams ausgewählt.`
- **step3QuestionLabel:** `Was beschreibt deine Situation am besten?`
- **step6FirstNameLabel:** `Vorname`
- **step6LastNameLabel:** `Nachname`
- **step6EmailLabel:** `E-Mail`

Füge dann die oben erstellten **step3Options** und **questions** hinzu.

## Schritt 4: Veröffentlichen

Stelle sicher, dass alle erstellten Einträge **veröffentlicht** (Published) sind, nicht nur als Draft.

## Schritt 5: Testen

1. Starte deine Website lokal: `npm run dev`
2. Überprüfe:
   - Homepage zeigt Features aus Strapi
   - Homepage zeigt FAQs aus Strapi
   - Bewerbungsseite (`/mitmachen`) zeigt Questionnaire aus Strapi
3. Teste das Absenden einer Bewerbung

## Schritt 6: Deploy

Pushe die Änderungen zu Git:

```bash
git add .
git commit -m "Add Strapi integration for Features, FAQs, and Questionnaire"
git push
```

Sowohl Strapi Cloud als auch das Frontend werden automatisch neu gebaut.

## Fallback-Verhalten

Falls Strapi nicht erreichbar ist oder noch keine Daten enthält, nutzt die Website automatisch die bisherigen Default-Werte:
- Features: Hardcoded Fallback-Daten
- FAQs: Hardcoded Fallback-Daten
- Questionnaire: Parser-basierte Konfiguration aus `questionnaire.md`

Dies stellt sicher, dass die Website auch bei Strapi-Ausfällen funktioniert.

## Vorteile der neuen Lösung

1. **Benutzerfreundlich:** Non-Techies können Inhalte über die Strapi-UI bearbeiten
2. **Kein Code erforderlich:** Änderungen an Features, FAQs und Questionnaire ohne Entwickler
3. **Robust:** Automatische Fallbacks bei Problemen
4. **Flexibel:** Einfaches Hinzufügen/Entfernen von Fragen im Questionnaire
5. **Konsistent:** Alle Inhalte zentral in Strapi verwaltet

## Support

Bei Problemen:
1. Überprüfe die Strapi-Berechtigungen (Public role: find/findOne)
2. Prüfe, ob der STRAPI_TOKEN in `.env` korrekt ist
3. Schaue in die Browser-Konsole für Fehlermeldungen
4. Überprüfe die Strapi-Logs für API-Fehler
