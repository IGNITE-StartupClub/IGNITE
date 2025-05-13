import { MongoClient } from 'mongodb';
import 'dotenv/config';

const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;

let client: MongoClient | null = null;

const getDb = async () => {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
  }
  return client.db(MONGO_DB);
};

export const GET = async ({ request }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response('Token fehlt', { status: 400 });
  }

  const db = await getDb();
  const result = await db.collection('pending_confirmations').findOne({ token });

  if (!result) {
    return new Response('Ungültiger oder abgelaufener Token', { status: 404 });
  }

  const { email, firstName, lastName } = result;

  // Check if the user has confirmed
  const confirmed = result.confirmed ? result.confirmed : null;

  return new Response(
    JSON.stringify({
      email,
      firstName,
      lastName,
      confirmed
    }),
    { status: 200 }
  );
};