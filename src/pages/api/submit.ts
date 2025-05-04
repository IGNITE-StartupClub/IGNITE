import type { APIRoute } from 'astro';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import 'dotenv/config'
import nodemailer from 'nodemailer';  // Für den Versand von E-Mails

const uri = process.env.MONGODB_URI!;
const secret = process.env.ENCRYPTION_SECRET!;
const emailRecipient = process.env.EMAIL_RECIPIENT!; // Die E-Mail-Adresse, an die die Formulardaten gesendet werden sollen

// Funktion zum Verschlüsseln der Daten
function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), iv);
  let enc = cipher.update(text, 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + enc + ':' + tag.toString('hex');
}

// Funktion zum Senden der E-Mail
const sendFormEmail = async (data: any) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,  // Dein Gmail-Benutzername
      pass: process.env.GMAIL_APP_PASSWORD,  // Dein Gmail-App-Passwort
    },
  });


  const mailOptions = {
    from: process.env.GMAIL_USER,  // Der Absender der E-Mail
    to: `${process.env.EMAIL_RECIPIENT_1},${process.env.EMAIL_RECIPIENT_2}`,  // Die Empfänger-Adresse für die Formulardaten
    subject: 'Neue Bewerbung eingegangen',
    html: `
      <h2>Neue Bewerbung:</h2>
      <p><strong>Position:</strong> ${data.position}</p>
      <p><strong>Was reizt dich an der Position?</strong> ${data.q1}</p>
      <p><strong>Welche Erfahrungen hast du?</strong> ${data.q2}</p>
      <p><strong>Welche Stärken kannst du einbringen?</strong> ${data.q3}</p>
      <p><strong>Wie viel Zeit kannst du investieren?</strong> ${data.q4}</p>
      <p><strong>Wie gehst du mit Struktur-Unsicherheit um?</strong> ${data.q5}</p>
      <p><strong>Vorname:</strong> ${data.name}</p>
      <p><strong>Nachname:</strong> ${data.lastname}</p>
      <p><strong>E-Mail:</strong> ${data.email}</p>
    `,  // HTML-Format für die E-Mail
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Formular-E-Mail gesendet.');
  } catch (err) {
    console.error('Fehler beim Senden der E-Mail:', err);
  }
};

// Funktion zum Senden einer Fehler-E-Mail
const sendErrorEmail = async (errorMessage: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',  // Gmail als Service
    auth: {
      user: process.env.GMAIL_USER,  // Dein Gmail-Benutzername
      pass: process.env.GMAIL_APP_PASSWORD,  // Dein Gmail-App-Passwort (aus Schritt 2)
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,  // Der Absender der E-Mail
    to: emailRecipient,  // Die Empfänger-Adresse für Fehler
    subject: 'Fehler bei der Datenbankanfrage',
    html: `
      <p><strong>Ein Fehler ist aufgetreten:</strong></p>
      <p>${errorMessage}</p>
      <p><strong>Bitte überprüfe die Datenbankverbindung oder die API-Konfiguration.</strong></p>
      <p><i>Dies ist eine automatisch generierte E-Mail, bitte nicht antworten.</i></p>
    `,  // HTML-Format für die E-Mail
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Fehler-E-Mail gesendet.');
  } catch (err) {
    console.error('Fehler beim Senden der Fehler-E-Mail:', err);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Verschlüsselung der übermittelten Daten
    const payload = {
      q1: encrypt(data.q1),
      q2: encrypt(data.q2),
      name: encrypt(data.name),
      lastname: encrypt(data.lastname),
      email: encrypt(data.email),
      createdAt: new Date(),
    };

    // MongoDB-Daten speichern
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'ignite');
    await db.collection('applicant').insertOne(payload);
    await client.close();

    // E-Mail senden
    await sendFormEmail(data);

    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
  } catch (error) {
    console.error('Fehler bei der Datenbankanfrage:', error);

    // Fehler-E-Mail senden
    await sendErrorEmail(error.message);

    return new Response(JSON.stringify({ status: 'error', message: error.message }), { status: 500 });
  }
};