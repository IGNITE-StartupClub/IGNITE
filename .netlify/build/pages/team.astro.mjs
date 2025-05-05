import { c as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, f as addAttribute } from '../chunks/astro/server_BR_yo3lg.mjs';
import 'kleur/colors';
import { $ as $$DefaultLayout, l as $$Modal } from '../chunks/DefaultLayout_BE8JjL70.mjs';
/* empty css                                 */
/* empty css                                */
export { renderers } from '../renderers.mjs';

const teams = [
    {
      name: 'IGNITE Vostand',
      description: 'Das Team für die strategische Planung und Organisation.',
      members: [
        {
          name: 'Linus Heidemann',
          position: 'Präsident',
          photo: '/team/silas.jpg',
          description: 'Linus Heidemann ist der Präsident von IGNITE und kümmert sich um die strategische Planung.',
        },
        {
          name: 'Emma Siemer',
          position: 'Vize-Präsidentin',
          photo: '/images/team/laura.jpg', 
          description: 'Emma Siemer ist die Vize-Präsidentin von IGNITE und kümmert sich um die strategische Planung.',
        },
        {
          name: 'Cornelis Ebel',
          position: 'Schatzmeister',
          photo: '/team/laura.jpg', 
          description: 'Emma Siemer ist die Vize-Präsidentin von IGNITE und kümmert sich um die strategische Planung.',
        },
        {
          name: 'Ole Koesling',
          position: 'Schatzmeister',
          photo: '/team/laura.jpg', 
          description: 'Emma Siemer ist die Vize-Präsidentin von IGNITE und kümmert sich um die strategische Planung.',
        },
        {
          name: 'Silas Kruckenberg',
          position: 'General Sekretär',
          photo: '/team/silas.jpg', 
          description: 'Silas Kruckenberg ist der General Sekretär von IGNITE und kümmert sich um die strategische Planung.',
        }
      ]
    },
    {
      name: 'IGNITE Community',
      description: 'Das Team für die Planung von Workshops und Netzwerk-Events.',
      members: [
        {
          name: 'Silas Kruckenberg',
          position: 'Community Manager',
          photo: '/team/silas.jpg',
          description: 'Silas kümmert sich um die Community und Veranstaltungen.',
        },
        {
          name: 'Laura Beispiel',
          position: 'Event Coordinator',
          photo: '/images/team/laura.jpg', 
          description: 'Laura organisiert unsere Events und ist für den Ablauf verantwortlich.',
        }
      ]
    },
  
  ];

const $$Team = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "DefaultLayout", $$DefaultLayout, { "title": "Team", "description": "Das Team des IGNITE Startup Club L\xFCneburg", "data-astro-cid-6sqsh2pf": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="container" data-astro-cid-6sqsh2pf> <div class="space-content my-12" data-astro-cid-6sqsh2pf> <h1 class="text-4xl font-bold" data-astro-cid-6sqsh2pf>Unser Team</h1> <p class="text-2xl mt-4" data-astro-cid-6sqsh2pf>Lerne das talentierte Team kennen, das den IGNITE Startup Club Lüneburg vorantreibt. Jeder von uns trägt mit einzigartigen Fähigkeiten und einer gemeinsamen Vision bei, um die nächste Generation von Unternehmern zu unterstützen.</p> <div class="team-sections" data-astro-cid-6sqsh2pf> ${teams.map((team, teamIndex) => renderTemplate`<section class="team-section my-12" data-astro-cid-6sqsh2pf> <h2 class="text-3xl font-semibold mt-8" data-astro-cid-6sqsh2pf>${team.name}</h2> <p class="text-lg mt-2" data-astro-cid-6sqsh2pf>${team.description}</p> <div class="team-members grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mt-8" data-astro-cid-6sqsh2pf> ${team.members.map((member, index) => renderTemplate`<div class="job-card" data-astro-cid-6sqsh2pf> <div class="image-wrapper" data-astro-cid-6sqsh2pf> <img${addAttribute(member.photo, "src")}${addAttribute(member.name, "alt")} data-astro-cid-6sqsh2pf> </div> <div class="job-info" data-astro-cid-6sqsh2pf> <span class="category-pill" data-astro-cid-6sqsh2pf>${member.position}</span> <span data-astro-cid-6sqsh2pf> <h3 class="job-title" data-astro-cid-6sqsh2pf>${member.name}</h3> <p class="job-desc" data-astro-cid-6sqsh2pf>${member.description}</p> </span>  <a class="button color-secondary"${addAttribute(`modal-trigger-${teamIndex}-${index}`, "id")}${addAttribute(`${teamIndex}-${index}`, "data-member-index")} data-astro-cid-6sqsh2pf>
Mehr lesen
</a> </div> </div>`)} </div> </section>`)} </div> </div> </div> ${teams.map((team, teamIndex) => team.members.map((member, index) => renderTemplate`${renderComponent($$result2, "Modal", $$Modal, { "key": `${teamIndex}-${index}`, "Unique": true, "key": true, "based": true, "on": true, "team": true, "and": true, "member": true, "index": true, "triggerId": `modal-trigger-${teamIndex}-${index}`, "Match": true, "trigger": true, "ID": true, "title": member.name, "data-astro-cid-6sqsh2pf": true }, { "default": ($$result3) => renderTemplate` <p data-astro-cid-6sqsh2pf>${member.description}</p> ` })}`))}` })} `;
}, "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/pages/team.astro", void 0);

const $$file = "/Volumes/Hinblick Media/IGNITE/Website/accessible-astro-starter/src/pages/team.astro";
const $$url = "/team";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Team,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
