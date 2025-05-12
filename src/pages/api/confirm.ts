// src/api/confirm.ts
import { MongoClient } from 'mongodb';
import { Resend } from 'resend';
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY!);
const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;
const SITE_URL = process.env.SITE_URL!;
const AUDIENCE_ID = process.env.AUDIENCE_ID;

export const GET = async ({ request }) => {
  const { token } = request.url.searchParams;
  
  if (!token) {
    return new Response('Token fehlt', { status: 400 });
  }

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(MONGO_DB);
  
  // Find the token in the database
  const result = await db.collection('pending_confirmations').findOneAndDelete({ token });

  if (!result || !result.value) {
    return new Response('Ungültiger oder abgelaufener Token', { status: 404 });
  }

  const { email } = result.value;

  // Add user to the contacts collection in your DB
  await db.collection('contacts').insertOne({
    email,
    subscribedAt: new Date(),
  });

  // Create the contact in Resend
  try {
    await resend.contacts.create({
      email: email,
      unsubscribed: false,  // Assuming the user has confirmed subscription
      audienceId: process.env.AUDIENCE_ID,  // Replace with your actual Audience ID
    });
    console.log(`Contact created in Resend for ${email}`);
  } catch (error) {
    console.error('Error creating contact in Resend:', error);
  }

  // Send confirmation email to the user
  await resend.emails.send({
    from: 'news@ignite-startupclub.de',
    to: email,
    subject: 'Danke für deine Bestätigung!',
    html: `<p>Danke! Du hast dich erfolgreich für unseren Newsletter angemeldet.</p>`,
  });

  return new Response('Erfolgreich bestätigt', { status: 200 });
};