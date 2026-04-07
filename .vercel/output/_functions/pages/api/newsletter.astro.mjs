import { v4 } from 'uuid';
import { Resend } from 'resend';
import { MongoClient } from 'mongodb';
import 'dotenv/config';
export { renderers } from '../../renderers.mjs';

function getWelcomeNewsletterSubject() {
  return "Willkommen im IGNITE Newsletter!";
}
function getWelcomeNewsletterEmailHTML(firstName) {
  const greeting = firstName ? `Hallo ${firstName}` : "Hallo";
  return `
    <div style="font-family: Inter, sans-serif; background-color: #f9f9f9; padding: 2rem; border-radius: 8px; color: #333; max-width: 600px; margin: auto;">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <h1 style="color: #8C3974; margin-bottom: 0.5rem; font-size: 1.75rem;">Willkommen im IGNITE Newsletter!</h1>
      </div>

      <p style="font-size: 1.1rem;">${greeting},</p>

      <p>deine Anmeldung zum IGNITE Newsletter ist jetzt bestätigt. Ab sofort erhältst du regelmäßig Updates zu:</p>

      <ul style="line-height: 1.8; padding-left: 1.5rem;">
        <li><strong>Events & Workshops</strong> – Erfahre als Erste:r von unseren Veranstaltungen</li>
        <li><strong>Startup-Insights</strong> – Exklusive Einblicke in die Gründerszene</li>
        <li><strong>Community-News</strong> – Was bei IGNITE passiert</li>
        <li><strong>Karrierechancen</strong> – Praktika und Jobs im Startup-Umfeld</li>
      </ul>

      <div style="background: linear-gradient(135deg, rgba(140, 57, 116, 0.1) 0%, rgba(140, 57, 116, 0.15) 100%); padding: 1.5rem; border-radius: 8px; margin: 2rem 0; text-align: center;">
        <p style="margin: 0 0 1rem 0; font-weight: 600;">Noch näher dran?</p>
        <p style="margin: 0 0 1rem 0;">Tritt unserer WhatsApp-Community bei und vernetze dich direkt mit Gleichgesinnten!</p>
        <a href="https://chat.whatsapp.com/HtvynOI8sY125MmBZR4C1n"
           style="display: inline-block; background-color: #8C3974; color: #fff; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: bold;">
          WhatsApp-Gruppe beitreten
        </a>
      </div>

      <p>Folge uns auch auf Social Media:</p>
      <p style="margin-bottom: 2rem;">
        <a href="https://www.instagram.com/ignite_leuphana/" style="color: #8C3974; text-decoration: none; font-weight: 500;">Instagram: @ignite_leuphana</a>
        &nbsp;|&nbsp;
        <a href="https://www.linkedin.com/company/ignite-startup-club/" style="color: #8C3974; text-decoration: none; font-weight: 500;">LinkedIn</a>
      </p>

      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #ddd;" />

      <p style="font-size: 0.9rem; color: #666;">
        Wir freuen uns, dich in unserer Community zu haben!
      </p>
      <p style="font-size: 0.9rem; color: #666; margin-bottom: 0;">
        Dein IGNITE Team
      </p>

      <p style="font-size: 0.8rem; color: #aaa; margin-top: 2rem;">
        Du kannst dich jederzeit vom Newsletter abmelden, indem du auf den Abmelde-Link in unseren E-Mails klickst.
      </p>
    </div>
  `;
}

const prerender = false;
const resend = new Resend(process.env.RESEND_HOLY_GRAIL);
const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGODB_DB;
const SITE_URL = process.env.SITE_URL;
const AUDIENCE_ID = process.env.AUDIENCE_ID;
let client = null;
const getDb = async () => {
  if (!client) {
    try {
      console.log("Connecting to MongoDB...");
      const url = new URL(MONGO_URI);
      console.log(`MongoDB URI parsed: ${url.hostname}, ${url.pathname}`);
      client = new MongoClient(MONGO_URI);
      console.log("Attempting to connect to MongoDB...");
      await client.connect();
      console.log("MongoDB connected successfully.");
      const db = client.db(MONGO_DB);
      await db.collection("pending_confirmations").createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 86400 }
        // 24 hours = 86400 seconds
      );
      console.log("TTL index created/verified for pending_confirmations");
    } catch (err) {
      console.error("MongoDB connection error:", err);
      if (err instanceof Error) {
        console.error("Error stack trace:", err.stack);
      }
      throw new Error("MongoDB connection failed");
    }
  }
  console.log(`Returning connected database: ${MONGO_DB}`);
  return client.db(MONGO_DB);
};
const POST = async ({ request }) => {
  try {
    console.log("Received request to newsletter API");
    const { email, firstName, lastName, isConfirming } = await request.json();
    console.log("Request data:", { email, firstName, lastName, isConfirming });
    if (!email || typeof email !== "string" || !email.includes("@")) {
      console.log("Invalid email address:", email);
      return new Response(JSON.stringify({ message: "Ungültige E-Mail-Adresse." }), { status: 400 });
    }
    const db = await getDb();
    if (isConfirming) {
      console.log("Processing confirmation for:", email);
      try {
        const pendingConfirmation = await db.collection("pending_confirmations").findOne({ email });
        if (!pendingConfirmation) {
          console.log("No pending confirmation found for email:", email);
          return new Response(JSON.stringify({
            message: "Keine ausstehende Bestätigung gefunden."
          }), { status: 404 });
        }
        console.log("Creating contact in Resend with data:", {
          email,
          firstName,
          lastName,
          audienceId: AUDIENCE_ID
        });
        const resendResponse = await resend.contacts.create({
          email,
          firstName: firstName || pendingConfirmation.firstName || "",
          lastName: lastName || pendingConfirmation.lastName || "",
          unsubscribed: false,
          audienceId: AUDIENCE_ID
        });
        console.log("Contact added to Resend successfully:", resendResponse);
        await db.collection("pending_confirmations").deleteOne({ email });
        console.log("Removed from pending confirmations");
        const confirmedFirstName = firstName || pendingConfirmation.firstName || "";
        console.log("Sending welcome email to:", email);
        await resend.emails.send({
          from: "IGNITE Startup Club <news@ignite-startupclub.de>",
          to: email,
          subject: getWelcomeNewsletterSubject(),
          html: getWelcomeNewsletterEmailHTML(confirmedFirstName)
        });
        console.log("Welcome email sent successfully");
        return new Response(JSON.stringify({
          message: "Newsletter-Anmeldung bestätigt! Willkommen beim IGNITE Startup Club!"
        }), { status: 200 });
      } catch (error) {
        console.error("Error processing confirmation:", error);
        if (error instanceof Error && error.message.includes("already exists")) {
          console.log("Email already exists in Resend, removing from pending...");
          await db.collection("pending_confirmations").deleteOne({ email });
          return new Response(JSON.stringify({
            message: "E-Mail bereits bestätigt!"
          }), { status: 200 });
        }
        return new Response(JSON.stringify({
          message: "Fehler bei der Bestätigung. Bitte versuche es erneut.",
          error: error instanceof Error ? error.message : "Unknown error"
        }), { status: 500 });
      }
    } else {
      console.log("Processing initial subscription for:", email);
      const existingPending = await db.collection("pending_confirmations").findOne({ email });
      if (existingPending) {
        console.log("Email already has pending confirmation:", email);
        return new Response(JSON.stringify({
          message: "Eine Bestätigungsmail wurde bereits gesendet. Bitte prüfe dein Postfach."
        }), { status: 400 });
      }
      const token = v4();
      const confirmUrl = `${SITE_URL}/subscribe?token=${token}`;
      console.log("Generated confirmation URL:", confirmUrl);
      const cancelUrl = `${SITE_URL}/subscribe?cancel=${email}`;
      console.log("Storing confirmation data in MongoDB");
      await db.collection("pending_confirmations").insertOne({
        email,
        firstName: firstName || "",
        lastName: lastName || "",
        token,
        createdAt: /* @__PURE__ */ new Date()
      });
      console.log("Confirmation data stored in DB successfully");
      console.log("Sending confirmation email...");
      await resend.emails.send({
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
      console.log("Confirmation email sent successfully");
      return new Response(JSON.stringify({ message: "Bestätigungsmail gesendet" }), { status: 200 });
    }
  } catch (err) {
    console.error("Error occurred:", err);
    return new Response(JSON.stringify({ message: "Fehler beim E-Mail-Versand" }), { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
