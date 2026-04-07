import { d as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, g as renderSlot } from './astro/server_BPXzsi7f.mjs';
import 'piccolore';
import { $ as $$DefaultLayout } from './DefaultLayout_BmucUl1h.mjs';

const $$Astro = createAstro("https://ignite-startupclub.de");
const $$MarkdownLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$MarkdownLayout;
  const { frontmatter } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "DefaultLayout", $$DefaultLayout, { "title": frontmatter.title, "description": frontmatter.description?.substring(0, 160) ?? "Ignite Startup Club L\xFCneburg" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="container"> <div class="space-content my-12"> ${renderSlot($$result2, $$slots["default"])} </div> </div> ` })}`;
}, "/Users/silaskruckenberg/Documents/University/Leuphana/IGNITE CI/Website/IGNITE/src/layouts/MarkdownLayout.astro", void 0);

export { $$MarkdownLayout as $ };
