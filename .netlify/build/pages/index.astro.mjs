import { c as createComponent, a as createAstro, m as maybeRenderHead, d as renderSlot, r as renderComponent, b as renderTemplate, f as addAttribute } from '../chunks/astro/server_BR_yo3lg.mjs';
import 'kleur/colors';
import { h as $$Icon, k as $$Media, $ as $$DefaultLayout, a as $$Accordion, b as $$AccordionItem } from '../chunks/DefaultLayout_BE8JjL70.mjs';
/* empty css                                 */
import { g as getCollection } from '../chunks/_astro_content_K1SQFpew.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Astro$2 = createAstro();
const $$Hero = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Hero;
  const { src = "/astronaut-hero-img.webp" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<section class="hero my-24 relative overflow-hidden" data-astro-cid-bbe6dxrz> <!-- Blurred Dots --> <div class="blurred-dots" data-astro-cid-bbe6dxrz> <div class="dot dot-purple" data-astro-cid-bbe6dxrz></div> <div class="dot dot-pink" data-astro-cid-bbe6dxrz></div> </div> <div class="container relative z-10" data-astro-cid-bbe6dxrz> <div class="grid grid-cols-1 items-center gap-24" data-astro-cid-bbe6dxrz> <div class="flex flex-col items-center gap-8" data-astro-cid-bbe6dxrz> <h1 class="text-center text-4xl lg:text-7xl" data-astro-cid-bbe6dxrz> ${renderSlot($$result, $$slots["default"], renderTemplate` <span class="text-gradient" data-astro-cid-bbe6dxrz>Gründungsfunken</span> an der Leuphana Unviersität
`)} </h1> <div class="flex flex-col gap-3 min-[500px]:flex-row" data-astro-cid-bbe6dxrz> <!-- <a class="button secondary has-icon" href="https://github.com/incluud/accessible-astro-starter">
            <Icon name="ion:reader-outline" />
            Kennenlernen
          </a>
          <a class="button has-icon color-secondary" href="https://accessible-astro.incluud.dev/">
            <Icon name="ion:chatbubbles-outline" />
            Erstgespräch buchen!
          </a> --> <a class="button secondary size-large has-icon" href="/mitmachen" data-astro-cid-bbe6dxrz> ${renderComponent($$result, "Icon", $$Icon, { "name": "ion:people-outline", "data-astro-cid-bbe6dxrz": true })}
Mitmachen
</a> </div> </div> <!-- <img class="hidden lg:block" src={src} alt="" decoding="async" /> --> </div> </div> </section> `;
}, "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/components/Hero.astro", void 0);

const $$Astro$1 = createAstro();
const $$Feature = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Feature;
  const { icon = "mdi:rocket", title = "Title" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="feature flex flex-col gap-4" data-astro-cid-ezsi7upz> ${renderComponent($$result, "Icon", $$Icon, { "name": icon, "data-astro-cid-ezsi7upz": true })} <div class="content" data-astro-cid-ezsi7upz> <h3 data-astro-cid-ezsi7upz>${title}</h3> <p data-astro-cid-ezsi7upz> ${renderSlot($$result, $$slots["default"], renderTemplate`Lorem ipsum dolor sit amet consectetur adipisicing elit. Hic, corporis.`)} </p> </div> </div> `;
}, "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/components/Feature.astro", void 0);

const $$Astro = createAstro();
const $$ContentMedia = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ContentMedia;
  const {
    imgSrc,
    title,
    cta,
    cta_link,
    reverseImg = false
  } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<section class="my-12"> <div class="container"> ${title && renderTemplate`<h2 class="text-4xl md:text-6xl my-12">${title}</h2>`} <div class="grid grid-cols-1 gap-24 md:grid-cols-2"> ${!reverseImg && imgSrc && renderTemplate`${renderComponent($$result, "Media", $$Media, { "class": "rounded-lg", "src": imgSrc })}`} <div class="space-content flex flex-col justify-center"> ${renderSlot($$result, $$slots["default"])} </div> ${reverseImg && imgSrc && renderTemplate`${renderComponent($$result, "Media", $$Media, { "class": "rounded-lg", "src": imgSrc, "ratio": "4:3", "loading": "lazy" })}`} </div> ${cta && cta_link && renderTemplate`<div class="flex flex-col items-center justify-center mt-12"> <a class="button size-large secondary has-icon"${addAttribute(cta_link, "href")}> ${renderComponent($$result, "Icon", $$Icon, { "name": "ion:reader-outline" })}${cta} </a> </div>`} </div> </section>`;
}, "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/components/ContentMedia.astro", void 0);

const $$News = createComponent(async ($$result, $$props, $$slots) => {
  const news = await getCollection("projects");
  return renderTemplate`${maybeRenderHead()}<section class="my-12"> <div class="space-content container"> <h1>Neuigkeiten</h1> <p class="text-2xl">
Erfahre mehr über unsere Neuigkeiten und bleibe auf dem Laufenden.
</p> </div> </section> <section class="my-12"> <div class="container"> ${news && news.length > 0 ? renderTemplate`${renderComponent($$result, "ContentMedia", $$ContentMedia, { "imgSrc": news[0].data.image || "/default-image.jpg", "cta": "Mehr lesen!", "cta_link": "/news" }, { "default": async ($$result2) => renderTemplate` <h2>${news[0].data.title || "No title available"}</h2> <p>${news[0].data.description || "No description available"}</p> <p>${"Author: " + (news[0].data.author || "N/A")} - ${new Date(news[0].data.date).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}</p> ` })}` : renderTemplate`<p>No news available.</p>`} </div> </section>`;
}, "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/components/news.astro", void 0);

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "DefaultLayout", $$DefaultLayout, { "title": "Home" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Hero", $$Hero, {})} ${maybeRenderHead()}<section class="my-64"> <div class="container"> <h2 class="mb-16 text-4xl md:text-6xl">Was wir machen</h2> <div class="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3"> ${renderComponent($$result2, "Feature", $$Feature, { "icon": "ion:diamond-outline", "title": "Workshops & Events" }, { "default": ($$result3) => renderTemplate`
Wir lernen gemeinsam von Expert:innen & Peer-to-Peer über Startups und Entrepreneurship.
` })} ${renderComponent($$result2, "Feature", $$Feature, { "icon": "ion:document-attach-outline", "title": "Fact-Sheet" }, { "default": ($$result3) => renderTemplate`
Wir analysieren die Angebote zum Thema Entrepreneurship an der Leuphana Universität.
` })} ${renderComponent($$result2, "Feature", $$Feature, { "icon": "ion:flame-outline", "title": "Hackathon" }, { "default": ($$result3) => renderTemplate`
Wir veranstalten einen Hackathon, um innovative Ideen zu entwickeln und zu testen.
          Wir organisieren 2-3 tägige Events, um in kurzer Zeit Startup Ideen auszuarbeiten.
` })} ${renderComponent($$result2, "Feature", $$Feature, { "icon": "ion:mic-outline", "title": "IGNITE Podcast" }, { "default": ($$result3) => renderTemplate`
Im Utopia interviewen wir Startup Gründende und Leuphana Alumni.
` })} ${renderComponent($$result2, "Feature", $$Feature, { "icon": "ion:people-outline", "title": "Community" }, { "default": ($$result3) => renderTemplate`
Wir verbinden Studierende, Alumni und Gründende mit dem Ziel, ein starkes Netzwerk aufzubauen.
` })} ${renderComponent($$result2, "Feature", $$Feature, { "icon": "ion:cash-outline", "title": "IGNITE Stipedium" }, { "default": ($$result3) => renderTemplate`
Wir ermöglichen angehendenden Gründenden einen Co-Working Platz und Förderung im Utopia.
` })} </div> </div> </section> <section> ${renderComponent($$result2, "News", $$News, {})} </section>  <section class="my-64"> <div class="container grid grid-cols-1 gap-12 md:grid-cols-2"> <div class="flex flex-col items-start gap-4"> <h2 class="text-6xl">FAQ</h2> <p class="text-2xl">
Häufig gestellte Fragen zu IGNITE.
</p> <a class="button color-secondary" href="/faq">Nimm Kontakt auf!</a> </div> <div class="space-content"> ${renderComponent($$result2, "Accordion", $$Accordion, {}, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "AccordionItem", $$AccordionItem, { "name": "exclusive", "title": "Warum IGNITE?" }, { "default": ($$result4) => renderTemplate` <p>
Weil wir als Brücke zwischen Leuphana und der Startup-Szene hands-on Erfahrungen, ein starkes Netzwerk und echte Mitgestaltungschancen bieten – hier entsteht deine Gründerzukunft.
</p> ` })} ${renderComponent($$result3, "AccordionItem", $$AccordionItem, { "name": "exclusive", "title": "Welche Erwartungen stellen wir an die Mitglieder?", "open": true }, { "default": ($$result4) => renderTemplate` <p>
Der durchschnittliche Aufwand liegt bei etwa 3–5 Stunden pro Woche – je nach Projektphase etwas mehr oder weniger. Wir erwarten regelmäßige Teilnahme an Team-Meetings, aktive Projektarbeit und proaktive Kommunikation.
</p> ` })} ${renderComponent($$result3, "AccordionItem", $$AccordionItem, { "name": "exclusive", "title": "Wie profitiere ich von meinem Ehrenamt?" }, { "default": ($$result4) => renderTemplate` <p>
Du erhältst exklusiven Zugang zu Unternehmen, Gründer:innen, Investor:innen und Alumni, nimmst an praxisorientierten Workshops teil und erhältst individuelles Feedback in Mentoring-Sessions.
</p> ` })} ${renderComponent($$result3, "AccordionItem", $$AccordionItem, { "name": "exclusive", "title": "Wie l\xE4uft der Bewerbungs- und Onboarding-Prozess ab?" }, { "default": ($$result4) => renderTemplate` <p>
Du füllst das Online-Formular auf unserer Website aus, bekommst eine Rückmeldung per E-Mail mit Einladung zum persönlichen Gespräch und startest nach positiver Entscheidung mit einem strukturierten Onboarding.
</p> ` })} ${renderComponent($$result3, "AccordionItem", $$AccordionItem, { "name": "exclusive", "title": "Welche Rollen und Gremien gibt es innerhalb der Initiative?" }, { "default": ($$result4) => renderTemplate` <p>
Wir haben ein fünfköpfiges Präsidium (Präsident, Vize, CFO, COO, CTO) und arbeiten in projektbezogenen Teams (z. B. Marketing, Event, Community), die jeweils eigene Koordinator:innen wählen.
</p> ` })} ${renderComponent($$result3, "AccordionItem", $$AccordionItem, { "name": "exclusive", "title": "Gibt es M\xF6glichkeiten, Erfahrungspunkte oder Referenzen f\xFCr Studium und Lebenslauf zu sammeln?" }, { "default": ($$result4) => renderTemplate` <p>
Ja, dein Engagement wird auf Wunsch im Transcript of Records anerkannt, und du kannst Empfehlungsschreiben von Mentor:innen sowie Projektzertifikate erhalten.
</p> ` })} ` })} </div> </div> </section> ` })}`;
}, "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/pages/index.astro", void 0);

const $$file = "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
