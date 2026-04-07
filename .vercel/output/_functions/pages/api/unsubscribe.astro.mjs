import { Resend } from 'resend';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const resend = new Resend(process.env.RESEND_HOLY_GRAIL);
const AUDIENCE_ID = process.env.AUDIENCE_ID;
const POST = async ({ request }) => {
  try {
    const { email } = await request.json();
    console.log("Unsubscribing user:", email);
    await resend.contacts.remove({
      email,
      audienceId: AUDIENCE_ID
    });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error unsubscribing user:", error);
    return new Response(JSON.stringify({ error: "Failed to unsubscribe" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
