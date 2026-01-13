export const prerender = false

// /api/unsubscribe.js (or .ts if using TypeScript)
import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_HOLY_GRAIL);
const AUDIENCE_ID = process.env.AUDIENCE_ID!;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    console.log('Unsubscribing user:', email);

    // Remove contact by email
    await resend.contacts.remove({
      email: email,
      audienceId: AUDIENCE_ID,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    return new Response(JSON.stringify({ error: 'Failed to unsubscribe' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};