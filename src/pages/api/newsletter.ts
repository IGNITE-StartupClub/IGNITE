import { v4 as uuidv4 } from 'uuid';  // Import the uuid module
import { Resend } from 'resend';
import { MongoClient } from 'mongodb';
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_HOLY_GRAIL!);
const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;
const SITE_URL = process.env.SITE_URL!;
const AUDIENCE_ID = process.env.AUDIENCE_ID!;

let client: MongoClient | null = null;

// Initialize MongoDB client connection
const getDb = async () => {
  if (!client) {
    try {
      console.log('Connecting to MongoDB...');

      // Logging more details before attempting to connect
      const url = new URL(MONGO_URI);
      console.log(`MongoDB URI parsed: ${url.hostname}, ${url.pathname}`);

      // Attempting to create a new MongoDB client and connect
      client = new MongoClient(MONGO_URI);
      console.log('Attempting to connect to MongoDB...');
      await client.connect();
      console.log('MongoDB connected successfully.');

      // Create TTL index for automatic deletion after 24 hours
      const db = client.db(MONGO_DB);
      await db.collection('pending_confirmations').createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 86400 } // 24 hours = 86400 seconds
      );
      console.log('TTL index created/verified for pending_confirmations');

    } catch (err) {
      // Enhanced error logging with stack trace
      console.error('MongoDB connection error:', err);
      if (err instanceof Error) {
        console.error('Error stack trace:', err.stack);
      }
      throw new Error('MongoDB connection failed');
    }
  }

  // Log the database connection confirmation
  console.log(`Returning connected database: ${MONGO_DB}`);
  return client.db(MONGO_DB);
};
  
export const POST = async ({ request }) => {
  try {
    console.log('Received request to newsletter API');

    // Parse the request body
    const { email, firstName, lastName, isConfirming } = await request.json();
    console.log('Request data:', { email, firstName, lastName, isConfirming });

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.log('Invalid email address:', email);
      return new Response(JSON.stringify({ message: 'Ungültige E-Mail-Adresse.' }), { status: 400 });
    }

    const db = await getDb();

    if (isConfirming) {
      // This is a confirmation request - add contact to Resend with full details
      console.log('Processing confirmation for:', email);
      
      try {
        // Find the original subscription data to ensure we have the correct token
        const pendingConfirmation = await db.collection('pending_confirmations').findOne({ email });
        
        if (!pendingConfirmation) {
          console.log('No pending confirmation found for email:', email);
          return new Response(JSON.stringify({ 
            message: 'Keine ausstehende Bestätigung gefunden.' 
          }), { status: 404 });
        }
        
        // Create contact in Resend
        console.log('Creating contact in Resend with data:', {
          email,
          firstName,
          lastName,
          audienceId: AUDIENCE_ID
        });
        
        const resendResponse = await resend.contacts.create({
          email: email,
          firstName: firstName || pendingConfirmation.firstName || '',
          lastName: lastName || pendingConfirmation.lastName || '',
          unsubscribed: false,
          audienceId: AUDIENCE_ID,
        });
        
        console.log('Contact added to Resend successfully:', resendResponse);

        // Remove from pending confirmations immediately after successful confirmation
        await db.collection('pending_confirmations').deleteOne({ email });
        console.log('Removed from pending confirmations');
        
        return new Response(JSON.stringify({ 
          message: 'Newsletter-Anmeldung bestätigt! Willkommen beim IGNITE Startup Club!' 
        }), { status: 200 });
      } catch (error) {
        console.error('Error processing confirmation:', error);

        // Check if it's a duplicate email error from Resend
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log('Email already exists in Resend, removing from pending...');
          await db.collection('pending_confirmations').deleteOne({ email });
          return new Response(JSON.stringify({
            message: 'E-Mail bereits bestätigt!'
          }), { status: 200 });
        }

        return new Response(JSON.stringify({
          message: 'Fehler bei der Bestätigung. Bitte versuche es erneut.',
          error: error instanceof Error ? error.message : 'Unknown error'
        }), { status: 500 });
      }
    } else {
      // This is an initial subscription - send confirmation email
      console.log('Processing initial subscription for:', email);
      
      // Check if email already exists in pending confirmations
      const existingPending = await db.collection('pending_confirmations').findOne({ email });
      if (existingPending) {
        console.log('Email already has pending confirmation:', email);
        return new Response(JSON.stringify({ 
          message: 'Eine Bestätigungsmail wurde bereits gesendet. Bitte prüfe dein Postfach.' 
        }), { status: 400 });
      }
      
      // Generate a token using UUID (v4)
      const token = uuidv4();
      const confirmUrl = `${SITE_URL}/subscribe?token=${token}`;
      console.log('Generated confirmation URL:', confirmUrl);

      const cancelUrl = `${SITE_URL}/subscribe?cancel=${email}`;

      // Store token and email in DB with additional data
      console.log('Storing confirmation data in MongoDB');
      await db.collection('pending_confirmations').insertOne({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        token,
        createdAt: new Date(),
      });
      console.log('Confirmation data stored in DB successfully');

      // Send confirmation email
      console.log('Sending confirmation email...');
      await resend.emails.send({
        from: 'IGNITE Startup Club <news@ignite-startupclub.de>',
        to: email,
        subject: 'Willkommen beim IGNITE Startup Club!',
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
        `,
      });
      console.log('Confirmation email sent successfully');

      return new Response(JSON.stringify({ message: 'Bestätigungsmail gesendet' }), { status: 200 });
    }
  } catch (err) {
    console.error('Error occurred:', err);
    return new Response(JSON.stringify({ message: 'Fehler beim E-Mail-Versand' }), { status: 500 });
  }
};