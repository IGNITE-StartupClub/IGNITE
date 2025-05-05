import { c as createComponent, m as maybeRenderHead, b as renderTemplate, a as createAstro, r as renderComponent } from '../chunks/astro/server_BR_yo3lg.mjs';
import 'kleur/colors';
import { $ as $$DefaultLayout } from '../chunks/DefaultLayout_BE8JjL70.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
/* empty css                                 */
import 'clsx';
/* empty css                                     */
export { renderers } from '../renderers.mjs';

const positions = [
    {
      id: 'Event-Community-Manager',
      image: '', 
      category: 'Community',
      team: 'IGNITE Community',
      title: 'Event- & Community Manager',
      description: 'Plane Workshops & Netzwerk-Events für Studierende.',
    },
    {
      id: 'Content-Creator',
      image: '',
      category: 'Content',
      team: 'IGNITE Marketing',
      title: 'Content Creator',
      description: 'Erstelle Posts, Grafiken und Videos rund ums Thema Entrepreneurship.',
    },
    {
      id: 'Partnership-Sponsorship',
      image: '',
      category: 'Partnership',
      team: 'IGNITE Relations',
      title: 'Partnership & Sponsorship',
      description: 'Gewinne Kooperationspartner und baue unsere Finanzen mit auf.',
    },
  ];

function OpenPositions() {
  return /* @__PURE__ */ jsxs("div", { className: "positions-grid", children: [
    positions.map((job) => /* @__PURE__ */ jsxs("article", { className: "job-card", children: [
      /* @__PURE__ */ jsx("div", { className: "image-wrapper", children: job.image ? /* @__PURE__ */ jsx("img", { src: job.image, alt: job.title }) : /* @__PURE__ */ jsx("div", { className: "fallback-image", children: /* @__PURE__ */ jsx("img", { src: `/team-logos/${job.team.toLowerCase()}.png`, alt: `${job.team} logo`, className: "team-logo" }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "job-info", children: [
        /* @__PURE__ */ jsx("span", { className: "category-pill", children: job.category }),
        /* @__PURE__ */ jsx("h3", { className: "job-title", children: job.title }),
        /* @__PURE__ */ jsx("p", { className: "job-desc", children: job.description })
      ] })
    ] }, job.id)),
    /* @__PURE__ */ jsx("style", { children: `
        .positions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--spacing-md, 1.5rem);
        }
        .job-card {
          background: var(--neutral-200);
          border-radius: var(--radius-lg, 16px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .image-wrapper {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 */
        }
        .image-wrapper img {
          position: absolute;
          width: 100%; height: 100%;
          object-fit: cover;
        }
        .fallback-image {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: linear-gradient(45deg, var(--primary-400), var(--secondary-200));
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .team-logo {
          max-width: 80px;
          max-height: 80px;
          object-fit: contain;
        }
        .job-info {
          padding: var(--spacing-md, 1rem);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm, 0.5rem);
        }
        .category-pill {
          display: inline-block;
          background: var(--neutral-100);
          color: var(--primary-400);
          padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.75rem);
          border-radius: var(--radius-pill, 12px);
          font-size: var(--text-xs, 0.75rem);
          text-transform: uppercase;
          font-weight: 600;
          width: max-content;
        }
        .job-title {
          margin: 0;
          font-size: var(--text-lg, 1.125rem);
          color: var(--primary-500);
        }
        .job-desc {
          margin: 0;
          font-size: var(--text-sm, 0.875rem);
          color: var(--neutral-700);
        }
      ` })
  ] });
}

function Questionnaire({ initialPosition = "" }) {
  const startStep = initialPosition ? 3 : 1;
  const [step, setStep] = useState(startStep);
  const [data, setData] = useState({
    position: initialPosition,
    q1: "",
    // Was reizt dich…
    q2: "",
    // Welche Erfahrungen…
    q3: "",
    // Welche konkreten Stärken…
    q4: "",
    // Wie viel Zeit…
    q5: "",
    // Wie gehst du mit Struktur-Unsicherheit um?
    name: "",
    lastname: "",
    email: ""
  });
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (initialPosition) {
      setData((d) => ({ ...d, position: initialPosition }));
    }
  }, [initialPosition]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((d) => ({ ...d, [name]: value }));
  };
  const next = () => setStep((s) => s + 1);
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    setDone(true);
  };
  if (done) {
    return /* @__PURE__ */ jsx("p", { children: "Danke für deine Bewerbung! Wir melden uns bald bei dir." });
  }
  return /* @__PURE__ */ jsxs(
    "form",
    {
      id: "application-form",
      onSubmit: handleSubmit,
      className: "questionnaire",
      children: [
        step === 1 && /* @__PURE__ */ jsx("button", { type: "button", className: "button secondary", onClick: next, children: "Bewerbung ausfüllen" }),
        step === 2 && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "Gewünschte Position",
            /* @__PURE__ */ jsxs(
              "select",
              {
                name: "position",
                value: data.position,
                onChange: handleChange,
                required: true,
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Bitte wählen" }),
                  positions.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.title }, p.id))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "button secondary",
              onClick: next,
              disabled: !data.position,
              children: "Weiter"
            }
          )
        ] }),
        step === 3 && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "1. Was reizt dich persönlich an unserer noch jungen Initiative – und warum gerade jetzt?",
            /* @__PURE__ */ jsx(
              "textarea",
              {
                name: "q1",
                value: data.q1,
                onChange: handleChange,
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "2. Welche Erfahrungen hast du bisher bei der Planung oder Durchführung von Veranstaltungen gesammelt?",
            /* @__PURE__ */ jsx(
              "textarea",
              {
                name: "q2",
                value: data.q2,
                onChange: handleChange,
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "button secondary",
              onClick: next,
              disabled: !data.q1.trim() || !data.q2.trim(),
              children: "Weiter"
            }
          )
        ] }),
        step === 4 && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "3. Welche konkreten Stärken (z. B. Design, Marketing, Finanzen, Technik) könntest du sofort einbringen?",
            /* @__PURE__ */ jsx(
              "textarea",
              {
                name: "q3",
                value: data.q3,
                onChange: handleChange,
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "4. Wie viel Zeit kannst du in den nächsten drei Monaten realistisch pro Woche investieren?",
            /* @__PURE__ */ jsx(
              "textarea",
              {
                name: "q4",
                value: data.q4,
                onChange: handleChange,
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "button secondary",
              onClick: next,
              disabled: !data.q3.trim() || !data.q4.trim(),
              children: "Weiter"
            }
          )
        ] }),
        step === 5 && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "5. Wie gehst du damit um, wenn ein Projekt noch wenig Struktur hat und vieles parallel entsteht?",
            /* @__PURE__ */ jsx(
              "textarea",
              {
                name: "q5",
                value: data.q5,
                onChange: handleChange,
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "button secondary",
              onClick: next,
              disabled: !data.q5.trim(),
              children: "Weiter"
            }
          )
        ] }),
        step === 6 && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "Vorname",
            /* @__PURE__ */ jsx(
              "input",
              {
                name: "name",
                value: data.name,
                onChange: handleChange,
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "Nachname",
            /* @__PURE__ */ jsx(
              "input",
              {
                name: "lastname",
                value: data.lastname,
                onChange: handleChange,
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "E-Mail",
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                name: "email",
                value: data.email,
                onChange: handleChange,
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsx("button", { type: "submit", className: "button secondary", children: "Absenden" })
        ] }),
        /* @__PURE__ */ jsx("style", { children: `
        .questionnaire {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md, 1rem);
        }
        label {
          display: flex;
          flex-direction: column;
          font-weight: 500;
        }
        select,
        textarea,
        input {
          margin-top: 0.25rem;
          padding: var(--spacing-sm, 0.5rem);
          border: 1px solid var(--neutral-400);
          border-radius: var(--radius-sm, 4px);
        }
          /* Basis-Styling für das Select */

          .questionnaire select {
          /* Entferne native Styles */
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;

          /* Farben und Rahmen */
          background-color: var(--neutral-100);
          border: 1px solid var(--neutral-400);
          border-radius: var(--radius-md, 8px);

          /* Innenabstand, damit Platz für Pfeil bleibt */
          padding: 0.5rem 2.5rem 0.5rem 0.75rem;
          font-size: var(--text-base, 1rem);
          color: var(--neutral-900);

          /* Übergang für Fokus */
          transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

          /* Eigenes Pfeil-Icon als SVG-Data-URI */
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23333444' viewBox='0 0 16 16'%3E%3Cpath d='M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1rem;
        }

        /* Hover- und Fokus-Styling */
        .questionnaire select:hover,
        .questionnaire select:focus {
          border-color: var(--primary-400);
          box-shadow: 0 0 0 3px rgba(102,51,153,0.2); /* lila Schatten */
          outline: none;
        }

        /* Optional: wenn disabled */
        .questionnaire select:disabled {
          background-color: var(--neutral-200);
          color: var(--neutral-500);
          cursor: not-allowed;
        }
      ` })
      ]
    }
  );
}

const $$CallToAction = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="container" data-astro-cid-balv45lp> <div class="call-to-action mt-24 mb-32 flex flex-col items-center gap-12 rounded-xl p-12 md:p-24" data-astro-cid-balv45lp> <h2 class="text-center text-3xl md:text-5xl" data-astro-cid-balv45lp>Verpasse nichts mehr!</h2> <a href="https://www.instagram.com/ignite.lueneburg/" class="text-center text-lg button secondary" target="_blank" data-astro-cid-balv45lp> Folg' uns auf Social Media</a> </div> </div> `;
}, "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/components/CallToAction.astro", void 0);

const $$Astro = createAstro();
const prerender = false;
const $$Mitmachen = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Mitmachen;
  const initialPosition = Astro2.url.searchParams.get("position") || "";
  return renderTemplate`${renderComponent($$result, "DefaultLayout", $$DefaultLayout, { "data-astro-cid-kmmhox5j": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="mitmachen-container" data-astro-cid-kmmhox5j> <h1 data-astro-cid-kmmhox5j>Mitmachen im IGNITE Startup Club Lüneburg</h1> <p class="intro" data-astro-cid-kmmhox5j>
IGNITE Startup Club Lüneburg ist eine studentische Initiative für Startups und Unternehmertum. 
      Gemeinsam fördern wir Gründungsgeist, vernetzen Talente und setzen nachhaltige Projekte um.
</p> <!-- 1) Offene Positionen --> <section aria-labelledby="open-positions" data-astro-cid-kmmhox5j> <h2 id="open-positions" data-astro-cid-kmmhox5j>Offene Positionen</h2> ${renderComponent($$result2, "OpenPositions", OpenPositions, { "data-astro-cid-kmmhox5j": true })} </section> <section id="application-form" class="form-section" data-astro-cid-kmmhox5j> <div class="text-wrapper" data-astro-cid-kmmhox5j> <h2 data-astro-cid-kmmhox5j>Jetzt bewerben!</h2> <p data-astro-cid-kmmhox5j>Bewirb dich jetzt ganz einfach und schnell mit diesem Bewerbungsformular.</p> </div> <!-- Client-seitig laden, damit React initialPosition auswertet --> ${renderComponent($$result2, "Questionnaire", Questionnaire, { "client:load": true, "initialPosition": initialPosition, "client:component-hydration": "load", "client:component-path": "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/components/Questionnaire.jsx", "client:component-export": "default", "data-astro-cid-kmmhox5j": true })} </section> ${renderComponent($$result2, "CallToAction", $$CallToAction, { "data-astro-cid-kmmhox5j": true })} </main>  ` })}`;
}, "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/pages/mitmachen.astro", void 0);

const $$file = "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/pages/mitmachen.astro";
const $$url = "/mitmachen";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Mitmachen,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
