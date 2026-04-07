import { _ as __astro_tag_component__, f as createVNode, F as Fragment } from '../chunks/astro/server_BPXzsi7f.mjs';
import { $ as $$MarkdownLayout } from '../chunks/MarkdownLayout_l-J29eKh.mjs';
import { m as $$Notification, a as $$Icon } from '../chunks/DefaultLayout_BmucUl1h.mjs';
/* empty css                                 */
import 'clsx';
export { renderers } from '../renderers.mjs';

const MDXLayout = function ({children}) {
  const {layout, ...content} = frontmatter;
  content.file = file;
  content.url = url;
  return createVNode($$MarkdownLayout, {
    file,
    url,
    content,
    frontmatter: content,
    headings: getHeadings(),
    'server:root': true,
    children
  });
};
const frontmatter = {
  "layout": "../layouts/MarkdownLayout.astro",
  "title": "Peer-to-Peer Learnings"
};
function getHeadings() {
  return [{
    "depth": 1,
    "slug": "peer-to-peer-learnings",
    "text": "Peer-to-Peer Learnings"
  }, {
    "depth": 2,
    "slug": "werde-mentorin-speaker-oder-workshop-leiterin",
    "text": "Werde Mentor:in, Speaker oder Workshop-Leiter:in"
  }, {
    "depth": 2,
    "slug": "warum-peer-to-peer-learnings-besonders-wertvoll-sind",
    "text": "Warum Peer-to-Peer Learnings besonders wertvoll sind"
  }, {
    "depth": 2,
    "slug": "welche-themen-eignen-sich",
    "text": "Welche Themen eignen sich?"
  }, {
    "depth": 2,
    "slug": "so-unterstützt-ignite-deine-peer-to-peer-session",
    "text": "So unterstützt IGNITE deine Peer-to-Peer Session"
  }, {
    "depth": 2,
    "slug": "dein-nächster-schritt-werde-aktiver-teil-der-ignite-community",
    "text": "Dein nächster Schritt: Werde aktiver Teil der IGNITE-Community"
  }];
}
function _createMdxContent(props) {
  const _components = {
    a: "a",
    h1: "h1",
    h2: "h2",
    li: "li",
    p: "p",
    strong: "strong",
    ul: "ul",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h1, {
      id: "peer-to-peer-learnings",
      children: "Peer-to-Peer Learnings"
    }), "\n", createVNode($$Notification, {
      type: "message",
      children: [createVNode($$Icon, {
        name: "ion:information-circle-outline"
      }), createVNode("p", {
        children: createVNode(_components.p, {
          children: [createVNode("strong", {
            children: "Info:"
          }), " Der Ignite Startup Club bietet dir die Möglichkeit, deine Erfahrungen und Fähigkeiten mit anderen Studierenden zu teilen. In unseren Peer-to-Peer Learnings kannst du Workshops oder Vorträge halten, die wir organisieren und mit unserem Netzwerk unterstützen – eine perfekte Gelegenheit, dein Wissen sichtbar zu machen und wertvolle Kontakte zu knüpfen."]
        })
      })]
    }), "\n", createVNode(_components.h2, {
      id: "werde-mentorin-speaker-oder-workshop-leiterin",
      children: "Werde Mentor:in, Speaker oder Workshop-Leiter:in"
    }), "\n", createVNode(_components.p, {
      children: "Du hast besonderes Wissen, praktische Erfahrungen oder hilfreiche Skills rund um Unternehmertum oder Startups, die du gern mit anderen Studierenden teilen möchtest? Genau dafür sind unsere Peer-to-Peer Learnings gedacht. Ignite unterstützt dich bei der Vorbereitung, Planung und Durchführung deines eigenen Workshops, Vortrags oder einer Diskussionsrunde. Wir bieten dir eine Plattform, um dein Know-how sichtbar zu machen und gleichzeitig die Startup-Community der Universität aktiv zu bereichern."
    }), "\n", createVNode(_components.p, {
      children: "Unsere Veranstaltungen basieren auf der Überzeugung, dass der effektivste Wissensaustausch durch gegenseitiges Lernen stattfindet. Deshalb stehen bei Ignite alle Mitglieder im Mittelpunkt, die ihre Erfahrungen authentisch und praxisnah mit anderen teilen möchten."
    }), "\n", createVNode(_components.h2, {
      id: "warum-peer-to-peer-learnings-besonders-wertvoll-sind",
      children: "Warum Peer-to-Peer Learnings besonders wertvoll sind"
    }), "\n", createVNode(_components.p, {
      children: "Unsere Peer-to-Peer Sessions sind mehr als nur eine Bühne für Vorträge – sie schaffen Raum für echten Austausch und nachhaltige Vernetzung. Du bekommst die Möglichkeit, dein Wissen direkt an andere weiterzugeben, wertvolle Erfahrungen zu sammeln und deine Kommunikationsfähigkeiten weiter auszubauen."
    }), "\n", createVNode(_components.p, {
      children: "Ignite übernimmt dabei die Organisation und sorgt für eine optimale Vorbereitung und Durchführung deiner Veranstaltung. Du erhältst Zugang zu unserem Netzwerk, Unterstützung bei der Kommunikation und eine aktive Community, die deine Inhalte wertschätzt und diskutiert."
    }), "\n", createVNode(_components.h2, {
      id: "welche-themen-eignen-sich",
      children: "Welche Themen eignen sich?"
    }), "\n", createVNode(_components.p, {
      children: "Die Themen sind vielfältig und stets willkommen, solange sie Studierenden helfen, auf ihrem Weg ins Unternehmertum erfolgreich zu sein. Ein paar neue Ideen haben wir schon für dich:"
    }), "\n", createVNode("div", {
      class: "overflow-x-auto rounded-lg border border-neutral-700 bg-dark-100 shadow-md mt-6",
      children: createVNode("table", {
        class: "min-w-full text-left text-sm leading-6 text-neutral-100",
        children: [createVNode("thead", {
          class: "bg-background-200 text-primary-400",
          children: createVNode("tr", {
            children: [createVNode("th", {
              class: "px-6 py-3 font-semibold border-b border-neutral-700",
              children: "Thema"
            }), createVNode("th", {
              class: "px-6 py-3 font-semibold border-b border-neutral-700",
              children: "Fokus"
            }), createVNode("th", {
              class: "px-6 py-3 font-semibold border-b border-neutral-700",
              children: "Was die Community davon hat"
            })]
          })
        }), createVNode("tbody", {
          class: "divide-y divide-neutral-700",
          children: [createVNode("tr", {
            class: "hover:bg-background-200 transition-colors duration-150",
            children: [createVNode("td", {
              class: "px-6 py-4",
              children: "Gründen neben dem Studium"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Zeitmanagement, Priorisierung"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Praxisnahe Tipps für den Alltag als gründende Person im Studium"
            })]
          }), createVNode("tr", {
            class: "hover:bg-background-200 transition-colors duration-150",
            children: [createVNode("td", {
              class: "px-6 py-4",
              children: "Growth Hacking für Startups"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Günstige Reichweitenstrategien"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Neue Wege, mit kleinem Budget zu wachsen"
            })]
          }), createVNode("tr", {
            class: "hover:bg-background-200 transition-colors duration-150",
            children: [createVNode("td", {
              class: "px-6 py-4",
              children: "Personal Branding für Gründer*innen"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Online-Sichtbarkeit, Vertrauen aufbauen"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Positionierung als gründende Person in der Öffentlichkeit"
            })]
          }), createVNode("tr", {
            class: "hover:bg-background-200 transition-colors duration-150",
            children: [createVNode("td", {
              class: "px-6 py-4",
              children: "Rechtliche Basics (ohne Rechtsberatung)"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Rechtsformen, Datenschutz, Gründungsdokumente"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Orientierung im rechtlichen Rahmen"
            })]
          }), createVNode("tr", {
            class: "hover:bg-background-200 transition-colors duration-150",
            children: [createVNode("td", {
              class: "px-6 py-4",
              children: "Impact & Nachhaltigkeit im Startup-Alltag"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Sinnorientiertes Wirtschaften, ESG-Prinzipien"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Grundlagen für nachhaltige Geschäftsmodelle"
            })]
          }), createVNode("tr", {
            class: "hover:bg-background-200 transition-colors duration-150",
            children: [createVNode("td", {
              class: "px-6 py-4",
              children: "Tools & Produktivität für Gründer*innen"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Digitale Tools, Workflow-Optimierung"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Direkt anwendbare Tools für mehr Effizienz"
            })]
          }), createVNode("tr", {
            class: "hover:bg-background-200 transition-colors duration-150",
            children: [createVNode("td", {
              class: "px-6 py-4",
              children: "Teamdynamik & Konfliktmanagement"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Kommunikation, Rollenverteilung, Konfliktlösung"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Besseres Miteinander und weniger Reibung im Gründungsteam"
            })]
          }), createVNode("tr", {
            class: "hover:bg-background-200 transition-colors duration-150",
            children: [createVNode("td", {
              class: "px-6 py-4",
              children: "Kreativitätstechniken für die Ideenfindung"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Design Thinking, Brainstorming, Ideation"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Methoden zur strukturierten Ideenentwicklung"
            })]
          }), createVNode("tr", {
            class: "hover:bg-background-200 transition-colors duration-150",
            children: [createVNode("td", {
              class: "px-6 py-4",
              children: "Interkulturelles Gründen"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Internationale Teams und Märkte"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Erfahrungen aus dem globalen Kontext teilen"
            })]
          }), createVNode("tr", {
            class: "hover:bg-background-200 transition-colors duration-150",
            children: [createVNode("td", {
              class: "px-6 py-4",
              children: "Fehlerkultur & Learnings aus gescheiterten Projekten"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Reflexion, offene Fehlerkommunikation"
            }), createVNode("td", {
              class: "px-6 py-4",
              children: "Mut und Mindset für den Umgang mit Rückschlägen"
            })]
          })]
        })]
      })
    }), "\n", createVNode(_components.h2, {
      id: "so-unterstützt-ignite-deine-peer-to-peer-session",
      children: "So unterstützt IGNITE deine Peer-to-Peer Session"
    }), "\n", createVNode(_components.p, {
      children: "IGNITE steht dir von Anfang bis Ende zur Seite. Wenn du eine Peer-to-Peer Session anbietest, erhältst du:"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Organisation und Infrastruktur"
        }), ": Wir kümmern uns um Räumlichkeiten, Technik und Rahmenbedingungen."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Kommunikation und Reichweite"
        }), ": Dein Workshop oder Vortrag wird aktiv beworben und erreicht dadurch eine breitere Zielgruppe."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Zugang zum Netzwerk"
        }), ": Profitiere von der Vernetzung innerhalb der Startup-Community und erhalte wertvolle Rückmeldungen."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Feedback und Coaching"
        }), ": Bei Bedarf bieten wir dir Unterstützung bei der Vorbereitung und Gestaltung deiner Session."]
      }), "\n"]
    }), "\n", createVNode(_components.h2, {
      id: "dein-nächster-schritt-werde-aktiver-teil-der-ignite-community",
      children: "Dein nächster Schritt: Werde aktiver Teil der IGNITE-Community"
    }), "\n", createVNode(_components.p, {
      children: "Du möchtest deine Erfahrung teilen und die Gründungskultur an deiner Universität bereichern? Melde dich bei uns, um deine eigene Peer-to-Peer Session zu planen!"
    }), "\n", createVNode(_components.p, {
      children: createVNode(_components.a, {
        href: "https://www.ignite-startupclub.de/kontakt",
        children: "Jetzt Peer-to-Peer Session vorschlagen und Teil der Community werden"
      })
    })]
  });
}
function MDXContent(props = {}) {
  return createVNode(MDXLayout, {
    ...props,
    children: createVNode(_createMdxContent, {
      ...props
    })
  });
}

const url = "/peer-to-peer";
const file = "/Users/silaskruckenberg/Documents/University/Leuphana/IGNITE CI/Website/IGNITE/src/pages/peer-to-peer.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/silaskruckenberg/Documents/University/Leuphana/IGNITE CI/Website/IGNITE/src/pages/peer-to-peer.mdx";
__astro_tag_component__(Content, 'astro:jsx');

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  Content,
  default: Content,
  file,
  frontmatter,
  getHeadings,
  url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
