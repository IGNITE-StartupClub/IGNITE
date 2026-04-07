import { q as questionnaireConfig } from '../../chunks/questionnaireConfig_DByeS1Q7.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async () => {
  try {
    return new Response(JSON.stringify(questionnaireConfig), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error loading questionnaire config:", error);
    return new Response(
      JSON.stringify({ error: "Failed to load questionnaire configuration" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
