import { Resend } from 'resend';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import { v4 } from 'uuid';
import 'dotenv/config';
export { renderers } from '../../renderers.mjs';

const questionnaireContent = "<!--\n╔══════════════════════════════════════════════════════════════════════════════╗\n║                    FRAGEBOGEN-KONFIGURATION - ANLEITUNG                      ║\n╚══════════════════════════════════════════════════════════════════════════════╝\n\n📖 WICHTIG: Diese Datei steuert den gesamten Bewerbungsfragebogen!\n\n🎯 WIE FUNKTIONIERT ES?\n- Der Fragebogen ist in 6 Schritte unterteilt (Schritt 1-6)\n- Jeder Schritt kann mehrere Fragen enthalten\n- Du kannst Fragen hinzufügen, bearbeiten oder löschen\n- Die Emails und Formulare passen sich automatisch an!\n\n📝 WICHTIGE BEGRIFFE:\n• Label: Der Text, den der Benutzer sieht (die eigentliche Frage)\n• Typ: Art des Eingabefeldes (textarea = mehrzeilig, text = einzeilig, email = Email)\n• Zeilen: Wie viele Zeilen das Textfeld haben soll\n• Platzhalter: Beispieltext im Eingabefeld (optional)\n• Pflichtfeld: Ja = muss ausgefüllt werden, Nein = optional\n\n🔧 FRAGEN HINZUFÜGEN/LÖSCHEN:\n• Neue Frage hinzufügen: Kopiere einen \"### Frage Q...\" Block und passe die Nummer an\n• Frage löschen: Lösche den gesamten \"### Frage Q...\" Block\n• TIPP: Du kannst auch nur 2-3 Fragen haben - das System passt sich an!\n\n⚠️ WICHTIG - BITTE NICHT ÄNDERN:\n• Die Struktur \"## Schritt X:\" muss erhalten bleiben\n• Die Begriffe vor dem Doppelpunkt (**Label:**, **Typ:**, etc.) nicht ändern\n• Nur den Text NACH dem Doppelpunkt ändern!\n\n✅ BEISPIEL - SO SIEHT EINE FRAGE AUS:\n### Frage Q1                          ← Die Fragen-ID (Q1, Q2, Q3, etc.)\n**Label:** Deine Frage hier?          ← Der Text der Frage\n**Typ:** textarea                     ← Art der Eingabe (textarea für lange Texte)\n**Zeilen:** 4                         ← Anzahl der Zeilen\n**Platzhalter:** Beispieltext...      ← Optionaler Hilfstext\n**Pflichtfeld:** Ja                   ← Pflichtfeld: Ja oder Nein\n\n═══════════════════════════════════════════════════════════════════════════════\n-->\n\n# Fragebogen-Konfiguration\n\n<!-- ═══════════════════════════════════════════════════════════════════════════\nSCHRITT 1: INTRO-BUTTON\n→ Hier wird nur der Text für den Start-Button festgelegt\n════════════════════════════════════════════════════════════════════════════ -->\n\n## Schritt 1: Intro\n**Button Text:** Bewerbung ausfüllen\n\n---\n\n<!-- ═══════════════════════════════════════════════════════════════════════════\nSCHRITT 2: TEAM-AUSWAHL\n→ Hier wählen Bewerber die Teams aus, in denen sie mitarbeiten möchten\n→ Du kannst die Min/Max Anzahl anpassen\n════════════════════════════════════════════════════════════════════════════ -->\n\n## Schritt 2: Team-Auswahl\n**Label:** Wähle 2-3 Teams, in denen du mitarbeiten möchtest:\n**Minimum Teams:** 2\n**Maximum Teams:** 3\n**Hinweis (zu wenig):** Bitte wähle mindestens 2 Teams aus.\n**Hinweis (maximum):** Du hast die maximale Anzahl von 3 Teams ausgewählt.\n\n---\n\n<!-- ═══════════════════════════════════════════════════════════════════════════\nSCHRITT 3: STARTUP-INTERESSE\n→ Hier wird das Interesse an Startups abgefragt\n→ Enthält Multiple-Choice Optionen + Text-Fragen\n════════════════════════════════════════════════════════════════════════════ -->\n\n## Schritt 3: Startup-Interesse\n\n<!-- Die Multiple-Choice Frage (Radio Buttons) -->\n**Frage:** Was beschreibt deine Situation am besten?\n\n<!-- Die Auswahlmöglichkeiten - Format: \"- **wert:** Text der angezeigt wird\" -->\n**Optionen:**\n- **interested:** Ich finde Startups/Gründen spannend\n- **want-to-work:** Ich möchte in einem Startup arbeiten (angestellt)\n- **want-to-found-no-idea:** Ich möchte gründen, habe aber noch keine Idee\n- **want-to-found-with-idea:** Ich möchte gründen und habe eine Idee\n- **already-founded:** Ich habe bereits gegründet\n\n<!-- Text-Frage Q1 - kann bearbeitet oder gelöscht werden -->\n### Frage Q1\n**Label:** Was reizt dich persönlich an unserer noch jungen Initiative – und warum gerade jetzt?\n**Typ:** textarea\n**Zeilen:** 4\n**Pflichtfeld:** Ja\n\n---\n\n<!-- ═══════════════════════════════════════════════════════════════════════════\nSCHRITT 5: FÄHIGKEITEN & COMMITMENT\n→ Hier kannst du Fragen zu Skills und Zeitinvestment stellen\n→ Du kannst beliebig viele Fragen hinzufügen oder alle löschen\n→ Wenn du alle Fragen löschst, wird dieser Schritt automatisch übersprungen!\n════════════════════════════════════════════════════════════════════════════ -->\n\n## Schritt 5: Fähigkeiten & Commitment\n\n<!-- Frage Q4 - kann bearbeitet oder gelöscht werden -->\n### Frage Q4\n**Label:** Welche konkreten Stärken oder Fähigkeiten könntest du sofort in die Teams einbringen? (z. B. Design, Marketing, Finanzen, Technik, Organisation, Netzwerken)\n**Typ:** textarea\n**Zeilen:** 4\n**Pflichtfeld:** Ja\n\n<!-- Frage Q5 - kann bearbeitet oder gelöscht werden -->\n### Frage Q5\n**Label:** Wie viel Zeit kannst du realistisch pro Woche für IGNITE investieren?\n**Typ:** textarea\n**Zeilen:** 3\n**Platzhalter:** z. B. 5-10 Stunden pro Woche...\n**Pflichtfeld:** Ja\n\n---\n\n<!-- ═══════════════════════════════════════════════════════════════════════════\nSCHRITT 6: PERSÖNLICHE DATEN\n→ Dieser Schritt MUSS immer vorhanden sein (Vorname, Nachname, Email)\n→ Du kannst nur die Labels ändern, aber nicht löschen!\n════════════════════════════════════════════════════════════════════════════ -->\n\n## Schritt 6: Persönliche Daten\n\n### Vorname\n**Label:** Vorname\n**Typ:** text\n**Pflichtfeld:** Ja\n\n### Nachname\n**Label:** Nachname\n**Typ:** text\n**Pflichtfeld:** Ja\n\n### E-Mail\n**Label:** E-Mail\n**Typ:** email\n**Pflichtfeld:** Ja\n\n<!--\n════════════════════════════════════════════════════════════════════════════════\n🎉 FERTIG! Speichere die Datei und die Änderungen werden automatisch übernommen.\n════════════════════════════════════════════════════════════════════════════════\n-->\n";

/**
 * Parser für die Fragebogen-Konfiguration aus der Markdown-Datei
 */


function parseQuestionnaireConfig(content) {
  const config = {
    step1: {},
    step2: {},
    step3: { options: [], questions: {} },
    step4: { questions: {} },
    step5: { questions: {} },
    step6: { fields: {} },
    // Track all question IDs across all steps for dynamic validation
    allQuestions: []
  };

  const lines = content.split('\n');
  let currentStep = null;
  let currentQuestion = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Schritt-Überschriften erkennen
    if (line.startsWith('## Schritt 1:')) {
      currentStep = 'step1';
      currentQuestion = null;
    } else if (line.startsWith('## Schritt 2:')) {
      currentStep = 'step2';
      currentQuestion = null;
    } else if (line.startsWith('## Schritt 3:')) {
      currentStep = 'step3';
      currentQuestion = null;
    } else if (line.startsWith('## Schritt 4:')) {
      currentStep = 'step4';
      currentQuestion = null;
    } else if (line.startsWith('## Schritt 5:')) {
      currentStep = 'step5';
      currentQuestion = null;
    } else if (line.startsWith('## Schritt 6:')) {
      currentStep = 'step6';
      currentQuestion = null;
    }

    // Fragen-Überschriften erkennen (### Frage Q1, Q2, etc.)
    if (line.startsWith('### Frage Q')) {
      const questionId = line.match(/Q(\d+)/);
      if (questionId) {
        currentQuestion = 'q' + questionId[1];
        if (currentStep === 'step3' || currentStep === 'step4' || currentStep === 'step5') {
          config[currentStep].questions[currentQuestion] = {};
          // Track this question ID globally
          config.allQuestions.push(currentQuestion);
        }
      }
    } else if (line.startsWith('### Vorname')) {
      currentQuestion = 'name';
      config.step6.fields[currentQuestion] = {};
    } else if (line.startsWith('### Nachname')) {
      currentQuestion = 'lastname';
      config.step6.fields[currentQuestion] = {};
    } else if (line.startsWith('### E-Mail')) {
      currentQuestion = 'email';
      config.step6.fields[currentQuestion] = {};
    }

    // Eigenschaften parsen
    if (line.startsWith('**') && line.includes(':**')) {
      const match = line.match(/\*\*(.+?):\*\*\s*(.+)/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();

        // Werte basierend auf dem Schlüssel zuordnen
        if (currentStep === 'step1' && key === 'Button Text') {
          config.step1.buttonText = value;
        } else if (currentStep === 'step2') {
          if (key === 'Label') config.step2.label = value;
          else if (key === 'Minimum Teams') config.step2.minTeams = parseInt(value);
          else if (key === 'Maximum Teams') config.step2.maxTeams = parseInt(value);
          else if (key === 'Hinweis (zu wenig)') config.step2.hintTooFew = value;
          else if (key === 'Hinweis (maximum)') config.step2.hintMaximum = value;
        } else if (currentStep === 'step3') {
          if (key === 'Frage' && !currentQuestion) {
            config.step3.legend = value;
          } else if (currentQuestion && config.step3.questions[currentQuestion]) {
            if (key === 'Label') config.step3.questions[currentQuestion].label = value;
            else if (key === 'Typ') config.step3.questions[currentQuestion].type = value;
            else if (key === 'Zeilen') config.step3.questions[currentQuestion].rows = parseInt(value);
            else if (key === 'Pflichtfeld') config.step3.questions[currentQuestion].required = value === 'Ja';
          }
        } else if (currentStep === 'step4' && currentQuestion) {
          if (key === 'Label') config.step4.questions[currentQuestion].label = value;
          else if (key === 'Typ') config.step4.questions[currentQuestion].type = value;
          else if (key === 'Zeilen') config.step4.questions[currentQuestion].rows = parseInt(value);
          else if (key === 'Platzhalter') config.step4.questions[currentQuestion].placeholder = value;
          else if (key === 'Pflichtfeld') config.step4.questions[currentQuestion].required = value === 'Ja';
        } else if (currentStep === 'step5' && currentQuestion) {
          if (key === 'Label') config.step5.questions[currentQuestion].label = value;
          else if (key === 'Typ') config.step5.questions[currentQuestion].type = value;
          else if (key === 'Zeilen') config.step5.questions[currentQuestion].rows = parseInt(value);
          else if (key === 'Platzhalter') config.step5.questions[currentQuestion].placeholder = value;
          else if (key === 'Pflichtfeld') config.step5.questions[currentQuestion].required = value === 'Ja';
        } else if (currentStep === 'step6') {
          if (currentQuestion && config.step6.fields[currentQuestion]) {
            if (key === 'Label') config.step6.fields[currentQuestion].label = value;
            else if (key === 'Typ') config.step6.fields[currentQuestion].type = value;
            else if (key === 'Pflichtfeld') config.step6.fields[currentQuestion].required = value === 'Ja';
          }
        }
      }
    }

    // Optionen für Step 3 (Startup-Interesse) parsen
    if (currentStep === 'step3' && line.startsWith('- **') && line.includes(':**')) {
      const match = line.match(/- \*\*(.+?):\*\*\s*(.+)/);
      if (match) {
        const value = match[1].trim();
        const label = match[2].trim();
        config.step3.options.push({ value, label });
      }
    }
  }

  return config;
}

// Helper function to get question labels for email template
function getQuestionLabels() {
  const labels = {};

  // Collect all question labels from all steps
  ['step3', 'step4', 'step5'].forEach(step => {
    const questions = questionnaireConfig[step]?.questions || {};
    Object.keys(questions).forEach(qId => {
      labels[qId] = questions[qId].label || qId;
    });
  });

  return labels;
}

const questionnaireConfig = parseQuestionnaireConfig(questionnaireContent);

function getApplicationEmailSubject() {
  return "Neue Bewerbung eingegangen";
}
function getApplicationEmailHTML(data, questionLabels) {
  const teamsArray = Array.isArray(data.teams) ? data.teams : [];
  const teamsList = teamsArray.length > 0 ? teamsArray.join(", ") : "Keine Teams ausgewählt";
  const formatField = (value) => {
    if (value === null || value === void 0) return "Nicht angegeben";
    if (Array.isArray(value)) return value.join(", ") || "Keine Angabe";
    return String(value);
  };
  let tableRows = `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 12px 8px; font-weight: bold; vertical-align: top; width: 35%; min-width: 120px;">
        <strong>Gewählte Teams:</strong>
      </td>
      <td style="padding: 12px 8px; vertical-align: top;">${teamsList}</td>
    </tr>
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 12px 8px; font-weight: bold; vertical-align: top;">
        <strong>Startup-Interesse:</strong>
      </td>
      <td style="padding: 12px 8px; vertical-align: top;">${formatField(data.startupInterest)}</td>
    </tr>
  `;
  Object.keys(questionLabels).forEach((qId) => {
    if (data[qId]) {
      tableRows += `
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 12px 8px; font-weight: bold; vertical-align: top;">
            <strong>${questionLabels[qId]}:</strong>
          </td>
          <td style="padding: 12px 8px; vertical-align: top; word-wrap: break-word;">${formatField(data[qId])}</td>
        </tr>
      `;
    }
  });
  tableRows += `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 12px 8px; font-weight: bold; vertical-align: top;"><strong>Vorname:</strong></td>
      <td style="padding: 12px 8px; vertical-align: top;">${formatField(data.name)}</td>
    </tr>
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 12px 8px; font-weight: bold; vertical-align: top;"><strong>Nachname:</strong></td>
      <td style="padding: 12px 8px; vertical-align: top;">${formatField(data.lastname)}</td>
    </tr>
    <tr>
      <td style="padding: 12px 8px; font-weight: bold; vertical-align: top;"><strong>E-Mail:</strong></td>
      <td style="padding: 12px 8px; vertical-align: top; word-break: break-all;">${formatField(data.email)}</td>
    </tr>
  `;
  return `
    <div style="font-family: Inter, sans-serif; padding:2rem; border:1px solid #eee; border-radius:8px; max-width:600px; margin:auto;">
      <h2 style="color:#8C3974;">📬 Neue Bewerbung</h2>
      <table style="width:100%; line-height:1.6; border-collapse: separate; border-spacing: 0;">
        ${tableRows}
      </table>
      <p style="font-size:0.85rem; color:#888; margin-top:1.5rem;">
        Diese Nachricht wurde automatisch über das Bewerbungsformular gesendet.
      </p>
    </div>
    <style>
    @media (max-width: 600px) {
      table {
        font-size: 14px;
      }
      td {
        display: block !important;
        width: 100% !important;
        padding: 8px 12px !important;
      }
      td:first-child {
        padding-bottom: 4px !important;
        border-bottom: none !important;
      }
      td:last-child {
        padding-top: 4px !important;
        padding-bottom: 16px !important;
        margin-bottom: 8px;
        border-bottom: 1px solid #e0e0e0 !important;
      }
    }
    </style>
  `;
}

function getApplicationConfirmationSubject() {
  return "Danke für deine Bewerbung – IGNITE Startup Club";
}
function getApplicationConfirmationEmailHTML(name) {
  return `
    <div style="font-family: Inter, sans-serif; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; color: #333; max-width: 600px; margin:auto;">
      <h2 style="color: #8C3974;">Vielen Dank für deine Bewerbung 🙏</h2>
      <p>Hallo${name ? ` ${name}` : ""},</p>
      <p>wir haben deine Bewerbung erhalten und werden uns so schnell wie möglich bei dir melden.</p>
      <p style="margin-top: 1.5rem;">Solltest du in der Zwischenzeit Fragen haben, kontaktiere uns einfach unter <a href="mailto:stud.initiative.ignite@leuphana.de">stud.initiative.ignite@leuphana.de</a>.</p>
      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;" />
      <p style="font-size: 0.85rem; color: #888;">Diese E-Mail wurde automatisch generiert. Bitte nicht antworten.</p>
    </div>
  `;
}

function getErrorReportSubject() {
  return "⚠️ Fehler bei der Datenbankanfrage";
}
function getErrorReportEmailHTML(errorMessage, context) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const contextInfo = context ? `<p><strong>Context:</strong> ${context}</p>` : "";
  return `
    <div style="font-family:Inter,sans-serif;padding:2rem;border:1px solid #f5c6cb;border-radius:8px;background:#f8d7da;color:#721c24;max-width:600px;margin:auto;">
      <h2>Fehler bei der DB-Anfrage</h2>
      <p><strong>Fehler:</strong> ${errorMessage}</p>
      ${contextInfo}
      <p><strong>Zeitstempel:</strong> ${timestamp}</p>
      <p><em>Dies ist eine automatisch generierte Nachricht.</em></p>
    </div>
  `;
}

const prerender = false;
const resend = new Resend(process.env.RESEND_API_KEY);
const resendHolyGrail = new Resend(process.env.RESEND_HOLY_GRAIL);
const requiredEnvs = ["RESEND_API_KEY", "MONGODB_URI", "MONGODB_DB", "ENCRYPTION_SECRET", "EMAIL_RECIPIENT_1"];
for (const key of requiredEnvs) {
  if (!process.env[key]) {
    console.error(`❌ Missing env var ${key}`);
    throw new Error(`Env var ${key} is required`);
  }
}
const adminRecipients = [process.env.EMAIL_RECIPIENT_1, process.env.EMAIL_RECIPIENT_2].filter(Boolean);
function toSafeString(value) {
  if (value === null || value === void 0) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}
function encrypt(text) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(process.env.ENCRYPTION_SECRET, "hex"), iv);
    let enc = cipher.update(text, "utf8", "hex");
    enc += cipher.final("hex");
    const tag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${enc}:${tag.toString("hex")}`;
  } catch (err) {
    console.error("❌ Encryption error:", err);
    throw err;
  }
}
async function sendApplicationEmail(data) {
  try {
    console.log("✉️  Sending application notification to team...");
    if (adminRecipients.length === 0) {
      console.error("❌ No admin recipients configured! Skipping team notification.");
      throw new Error("No admin recipients configured");
    }
    const questionLabels = getQuestionLabels();
    const subject = getApplicationEmailSubject();
    const html = getApplicationEmailHTML(data, questionLabels);
    const result = await resend.emails.send({
      from: "team@ignite-startupclub.de",
      to: adminRecipients,
      subject,
      html
    });
    console.log("✅ Team notification sent successfully");
    console.log(`📧 Email ID: ${result.data?.id || "unknown"}`);
  } catch (err) {
    console.error("❌ Error sending team email:", err);
    throw err;
  }
}
async function sendConfirmationEmail(email, name) {
  try {
    if (!email || !email.includes("@")) {
      console.error(`❌ Invalid email address: ${email}`);
      throw new Error(`Invalid email address: ${email}`);
    }
    console.log(`✉️  Sending confirmation email to ${email}...`);
    const subject = getApplicationConfirmationSubject();
    const html = getApplicationConfirmationEmailHTML(name);
    const result = await resend.emails.send({
      from: "join@ignite-startupclub.de",
      to: email,
      subject,
      html
    });
    console.log("✅ Confirmation email sent successfully");
    console.log(`📧 Email ID: ${result.data?.id || "unknown"}`);
  } catch (err) {
    console.error("❌ Error sending confirmation email:", err);
  }
}
async function sendErrorEmail(errorMessage, context) {
  try {
    if (adminRecipients.length === 0) {
      console.error("❌ No admin recipients configured! Cannot send error report.");
      console.error("Please set EMAIL_RECIPIENT_1 and/or EMAIL_RECIPIENT_2 environment variables.");
      return;
    }
    console.log("✉️  Sending error report to team...");
    console.log(`📧 Recipients: ${adminRecipients.join(", ")}`);
    const subject = getErrorReportSubject();
    const html = getErrorReportEmailHTML(errorMessage, context);
    await resend.emails.send({
      from: "team@ignite-startupclub.de",
      to: adminRecipients,
      subject,
      html
    });
    console.log("✅ Error report sent successfully");
  } catch (err) {
    console.error("❌ Could not send error report:", err);
    console.error("Original error was:", errorMessage);
  }
}
async function handleNewsletterSubscription(db, email, firstName, lastName) {
  try {
    console.log("📧 Starting newsletter double opt-in process for:", email);
    const existingPending = await db.collection("pending_confirmations").findOne({ email });
    if (existingPending) {
      console.log("📧 Email already has pending confirmation:", email);
      return;
    }
    const token = v4();
    const SITE_URL = process.env.SITE_URL || "https://ignite-startupclub.de";
    const confirmUrl = `${SITE_URL}/subscribe?token=${token}`;
    const cancelUrl = `${SITE_URL}/subscribe?cancel=${email}`;
    await db.collection("pending_confirmations").insertOne({
      email,
      firstName: firstName || "",
      lastName: lastName || "",
      token,
      createdAt: /* @__PURE__ */ new Date()
    });
    console.log("✅ Newsletter confirmation data stored in DB");
    await resendHolyGrail.emails.send({
      from: "IGNITE Startup Club <news@ignite-startupclub.de>",
      to: email,
      subject: "Willkommen beim IGNITE Startup Club!",
      html: `
        <div style="font-family: Inter, sans-serif; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; color: #333;">
          <h2 style="color: #8C3974;">Willkommen beim IGNITE Startup Club 🎉</h2>
          <p>Schön, dass du dich für unsere Initiative interessierst!</p>

          <p>Du möchtest nichts verpassen? Dann bestätige deine E-Mail und erhalte News durch unseren Newsletter!</p>

          <p style="text-align: center; margin: 2rem 0;">
            <a href="${confirmUrl}"
              style="display: inline-block; background-color: #8C3974; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: bold;">
              📧 Newsletter abonnieren
            </a>
          </p>

          <p>Wenn du dich für unseren Newsletter anmeldest, bleibst du immer auf dem Laufenden über folgende Themen:</p>
          <ul style="line-height: 1.6;">
            <li>Events und Workshops rund ums Gründen in Lüneburg und Hamburg</li>
            <li>Einblicke in reale Startup-Projekte</li>
            <li>Austausch mit Gleichgesinnten</li>
          </ul>

          <p>Noch einfacher? Dann tritt direkt unserer WhatsApp-Community bei:</p>

          <p style="text-align: center; margin: 2rem 0;">
            <a href="https://chat.whatsapp.com/HtvynOI8sY125MmBZR4C1n"
              style="display: inline-block; background-color: #8C3974; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: bold;">
              👉 Jetzt WhatsApp-Gruppe beitreten
            </a>
          </p>

          <p style="font-size: 0.95rem; color: #555;">
            Falls du dich nicht selbst angemeldet hast, kannst du diese E-Mail einfach ignorieren oder dich jederzeit abmelden. Klicke dazu einfach auf den folgenden Link:
              <a href="${cancelUrl}"
              style="display: text-decoration: none; color: #8C3974; font-weight: bold;">
              Vom IGNITE Newsletter abmelden
            </a>
          </p>
        </div>
      `
    });
    console.log("✅ Newsletter confirmation email sent");
  } catch (err) {
    console.error("❌ Error in newsletter subscription:", err);
  }
}
async function addContactToMitmachenSegment(email, firstName, lastName) {
  try {
    console.log('👤 Adding contact to Resend with segment "Mitmachen":', email);
    const AUDIENCE_ID = process.env.AUDIENCE_ID;
    if (!AUDIENCE_ID) {
      console.error("❌ AUDIENCE_ID not configured");
      return;
    }
    await resendHolyGrail.contacts.create({
      email,
      firstName: firstName || "",
      lastName: lastName || "",
      unsubscribed: false,
      audienceId: AUDIENCE_ID
    });
    console.log("✅ Contact added to Resend audience");
  } catch (err) {
    console.error("❌ Error adding contact to Resend:", err);
    if (err.message && err.message.includes("already exists")) {
      console.log("ℹ️  Contact already exists in Resend");
    }
  }
}
const POST = async ({ request }) => {
  let client = null;
  try {
    console.log("📥 Incoming request to /api/submit");
    console.log(`📧 Configured recipients: ${adminRecipients.join(", ")}`);
    if (adminRecipients.length === 0) {
      console.error("❌ No admin recipients configured!");
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Server configuration error: No email recipients configured"
        }),
        { status: 500 }
      );
    }
    const data = await request.json();
    console.log("📑 Parsed JSON:", data);
    if (!data.email || !String(data.email).includes("@")) {
      console.warn("⚠️ Invalid or missing email");
      return new Response(
        JSON.stringify({ status: "error", message: "Gültige E-Mail-Adresse erforderlich" }),
        { status: 400 }
      );
    }
    if (!data.name || String(data.name).trim() === "") {
      console.warn("⚠️ Missing name");
      return new Response(
        JSON.stringify({ status: "error", message: "Name erforderlich" }),
        { status: 400 }
      );
    }
    const payload = {};
    for (const [field, value] of Object.entries(data)) {
      if (value !== null && value !== void 0) {
        const safeValue = toSafeString(value);
        payload[field] = encrypt(safeValue);
      }
    }
    payload.createdAt = /* @__PURE__ */ new Date();
    console.log("🔐 Payload encrypted, connecting to MongoDB...");
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const res = await db.collection("applicant").insertOne(payload);
    console.log("✅ Inserted document with _id=", res.insertedId);
    await sendApplicationEmail(data);
    await sendConfirmationEmail(data.email, data.name);
    if (data.subscribeNewsletter === true || data.subscribeNewsletter === "true") {
      console.log("📧 User wants newsletter - starting double opt-in");
      await handleNewsletterSubscription(db, data.email, data.name, data.lastname);
    } else {
      console.log("👤 User does not want newsletter - adding to Mitmachen segment");
      await addContactToMitmachenSegment(data.email, data.name, data.lastname);
    }
    return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
  } catch (error) {
    console.error("🔥 Unhandled error in POST handler:", error);
    console.error("Error stack:", error.stack);
    let errorContext = "Unknown error during application submission";
    if (error.message?.includes("encrypt")) {
      errorContext = "Encryption error - could not encrypt application data";
    } else if (error.message?.includes("MongoDB") || error.message?.includes("connect")) {
      errorContext = "Database connection error";
    } else if (error.message?.includes("insertOne")) {
      errorContext = "Database insert error";
    } else if (error.message?.includes("email") || error.message?.includes("resend")) {
      errorContext = "Email sending error";
    }
    await sendErrorEmail(`${error.message}

Stack: ${error.stack}`, errorContext);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Ein Fehler ist aufgetreten. Das Team wurde benachrichtigt."
      }),
      { status: 500 }
    );
  } finally {
    if (client) {
      try {
        await client.close();
        console.log("🔒 MongoDB connection closed");
      } catch (err) {
        console.error("❌ Error closing MongoDB connection:", err);
      }
    }
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
