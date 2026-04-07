import { Resend } from 'resend';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import 'dotenv/config';
export { renderers } from '../../renderers.mjs';

function getSubscriptionConfirmationSubject() {
  return "Bitte bestätige deine Anmeldung";
}
function getSubscriptionConfirmationEmailHTML(firstName, confirmUrl) {
  return `
    <p>Hi ${firstName},</p>
    <p>bitte bestätige deine E-Mail-Adresse, indem du auf den Link klickst:</p>
    <p><a href="${confirmUrl}">Anmeldung bestätigen</a></p>
    <p>Wenn du das nicht angefordert hast, ignoriere diese Mail.</p>
  `;
}

const prerender = false;
const resend = new Resend(process.env.RESEND_HOLY_GRAIL);
const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGODB_DB;
const POST = async ({ request }) => {
  const { firstName, lastName, email } = await request.json();
  if (!firstName || !lastName || !email) {
    return new Response("Missing fields", { status: 400 });
  }
  const token = crypto.randomBytes(24).toString("hex");
  const createdAt = /* @__PURE__ */ new Date();
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(MONGO_DB);
  await db.collection("pending_subscribers").insertOne({ firstName, lastName, email, token, createdAt });
  await client.close();
  const confirmUrl = `${process.env.SITE_URL}/api/confirm?token=${token}`;
  const subject = getSubscriptionConfirmationSubject();
  const html = getSubscriptionConfirmationEmailHTML(firstName, confirmUrl);
  await resend.emails.send({
    from: "noreply@yourdomain.com",
    to: email,
    subject,
    html
  });
  return new Response(null, { status: 204 });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
