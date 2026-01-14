import type { Config, Context } from "@netlify/functions";
import { MongoClient, ObjectId } from 'mongodb';
import { Resend } from 'resend';
import { getFeedbackDigestEmailHTML, getFeedbackDigestSubject, type FeedbackItem } from '../../src/templates/emails/feedbackDigestEmail';

const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const EMAIL_RECIPIENT_1 = process.env.EMAIL_RECIPIENT_1!;
const EMAIL_RECIPIENT_2 = process.env.EMAIL_RECIPIENT_2;

let client: MongoClient | null = null;

const getDb = async () => {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
  }
  return client.db(MONGO_DB);
};

export default async (req: Request, context: Context) => {
  console.log('Feedback digest function started at:', new Date().toISOString());

  try {
    const db = await getDb();

    // Get all feedbacks that haven't been notified yet
    const pendingFeedbacks = await db.collection('feedbacks')
      .find({ notifiedAt: null })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`Found ${pendingFeedbacks.length} pending feedbacks`);

    if (pendingFeedbacks.length === 0) {
      console.log('No new feedbacks to notify');
      return new Response(JSON.stringify({
        message: 'No new feedbacks',
        count: 0
      }), { status: 200 });
    }

    // Prepare recipients
    const recipients = [EMAIL_RECIPIENT_1, EMAIL_RECIPIENT_2].filter(Boolean) as string[];

    if (recipients.length === 0) {
      console.error('No email recipients configured');
      return new Response(JSON.stringify({
        message: 'No recipients configured'
      }), { status: 500 });
    }

    // Transform to FeedbackItem format
    const feedbackItems: FeedbackItem[] = pendingFeedbacks.map(fb => ({
      firstName: fb.firstName,
      lastName: fb.lastName,
      event: fb.event,
      feedback: fb.feedback,
      consentToPublish: fb.consentToPublish,
      createdAt: fb.createdAt
    }));

    // Send digest email
    const resend = new Resend(RESEND_API_KEY);

    const emailResult = await resend.emails.send({
      from: 'IGNITE Feedback <kontakt@ignite-startupclub.de>',
      to: recipients,
      subject: getFeedbackDigestSubject(feedbackItems.length),
      html: getFeedbackDigestEmailHTML(feedbackItems)
    });

    console.log('Digest email sent:', emailResult);

    // Mark all feedbacks as notified
    const feedbackIds = pendingFeedbacks.map(fb => fb._id);
    const updateResult = await db.collection('feedbacks').updateMany(
      { _id: { $in: feedbackIds } },
      { $set: { notifiedAt: new Date() } }
    );

    console.log(`Updated ${updateResult.modifiedCount} feedbacks as notified`);

    return new Response(JSON.stringify({
      message: 'Digest sent successfully',
      count: pendingFeedbacks.length,
      recipients: recipients.length
    }), { status: 200 });

  } catch (error) {
    console.error('Error in feedback digest:', error);
    return new Response(JSON.stringify({
      message: 'Error processing digest',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500 });
  } finally {
    // Close MongoDB connection
    if (client) {
      await client.close();
      client = null;
    }
  }
};

// Netlify scheduled function configuration
// Runs at 23:00 (11 PM) every day in Europe/Berlin timezone
export const config: Config = {
  schedule: "0 23 * * *"
};
