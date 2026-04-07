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
  "title": "Ignite Startup Club Workshops"
};
function getHeadings() {
  return [{
    "depth": 1,
    "slug": "ignite-startup-club-workshops",
    "text": "Ignite Startup Club Workshops"
  }, {
    "depth": 2,
    "slug": "deine-reise-zum-erfolgreichen-startup-beginnt-hier",
    "text": "Deine Reise zum erfolgreichen Startup beginnt hier"
  }, {
    "depth": 2,
    "slug": "warum-diese-workshops-so-wertvoll-sind",
    "text": "Warum diese Workshops so wertvoll sind"
  }, {
    "depth": 2,
    "slug": "was-erwartet-dich-in-unseren-workshops",
    "text": "Was erwartet dich in unseren Workshops?"
  }, {
    "depth": 3,
    "slug": "praktische-fähigkeiten-die-du-sofort-umsetzen-kannst",
    "text": "Praktische Fähigkeiten, die du sofort umsetzen kannst"
  }, {
    "depth": 3,
    "slug": "unsere-methodik-interaktiv-und-praxisnah",
    "text": "Unsere Methodik: Interaktiv und praxisnah"
  }, {
    "depth": 3,
    "slug": "ein-unterstützendes-umfeld",
    "text": "Ein unterstützendes Umfeld"
  }, {
    "depth": 2,
    "slug": "die-workshops-im-detail",
    "text": "Die Workshops im Detail"
  }, {
    "depth": 2,
    "slug": "dein-nächster-schritt-werde-teil-der-ignite-community",
    "text": "Dein nächster Schritt: Werde Teil der Ignite-Community"
  }];
}
function _createMdxContent(props) {
  const _components = {
    a: "a",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    hr: "hr",
    li: "li",
    p: "p",
    strong: "strong",
    ul: "ul",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h1, {
      id: "ignite-startup-club-workshops",
      children: "Ignite Startup Club Workshops"
    }), "\n", createVNode($$Notification, {
      type: "message",
      children: [createVNode($$Icon, {
        name: "ion:information-circle-outline"
      }), createVNode("p", {
        children: createVNode(_components.p, {
          children: [createVNode("strong", {
            children: "Info:"
          }), " Im Ignite Startup Club bieten wir Studierenden praxisorientierte Workshops an, die ihnen helfen, unternehmerische Fähigkeiten zu entwickeln und ihre Geschäftsideen erfolgreich umzusetzen. Diese Workshops sind speziell darauf ausgelegt, dich auf deinem Weg in die Selbstständigkeit zu begleiten."]
        })
      })]
    }), "\n", createVNode(_components.h2, {
      id: "deine-reise-zum-erfolgreichen-startup-beginnt-hier",
      children: "Deine Reise zum erfolgreichen Startup beginnt hier"
    }), "\n", createVNode(_components.p, {
      children: "Der Weg in die Selbstständigkeit kann herausfordernd sein – vor allem, wenn man noch keine Erfahrung in der Gründung eines Unternehmens hat. Genau hier setzen die Workshops des Ignite Startup Clubs an. Wir bieten Studierenden die Möglichkeit, ihre unternehmerischen Fähigkeiten auszubauen und ihre Ideen konkret in die Praxis umzusetzen. Unsere Workshops sind interaktiv und praxisorientiert, sodass du das Gelernte direkt anwenden kannst."
    }), "\n", createVNode(_components.p, {
      children: "In jeder Veranstaltung geht es nicht nur um Theorie – wir vermitteln praxisnahes Wissen, das du direkt in deinen eigenen Projekten nutzen kannst. Unser Ziel ist es, dir das nötige Handwerkszeug mitzugeben, damit du selbstbewusst und vorbereitet in die Welt des Unternehmertums starten kannst."
    }), "\n", createVNode(_components.h2, {
      id: "warum-diese-workshops-so-wertvoll-sind",
      children: "Warum diese Workshops so wertvoll sind"
    }), "\n", createVNode(_components.p, {
      children: "Die Workshops des Ignite Startup Clubs sind mehr als nur eine Sammlung von Vorträgen. Sie bieten einen Raum für persönliches Wachstum, Austausch und Inspiration. Hier erfährst du alles, was du wissen musst, um ein eigenes Unternehmen erfolgreich zu gründen – von der Ideenfindung über die Entwicklung eines Businessplans bis hin zur Umsetzung und Finanzierung."
    }), "\n", createVNode(_components.p, {
      children: "Wir setzen dabei auf einen interaktiven Ansatz: Statt nur zuzuhören, wirst du aktiv in den Prozess eingebunden. Du arbeitest mit anderen Studierenden und Gründungsinteressierten zusammen, entwickelst Ideen weiter und erlebst die Herausforderungen der Unternehmensgründung hautnah."
    }), "\n", createVNode(_components.h2, {
      id: "was-erwartet-dich-in-unseren-workshops",
      children: "Was erwartet dich in unseren Workshops?"
    }), "\n", createVNode(_components.h3, {
      id: "praktische-fähigkeiten-die-du-sofort-umsetzen-kannst",
      children: "Praktische Fähigkeiten, die du sofort umsetzen kannst"
    }), "\n", createVNode(_components.p, {
      children: "Unser Ziel ist es, dir konkrete Fähigkeiten zu vermitteln, die du auf deiner unternehmerischen Reise sofort anwenden kannst. Die Workshops bieten dir alles, was du brauchst, um deine Geschäftsidee weiterzuentwickeln und erfolgreich zu starten. Du lernst unter anderem:"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Eine überzeugende Pitch-Präsentation zu erstellen"
        }), ": Präsentier deine Idee klar und wirkungsvoll, um Unterstützer:innen, Partner:innen oder Investor:innen zu gewinnen."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Ein Business-Modell zu entwickeln"
        }), ": Wir zeigen dir, wie du das passende Geschäftsmodell für deine Idee findest – und wie du es nachhaltig weiterentwickelst."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Ein effektives Netzwerk aufzubauen"
        }), ": Du erfährst, wie man wichtige Kontakte knüpft, pflegt und sich gegenseitig stärkt."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Strategien für das Fundraising zu entwickeln"
        }), ": Lerne, wie du deine Finanzierung planst und potenzielle Fördernde oder Investor:innen ansprichst."]
      }), "\n"]
    }), "\n", createVNode(_components.h3, {
      id: "unsere-methodik-interaktiv-und-praxisnah",
      children: "Unsere Methodik: Interaktiv und praxisnah"
    }), "\n", createVNode(_components.p, {
      children: "Unsere Workshops folgen einem strukturierten Ablauf, der dich aktiv in den Lernprozess einbindet. Mit praxisorientierten Übungen, Gruppenarbeiten und realen Fallbeispielen stellst du sicher, dass du das Gelernte direkt anwenden kannst."
    }), "\n", createVNode(_components.p, {
      children: "Jede Veranstaltung fördert den Austausch: Du tauschst dich mit anderen Teilnehmenden aus, entwickelst Ideen weiter und betrachtest Herausforderungen aus unterschiedlichen Perspektiven. Wir fördern Dialog, Kooperation und ein respektvolles Miteinander."
    }), "\n", createVNode(_components.h3, {
      id: "ein-unterstützendes-umfeld",
      children: "Ein unterstützendes Umfeld"
    }), "\n", createVNode(_components.p, {
      children: "Der Ignite Startup Club bietet dir nicht nur Workshops, sondern auch ein unterstützendes Netzwerk aus erfahrenen Gründer:innen, Mentor:innen und Gleichgesinnten, die dich auf deinem Weg begleiten. Du profitierst von persönlichen Erfahrungen, praktischen Tipps und ehrlichem Feedback. Gemeinsam wachsen – das steht bei uns im Mittelpunkt."
    }), "\n", createVNode(_components.h2, {
      id: "die-workshops-im-detail",
      children: "Die Workshops im Detail"
    }), "\n", createVNode(_components.p, {
      children: "Unsere Workshops decken vielfältige Themen ab, die für Gründer:innen und Startup-Enthusiast:innen besonders relevant sind. Ein kleiner Einblick:"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "How to Pitch"
        }), ": Lerne, wie du deine Idee klar und selbstbewusst präsentierst – ob auf der Bühne oder im Gespräch mit Investor:innen."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Entrepreneurship Basics"
        }), ": Erhalte einen umfassenden Einstieg in die Welt des Unternehmertums – von der Idee bis zur Umsetzung."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Business Models and Strategies"
        }), ": Entwickle ein nachhaltiges Geschäftsmodell und definiere deine Strategie für langfristigen Erfolg."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Fundraising und Investor Relations"
        }), ": Erfahre, wie du Kapital beschaffst und vertrauensvolle Beziehungen zu Investor:innen aufbaust."]
      }), "\n"]
    }), "\n", createVNode(_components.p, {
      children: "Alle Inhalte sind darauf ausgelegt, dass du sie direkt in deinem eigenen Projekt oder Team anwenden kannst."
    }), "\n", createVNode(_components.h2, {
      id: "dein-nächster-schritt-werde-teil-der-ignite-community",
      children: "Dein nächster Schritt: Werde Teil der Ignite-Community"
    }), "\n", createVNode(_components.p, {
      children: "Unsere Workshops bieten dir die Gelegenheit, nicht nur dein Wissen zu erweitern, sondern dich mit anderen Gründer:innen, Studierenden und Startup-Interessierten zu vernetzen. Sei dabei – und entwickle mit uns die nächsten großen Ideen."
    }), "\n", createVNode(_components.p, {
      children: createVNode(_components.a, {
        href: "/kontakt",
        children: "Jetzt anmelden und mehr erfahren"
      })
    }), "\n", createVNode(_components.hr, {})]
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

const url = "/IGNITEWorkshops";
const file = "/Users/silaskruckenberg/Documents/University/Leuphana/IGNITE CI/Website/IGNITE/src/pages/IGNITEWorkshops.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/silaskruckenberg/Documents/University/Leuphana/IGNITE CI/Website/IGNITE/src/pages/IGNITEWorkshops.mdx";
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
