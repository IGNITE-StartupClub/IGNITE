import { c as createComponent, a as createAstro, r as renderComponent, b as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_BR_yo3lg.mjs';
import 'kleur/colors';
import { $ as $$DefaultLayout, a as $$Accordion, b as $$AccordionItem, c as $$Avatar, d as $$AvatarGroup, e as $$Badge, f as $$Breadcrumbs, g as $$BreadcrumbsItem, h as $$Icon, i as $$Card, j as $$DarkMode, k as $$Media, l as $$Modal, m as $$Notification, n as $$Pagination, o as $$Tabs, p as $$TabsList, q as $$TabsTab, r as $$TabsPanel, s as $$Video } from '../chunks/DefaultLayout_BE8JjL70.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$AccessibleComponents = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AccessibleComponents;
  return renderTemplate`${renderComponent($$result, "DefaultLayout", $$DefaultLayout, { "title": "Accessible Components" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="my-12"> <div class="space-content container"> <h1>Accessible Components</h1> <p class="text-2xl">
This theme has a lot of extra a11y components provided by the <a href="https://github.com/markteekman/accessible-astro-components">Accessible Astro Components</a> NPM package to help you build accessible pages faster. To learn more about the components and how to use them,
        checkout our <a href="https://accessible-astro.incluud.dev/">documentation website</a>.
</p> </div> </section> <section class="mb-12 mt-32"> <div class="container"> <div class="grid grid-cols-1 gap-32 md:grid-cols-2"> <div class="space-content"> <h2>Accordion (default)</h2> ${renderComponent($$result2, "Accordion", $$Accordion, {}, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "AccordionItem", $$AccordionItem, { "title": "First Item" }, { "default": ($$result4) => renderTemplate` <p>
Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quasi nobis optio? Qui in quo
                accusantium debitis <a href="#">sapiente obcaecati</a> magnam incidunt sit. Molestiae exercitationem quibusdam
                quod veritatis laboriosam est tenetur.
</p> <a href="#">Tab to me!</a> ` })} ${renderComponent($$result3, "AccordionItem", $$AccordionItem, { "title": "Second Item" }, { "default": ($$result4) => renderTemplate` <p>
Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quasi nobis optio? Qui in quo
                accusantium debitis sapiente obcaecati magnam incidunt sit. Molestiae exercitationem quibusdam quod
                veritatis laboriosam est tenetur.
</p> ` })} ${renderComponent($$result3, "AccordionItem", $$AccordionItem, { "title": "Third Item" }, { "default": ($$result4) => renderTemplate` <p>
Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quasi nobis optio? Qui in quo
                accusantium debitis sapiente obcaecati magnam incidunt sit. Molestiae exercitationem quibusdam quod
                veritatis laboriosam est tenetur.
</p> ` })} ${renderComponent($$result3, "AccordionItem", $$AccordionItem, { "title": "Fourth Item" }, { "default": ($$result4) => renderTemplate` <p>
Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quasi nobis optio? Qui in quo
                accusantium debitis sapiente obcaecati magnam incidunt sit. Molestiae exercitationem quibusdam quod
                veritatis laboriosam est tenetur.
</p> ` })} ${renderComponent($$result3, "AccordionItem", $$AccordionItem, { "title": "Fifth Item" }, { "default": ($$result4) => renderTemplate` <p>
Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quasi nobis optio? Qui in quo
                accusantium debitis sapiente obcaecati magnam incidunt sit. Molestiae exercitationem quibusdam quod
                veritatis laboriosam est tenetur.
</p> ` })} ` })} </div> <div class="space-content"> <h2>Accordion (chevron)</h2> ${renderComponent($$result2, "Accordion", $$Accordion, {}, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "AccordionItem", $$AccordionItem, { "name": "exclusive", "title": "First Item", "variant": "chevron" }, { "default": ($$result4) => renderTemplate` <p>
Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quasi nobis optio? Qui in quo
                accusantium debitis <a href="#">sapiente obcaecati</a> magnam incidunt sit. Molestiae exercitationem quibusdam
                quod veritatis laboriosam est tenetur.
</p> <a href="#">Tab to me!</a> ` })} ${renderComponent($$result3, "AccordionItem", $$AccordionItem, { "name": "exclusive", "title": "Second Item", "variant": "chevron" }, { "default": ($$result4) => renderTemplate` <p>
Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quasi nobis optio? Qui in quo
                accusantium debitis sapiente obcaecati magnam incidunt sit. Molestiae exercitationem quibusdam quod
                veritatis laboriosam est tenetur.
</p> ` })} ${renderComponent($$result3, "AccordionItem", $$AccordionItem, { "name": "exclusive", "title": "Third Item", "variant": "chevron" }, { "default": ($$result4) => renderTemplate` <p>
Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quasi nobis optio? Qui in quo
                accusantium debitis sapiente obcaecati magnam incidunt sit. Molestiae exercitationem quibusdam quod
                veritatis laboriosam est tenetur.
</p> ` })} ${renderComponent($$result3, "AccordionItem", $$AccordionItem, { "name": "exclusive", "title": "Fourth Item", "variant": "chevron" }, { "default": ($$result4) => renderTemplate` <p>
Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quasi nobis optio? Qui in quo
                accusantium debitis sapiente obcaecati magnam incidunt sit. Molestiae exercitationem quibusdam quod
                veritatis laboriosam est tenetur.
</p> ` })} ${renderComponent($$result3, "AccordionItem", $$AccordionItem, { "name": "exclusive", "title": "Fifth Item", "variant": "chevron" }, { "default": ($$result4) => renderTemplate` <p>
Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quasi nobis optio? Qui in quo
                accusantium debitis sapiente obcaecati magnam incidunt sit. Molestiae exercitationem quibusdam quod
                veritatis laboriosam est tenetur.
</p> ` })} ` })} </div> <div class="space-content"> <h2>Avatar</h2> <div class="flex-w flex gap-3"> ${renderComponent($$result2, "Avatar", $$Avatar, { "initials": "MT", "label": "Mark Teekman" })} ${renderComponent($$result2, "Avatar", $$Avatar, { "initials": "PP", "label": "Peter Padberg", "type": "info", "shape": "square" })} ${renderComponent($$result2, "Avatar", $$Avatar, { "label": "Astronout", "img": "https://images.unsplash.com/photo-1620428268482-cf1851a36764?auto=format&fit=crop&q=100&w=800" })} </div> ${renderComponent($$result2, "Avatar", $$Avatar, { "title": "Mark Teekman", "subtitle": "Developer & A11Y Expert" })} ${renderComponent($$result2, "AvatarGroup", $$AvatarGroup, {}, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Avatar", $$Avatar, { "size": "sm", "label": "Developer", "initials": "DV" })} ${renderComponent($$result3, "Avatar", $$Avatar, { "size": "sm", "type": "info", "label": "Designer", "initials": "DS" })} ${renderComponent($$result3, "Avatar", $$Avatar, { "size": "sm", "type": "success", "label": "Product Manager", "initials": "PM" })} ${renderComponent($$result3, "Avatar", $$Avatar, { "size": "sm", "type": "warning", "label": "Marketing", "initials": "MK" })} ${renderComponent($$result3, "Avatar", $$Avatar, { "size": "sm", "type": "error", "label": "Marketing", "initials": "MK" })} ` })} </div> <div class="space-content"> <h2>Badge</h2> <div class="flex flex-wrap gap-2"> ${renderComponent($$result2, "Badge", $$Badge, { "type": "default" }, { "default": ($$result3) => renderTemplate`Default` })} ${renderComponent($$result2, "Badge", $$Badge, { "type": "info" }, { "default": ($$result3) => renderTemplate`Info` })} ${renderComponent($$result2, "Badge", $$Badge, { "type": "success" }, { "default": ($$result3) => renderTemplate`Success` })} ${renderComponent($$result2, "Badge", $$Badge, { "type": "warning" }, { "default": ($$result3) => renderTemplate`Warning` })} ${renderComponent($$result2, "Badge", $$Badge, { "type": "error" }, { "default": ($$result3) => renderTemplate`Error` })} </div> </div> <div class="space-content"> <h2>Breadcrumbs</h2> ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, {}, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "BreadcrumbsItem", $$BreadcrumbsItem, { "href": "/", "label": "Home" })} ${renderComponent($$result3, "BreadcrumbsItem", $$BreadcrumbsItem, { "href": "/blog", "label": "Blog" })} ${renderComponent($$result3, "BreadcrumbsItem", $$BreadcrumbsItem, { "currentPage": true, "label": "My blog post" })} ` })} ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, {}, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "BreadcrumbsItem", $$BreadcrumbsItem, { "href": "/", "label": "Home", "hasIcon": true }, { "icon": ($$result4) => renderTemplate`${renderComponent($$result4, "Icon", $$Icon, { "name": "ion:home", "slot": "icon" })}` })} ${renderComponent($$result3, "BreadcrumbsItem", $$BreadcrumbsItem, { "href": "/docs", "label": "Documentation" })} ${renderComponent($$result3, "BreadcrumbsItem", $$BreadcrumbsItem, { "label": "Breadcrumbs", "currentPage": true })} ` })} ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, {}, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "BreadcrumbsItem", $$BreadcrumbsItem, { "href": "/", "label": "Home" }, { "separator": ($$result4) => renderTemplate`<span class="separator" aria-hidden="true"> ${renderComponent($$result4, "Icon", $$Icon, { "name": "ion:chevron-forward-outline" })} </span>` })} ${renderComponent($$result3, "BreadcrumbsItem", $$BreadcrumbsItem, { "href": "/docs", "label": "Documentation" }, { "separator": ($$result4) => renderTemplate`<span class="separator" aria-hidden="true"> ${renderComponent($$result4, "Icon", $$Icon, { "name": "ion:chevron-forward-outline" })} </span>` })} ${renderComponent($$result3, "BreadcrumbsItem", $$BreadcrumbsItem, { "label": "Breadcrumbs", "currentPage": true })} ` })} ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, {}, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "BreadcrumbsItem", $$BreadcrumbsItem, { "href": "/", "label": "Home", "hasIcon": true }, { "icon": ($$result4) => renderTemplate`${renderComponent($$result4, "Icon", $$Icon, { "name": "ion:home", "slot": "icon" })}`, "separator": ($$result4) => renderTemplate`<span class="separator" aria-hidden="true"> ${renderComponent($$result4, "Icon", $$Icon, { "name": "ion:chevron-forward-outline" })} </span>` })} ${renderComponent($$result3, "BreadcrumbsItem", $$BreadcrumbsItem, { "href": "/docs", "label": "Documentation" }, { "separator": ($$result4) => renderTemplate`<span class="separator" aria-hidden="true"> ${renderComponent($$result4, "Icon", $$Icon, { "name": "ion:chevron-forward-outline" })} </span>` })} ${renderComponent($$result3, "BreadcrumbsItem", $$BreadcrumbsItem, { "label": "Breadcrumbs", "currentPage": true })} ` })} </div> <div class="space-content"> <h2>Cards</h2> ${renderComponent($$result2, "Card", $$Card, { "img": "https://images.unsplash.com/photo-1620428268482-cf1851a36764?auto=format&fit=crop&q=100&w=800", "title": "Card Title", "footer": "Author name" }, { "default": ($$result3) => renderTemplate` 
Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quasi nobis optio? Qui in quo accusantium
            debitis sapiente obcaecati magnam incidunt sit. Molestiae exercitationem quibusdam quod veritatis laboriosam
            est tenetur.
`, "meta": ($$result3) => renderTemplate`<span> ${renderComponent($$result3, "Icon", $$Icon, { "name": "ion:time-outline" })}
10 min read
</span>` })} </div> <div class="space-content"> <h2>DarkMode Toggle</h2> <div class="flex gap-2"> ${renderComponent($$result2, "DarkMode", $$DarkMode, {})} ${renderComponent($$result2, "DarkMode", $$DarkMode, {}, { "dark": ($$result3) => renderTemplate`${renderComponent($$result3, "Icon", $$Icon, { "name": "ion:bulb-outline", "slot": "dark" })}`, "light": ($$result3) => renderTemplate`${renderComponent($$result3, "Icon", $$Icon, { "name": "ion:bulb", "slot": "light" })}` })} </div> </div> <div class="space-content"> <h2>Media</h2> ${renderComponent($$result2, "Media", $$Media, { "class": "rounded-lg", "src": "https://images.unsplash.com/photo-1620428268482-cf1851a36764?auto=format&fit=crop&q=100&w=800" })} </div> <div class="space-content"> <h2>Modals</h2> <button id="modal1-trigger" class="button">Modal 1</button>&nbsp;
<button id="modal2-trigger" class="button color-secondary">Modal 2</button> ${renderComponent($$result2, "Modal", $$Modal, { "triggerId": "modal1-trigger", "title": "Modal 1" }, { "default": ($$result3) => renderTemplate` <p>Why hello, I be the <strong>first</strong> Modal.</p> ` })} ${renderComponent($$result2, "Modal", $$Modal, { "triggerId": "modal2-trigger", "title": "Modal 2", "closeText": "Close Modal" }, { "default": ($$result3) => renderTemplate` <p>
Ah yes, and I be the <strong>second</strong> Modal. Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Sed, a! Ratione eaque temporibus alias tempora pariatur dolorem.
</p> <button class="button" onclick="closeModal()">Confirm action</button> ` })} </div> <div class="space-content"> <h2>Notification</h2> ${renderComponent($$result2, "Notification", $$Notification, {}, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Icon", $$Icon, { "name": "ion:notifications-outline" })}<p><strong>Message:</strong> This is a notification!</p> ` })} ${renderComponent($$result2, "Notification", $$Notification, { "role": "status", "type": "info" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Icon", $$Icon, { "name": "ion:information-circle-outline" })}<p> <strong>Info:</strong> This is a notification of type info.
</p> ` })} ${renderComponent($$result2, "Notification", $$Notification, { "role": "status", "type": "success" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Icon", $$Icon, { "name": "ion:checkbox-outline" })}<p> <strong>Success:</strong> This is a notification of type success.
</p> ` })} ${renderComponent($$result2, "Notification", $$Notification, { "role": "status", "type": "warning" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Icon", $$Icon, { "name": "ion:warning-outline" })}<p> <strong>Warning:</strong> This is a notification of type warning and goes on multiple lines to see how that
              looks.
</p> ` })} ${renderComponent($$result2, "Notification", $$Notification, { "role": "alert", "type": "error" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Icon", $$Icon, { "name": "ion:alert-circle-outline" })}<p> <strong>Error:</strong> This is a notification of type error.
</p> ` })} </div> <div class="space-content"> <h2>Pagination</h2> ${renderComponent($$result2, "Pagination", $$Pagination, { "totalPages": "200" })} </div> <div class="space-content"> <h2>SkipLink</h2> <p>
The SkipLink component becomes visible when you shift+tab to navigate backward through the page, it's the
            first focusable element on the page.
</p> </div> </div> <div class="my-32"></div> <div class="space-content"> <h2>Tabs</h2> ${renderComponent($$result2, "Tabs", $$Tabs, {}, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "TabsList", $$TabsList, {}, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "TabsTab", $$TabsTab, { "id": "tab-1", "controls": "panel-1", "selected": true }, { "default": ($$result5) => renderTemplate`First Panel` })} ${renderComponent($$result4, "TabsTab", $$TabsTab, { "id": "tab-2", "controls": "panel-2" }, { "default": ($$result5) => renderTemplate`Second Panel` })} ${renderComponent($$result4, "TabsTab", $$TabsTab, { "id": "tab-3", "controls": "panel-3" }, { "default": ($$result5) => renderTemplate`Third Panel` })} ` })} ${renderComponent($$result3, "TabsPanel", $$TabsPanel, { "id": "panel-1", "labelledby": "tab-1", "selected": true }, { "default": ($$result4) => renderTemplate` <h3>First Panel</h3> <p>
Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quasi nobis optio? Qui in quo
              accusantium debitis sapiente obcaecati magnam incidunt sit. Molestiae exercitationem quibusdam quod
              veritatis laboriosam est tenetur. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sed eveniet
              quidem earum at nobis enim.
</p> <a href="#">Tab to me!</a> ` })} ${renderComponent($$result3, "TabsPanel", $$TabsPanel, { "id": "panel-2", "labelledby": "tab-2" }, { "default": ($$result4) => renderTemplate` <h3>Second Panel</h3> <div class="grid grid-cols-1 gap-4 md:grid-cols-2"> ${renderComponent($$result4, "Media", $$Media, { "class": "rounded-lg", "src": "https://images.unsplash.com/photo-1636819488537-a9b1ffb315ce?auto=format&fit=crop&w=800&q=100" })} ${renderComponent($$result4, "Media", $$Media, { "class": "rounded-lg", "src": "https://images.unsplash.com/photo-1636819488537-a9b1ffb315ce?auto=format&fit=crop&w=800&q=100" })} </div> <p>
Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quasi nobis optio? Qui in quo
              accusantium debitis sapiente obcaecati magnam incidunt sit. Molestiae exercitationem quibusdam quod
              veritatis laboriosam est tenetur. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sed eveniet
              quidem earum at nobis enim.
</p> <a href="#">Tab to me!</a> ` })} ${renderComponent($$result3, "TabsPanel", $$TabsPanel, { "id": "panel-3", "labelledby": "tab-3" }, { "default": ($$result4) => renderTemplate` <h3>Third Panel</h3> <p>
Lorem ipsum dolor sit amet consectetur, adipisicing elit. Tenetur, nulla! Sapiente saepe voluptate nemo in
              id aperiam tempore quo unde, ipsum similique explicabo non maiores qui voluptates dolore obcaecati. Atque
              voluptates similique ad ipsam nostrum quibusdam doloremque cum porro, aperiam beatae voluptas dolore et
              neque voluptate alias nesciunt blanditiis totam voluptatem necessitatibus. Similique aliquid molestiae
              iusto nam nobis ut aspernatur blanditiis provident iste corporis minima, quidem autem nulla doloremque
              eaque a obcaecati! Nisi quod quam repellendus facilis? Libero voluptas doloribus maxime, suscipit odio
              veritatis optio nulla officia quos cum at ea hic numquam perferendis molestiae! Aperiam quia veritatis
              earum tempora.
</p> <a href="#">Tab to me!</a> ` })} ` })} </div> </div> </section> <section class="mb-12 mt-32"> <div class="container"> <div class="grid grid-cols-1 gap-32 md:grid-cols-2"> <div class="space-content"> <h2>Video (default)</h2> ${renderComponent($$result2, "Video", $$Video, { "src": "https://www.youtube.com/watch?v=j8K-ESJF814", "title": "Video" })} </div> <div class="space-content"> <h2>Video (aspect ratio)</h2> ${renderComponent($$result2, "Video", $$Video, { "src": "https://www.youtube.com/watch?v=j8K-ESJF814", "title": "Video", "ratio": "1:1" })} </div> </div> </div> </section> ` })}`;
}, "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/pages/accessible-components.astro", void 0);

const $$file = "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/pages/accessible-components.astro";
const $$url = "/accessible-components";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$AccessibleComponents,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
