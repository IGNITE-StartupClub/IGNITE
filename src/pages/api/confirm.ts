import { MongoClient } from 'mongodb';
import 'dotenv/config';

const MONGO_URI = process.env.MONGODB_URI!;
const MONGO_DB = process.env.MONGODB_DB!;

let client: MongoClient | null = null;

const getDb = async () => {
  if (!client) {
    try {
      console.log('Connecting to MongoDB in confirm.ts...');
      client = new MongoClient(MONGO_URI);
      await client.connect();
      console.log('MongoDB connected successfully in confirm.ts');
    } catch (error) {
      console.error('MongoDB connection error in confirm.ts:', error);
      throw error;
    }
  }
  return client.db(MONGO_DB);
};

export const GET = async ({ request }) => {
  try {
    console.log('Confirm API called');
    
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    
    console.log('Token received:', token);
    
    if (!token) {
      console.log('No token provided');
      return new Response(JSON.stringify({ 
        error: 'Token fehlt' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const db = await getDb();
    console.log('Database connected, searching for token...');
    
    const result = await db.collection('pending_confirmations').findOne({ token });
    console.log('Database query result:', result);
    
    if (!result) {
      console.log('Token not found or expired:', token);
      return new Response(JSON.stringify({ 
        error: 'Ungültiger oder abgelaufener Token' 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { email, firstName, lastName } = result;
    console.log('Found user data:', { email, firstName, lastName });
    
    // Check if the user has confirmed
    const confirmed = result.confirmed ? result.confirmed : null;
    
    const responseData = {
      email: email || '',
      firstName: firstName || '',
      lastName: lastName || '',
      confirmed: confirmed
    };
    
    console.log('Sending response:', responseData);
    
    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in confirm API:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};