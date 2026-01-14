export const prerender = false

import type { APIRoute } from 'astro';
import { MongoClient } from 'mongodb';
import 'dotenv/config';

const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;

let client: MongoClient | null = null;

const getDb = async () => {
  if (!client) {
    try {
      client = new MongoClient(MONGO_URI);
      await client.connect();
      console.log('MongoDB connected for feedback');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      throw new Error('MongoDB connection failed');
    }
  }
  return client.db(MONGO_DB);
};

interface FeedbackData {
  firstName: string;
  lastName: string;
  event: string;
  feedback: string;
  consentToPublish: boolean;
  subscribeNewsletter: boolean;
  email?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: FeedbackData = await request.json();
    console.log('Received feedback submission:', {
      firstName: data.firstName,
      event: data.event,
      subscribeNewsletter: data.subscribeNewsletter
    });

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.event || !data.feedback) {
      return new Response(JSON.stringify({
        message: 'Bitte fülle alle Pflichtfelder aus.'
      }), { status: 400 });
    }

    // If subscribing to newsletter, email is required
    if (data.subscribeNewsletter && !data.email) {
      return new Response(JSON.stringify({
        message: 'Bitte gib eine E-Mail-Adresse für den Newsletter an.'
      }), { status: 400 });
    }

    const db = await getDb();

    // Store feedback in MongoDB
    const feedbackDoc = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      event: data.event.trim(),
      feedback: data.feedback.trim(),
      consentToPublish: Boolean(data.consentToPublish),
      subscribedNewsletter: Boolean(data.subscribeNewsletter),
      notifiedAt: null, // Will be set when digest email is sent
      createdAt: new Date()
    };

    const result = await db.collection('feedbacks').insertOne(feedbackDoc);
    console.log('Feedback stored with id:', result.insertedId);

    // If user wants to subscribe to newsletter, trigger the newsletter API
    if (data.subscribeNewsletter && data.email) {
      try {
        console.log('Triggering newsletter subscription for:', data.email);

        // Make internal request to newsletter API
        const newsletterResponse = await fetch(`${process.env.SITE_URL || 'http://localhost:4321'}/api/newsletter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName
          })
        });

        if (newsletterResponse.ok) {
          console.log('Newsletter subscription initiated successfully');
        } else {
          console.error('Newsletter subscription failed:', await newsletterResponse.text());
          // Don't fail the whole request, just log the error
        }
      } catch (newsletterError) {
        console.error('Error triggering newsletter subscription:', newsletterError);
        // Don't fail the whole request, feedback was still saved
      }
    }

    return new Response(JSON.stringify({
      message: 'Vielen Dank für dein Feedback!',
      id: result.insertedId
    }), { status: 200 });

  } catch (err) {
    console.error('Error processing feedback:', err);
    return new Response(JSON.stringify({
      message: 'Fehler beim Speichern des Feedbacks'
    }), { status: 500 });
  }
};

// GET endpoint to retrieve feedbacks that haven't been notified yet (for digest)
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');

    // Simple secret check for the digest function
    if (secret !== process.env.FEEDBACK_DIGEST_SECRET) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    }

    const db = await getDb();

    // Get all feedbacks that haven't been notified yet
    const pendingFeedbacks = await db.collection('feedbacks')
      .find({ notifiedAt: null })
      .sort({ createdAt: -1 })
      .toArray();

    return new Response(JSON.stringify({
      count: pendingFeedbacks.length,
      feedbacks: pendingFeedbacks
    }), { status: 200 });

  } catch (err) {
    console.error('Error fetching feedbacks:', err);
    return new Response(JSON.stringify({
      message: 'Fehler beim Abrufen der Feedbacks'
    }), { status: 500 });
  }
};
