import { c as createComponent, a as createAstro, r as renderComponent, b as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_BR_yo3lg.mjs';
import 'kleur/colors';
import { $ as $$DefaultLayout } from '../chunks/DefaultLayout_BE8JjL70.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$404 = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$404;
  return renderTemplate`${renderComponent($$result, "DefaultLayout", $$DefaultLayout, { "title": "404" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="my-12"> <div class="container"> <h1>404</h1> </div> </section> <section class="my-12"> <div class="space-content container"> <p class="text-2xl">This page does not exist. Don't worry though, we got you.</p> <a class="button" href="/">Let's get you home Astronout 🚀</a> </div> </section> ` })}`;
}, "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/pages/404.astro", void 0);

const $$file = "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/pages/404.astro";
const $$url = "/404";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$404,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
