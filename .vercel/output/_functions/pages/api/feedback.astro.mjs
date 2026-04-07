import { MongoClient } from 'mongodb';
import 'dotenv/config';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGODB_DB;
let client = null;
const getDb = async () => {
  if (!client) {
    try {
      client = new MongoClient(MONGO_URI);
      await client.connect();
      console.log("MongoDB connected for feedback");
    } catch (err) {
      console.error("MongoDB connection error:", err);
      throw new Error("MongoDB connection failed");
    }
  }
  return client.db(MONGO_DB);
};
const POST = async ({ request }) => {
  try {
    const data = await request.json();
    console.log("Received feedback submission:", {
      firstName: data.firstName,
      event: data.event,
      subscribeNewsletter: data.subscribeNewsletter
    });
    if (!data.firstName || !data.lastName || !data.event || !data.feedback) {
      return new Response(JSON.stringify({
        message: "Bitte fülle alle Pflichtfelder aus."
      }), { status: 400 });
    }
    if (data.subscribeNewsletter && !data.email) {
      return new Response(JSON.stringify({
        message: "Bitte gib eine E-Mail-Adresse für den Newsletter an."
      }), { status: 400 });
    }
    const db = await getDb();
    const feedbackDoc = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      event: data.event.trim(),
      feedback: data.feedback.trim(),
      consentToPublish: Boolean(data.consentToPublish),
      subscribedNewsletter: Boolean(data.subscribeNewsletter),
      notifiedAt: null,
      // Will be set when digest email is sent
      createdAt: /* @__PURE__ */ new Date()
    };
    const result = await db.collection("feedbacks").insertOne(feedbackDoc);
    console.log("Feedback stored with id:", result.insertedId);
    if (data.subscribeNewsletter && data.email) {
      try {
        console.log("Triggering newsletter subscription for:", data.email);
        const newsletterResponse = await fetch(`${process.env.SITE_URL || "http://localhost:4321"}/api/newsletter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName
          })
        });
        if (newsletterResponse.ok) {
          console.log("Newsletter subscription initiated successfully");
        } else {
          console.error("Newsletter subscription failed:", await newsletterResponse.text());
        }
      } catch (newsletterError) {
        console.error("Error triggering newsletter subscription:", newsletterError);
      }
    }
    return new Response(JSON.stringify({
      message: "Vielen Dank für dein Feedback!",
      id: result.insertedId
    }), { status: 200 });
  } catch (err) {
    console.error("Error processing feedback:", err);
    return new Response(JSON.stringify({
      message: "Fehler beim Speichern des Feedbacks"
    }), { status: 500 });
  }
};
const GET = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");
    if (secret !== process.env.FEEDBACK_DIGEST_SECRET) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
    }
    const db = await getDb();
    const pendingFeedbacks = await db.collection("feedbacks").find({ notifiedAt: null }).sort({ createdAt: -1 }).toArray();
    return new Response(JSON.stringify({
      count: pendingFeedbacks.length,
      feedbacks: pendingFeedbacks
    }), { status: 200 });
  } catch (err) {
    console.error("Error fetching feedbacks:", err);
    return new Response(JSON.stringify({
      message: "Fehler beim Abrufen der Feedbacks"
    }), { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
