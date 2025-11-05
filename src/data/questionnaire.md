<!--
╔══════════════════════════════════════════════════════════════════════════════╗
║                    FRAGEBOGEN-KONFIGURATION - ANLEITUNG                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

📖 WICHTIG: Diese Datei steuert den gesamten Bewerbungsfragebogen!

🎯 WIE FUNKTIONIERT ES?
- Der Fragebogen ist in 6 Schritte unterteilt (Schritt 1-6)
- Jeder Schritt kann mehrere Fragen enthalten
- Du kannst Fragen hinzufügen, bearbeiten oder löschen
- Die Emails und Formulare passen sich automatisch an!

📝 WICHTIGE BEGRIFFE:
• Label: Der Text, den der Benutzer sieht (die eigentliche Frage)
• Typ: Art des Eingabefeldes (textarea = mehrzeilig, text = einzeilig, email = Email)
• Zeilen: Wie viele Zeilen das Textfeld haben soll
• Platzhalter: Beispieltext im Eingabefeld (optional)
• Pflichtfeld: Ja = muss ausgefüllt werden, Nein = optional

🔧 FRAGEN HINZUFÜGEN/LÖSCHEN:
• Neue Frage hinzufügen: Kopiere einen "### Frage Q..." Block und passe die Nummer an
• Frage löschen: Lösche den gesamten "### Frage Q..." Block
• TIPP: Du kannst auch nur 2-3 Fragen haben - das System passt sich an!

⚠️ WICHTIG - BITTE NICHT ÄNDERN:
• Die Struktur "## Schritt X:" muss erhalten bleiben
• Die Begriffe vor dem Doppelpunkt (**Label:**, **Typ:**, etc.) nicht ändern
• Nur den Text NACH dem Doppelpunkt ändern!

✅ BEISPIEL - SO SIEHT EINE FRAGE AUS:
### Frage Q1                          ← Die Fragen-ID (Q1, Q2, Q3, etc.)
**Label:** Deine Frage hier?          ← Der Text der Frage
**Typ:** textarea                     ← Art der Eingabe (textarea für lange Texte)
**Zeilen:** 4                         ← Anzahl der Zeilen
**Platzhalter:** Beispieltext...      ← Optionaler Hilfstext
**Pflichtfeld:** Ja                   ← Pflichtfeld: Ja oder Nein

═══════════════════════════════════════════════════════════════════════════════
-->

# Fragebogen-Konfiguration

<!-- ═══════════════════════════════════════════════════════════════════════════
SCHRITT 1: INTRO-BUTTON
→ Hier wird nur der Text für den Start-Button festgelegt
════════════════════════════════════════════════════════════════════════════ -->

## Schritt 1: Intro
**Button Text:** Bewerbung ausfüllen

---

<!-- ═══════════════════════════════════════════════════════════════════════════
SCHRITT 2: TEAM-AUSWAHL
→ Hier wählen Bewerber die Teams aus, in denen sie mitarbeiten möchten
→ Du kannst die Min/Max Anzahl anpassen
════════════════════════════════════════════════════════════════════════════ -->

## Schritt 2: Team-Auswahl
**Label:** Wähle 2-3 Teams, in denen du mitarbeiten möchtest:
**Minimum Teams:** 2
**Maximum Teams:** 3
**Hinweis (zu wenig):** Bitte wähle mindestens 2 Teams aus.
**Hinweis (maximum):** Du hast die maximale Anzahl von 3 Teams ausgewählt.

---

<!-- ═══════════════════════════════════════════════════════════════════════════
SCHRITT 3: STARTUP-INTERESSE
→ Hier wird das Interesse an Startups abgefragt
→ Enthält Multiple-Choice Optionen + Text-Fragen
════════════════════════════════════════════════════════════════════════════ -->

## Schritt 3: Startup-Interesse

<!-- Die Multiple-Choice Frage (Radio Buttons) -->
**Frage:** Was beschreibt deine Situation am besten?

<!-- Die Auswahlmöglichkeiten - Format: "- **wert:** Text der angezeigt wird" -->
**Optionen:**
- **interested:** Ich finde Startups/Gründen spannend
- **want-to-work:** Ich möchte in einem Startup arbeiten (angestellt)
- **want-to-found-no-idea:** Ich möchte gründen, habe aber noch keine Idee
- **want-to-found-with-idea:** Ich möchte gründen und habe eine Idee
- **already-founded:** Ich habe bereits gegründet

<!-- Text-Frage Q1 - kann bearbeitet oder gelöscht werden -->
### Frage Q1
**Label:** Was reizt dich persönlich an unserer noch jungen Initiative – und warum gerade jetzt?
**Typ:** textarea
**Zeilen:** 4
**Pflichtfeld:** Ja

---

<!-- ═══════════════════════════════════════════════════════════════════════════
SCHRITT 5: FÄHIGKEITEN & COMMITMENT
→ Hier kannst du Fragen zu Skills und Zeitinvestment stellen
→ Du kannst beliebig viele Fragen hinzufügen oder alle löschen
→ Wenn du alle Fragen löschst, wird dieser Schritt automatisch übersprungen!
════════════════════════════════════════════════════════════════════════════ -->

## Schritt 5: Fähigkeiten & Commitment

<!-- Frage Q4 - kann bearbeitet oder gelöscht werden -->
### Frage Q4
**Label:** Welche konkreten Stärken oder Fähigkeiten könntest du sofort in die Teams einbringen? (z. B. Design, Marketing, Finanzen, Technik, Organisation, Netzwerken)
**Typ:** textarea
**Zeilen:** 4
**Pflichtfeld:** Ja

<!-- Frage Q5 - kann bearbeitet oder gelöscht werden -->
### Frage Q5
**Label:** Wie viel Zeit kannst du realistisch pro Woche für IGNITE investieren?
**Typ:** textarea
**Zeilen:** 3
**Platzhalter:** z. B. 5-10 Stunden pro Woche...
**Pflichtfeld:** Ja

---

<!-- ═══════════════════════════════════════════════════════════════════════════
SCHRITT 6: PERSÖNLICHE DATEN
→ Dieser Schritt MUSS immer vorhanden sein (Vorname, Nachname, Email)
→ Du kannst nur die Labels ändern, aber nicht löschen!
════════════════════════════════════════════════════════════════════════════ -->

## Schritt 6: Persönliche Daten

### Vorname
**Label:** Vorname
**Typ:** text
**Pflichtfeld:** Ja

### Nachname
**Label:** Nachname
**Typ:** text
**Pflichtfeld:** Ja

### E-Mail
**Label:** E-Mail
**Typ:** email
**Pflichtfeld:** Ja

<!--
════════════════════════════════════════════════════════════════════════════════
🎉 FERTIG! Speichere die Datei und die Änderungen werden automatisch übernommen.
════════════════════════════════════════════════════════════════════════════════
-->
