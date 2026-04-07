import { MongoClient } from 'mongodb';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    const start = Date.now();
    await client.connect();
    await client.db(process.env.MONGODB_DB).command({ ping: 1 });
    const latencyMs = Date.now() - start;
    return new Response(
      JSON.stringify({ status: "ok", db: "connected", latencyMs, ts: (/* @__PURE__ */ new Date()).toISOString() }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", message: err.message, ts: (/* @__PURE__ */ new Date()).toISOString() }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await client.close();
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
