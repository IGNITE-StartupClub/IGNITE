import { _ as __astro_tag_component__, f as createVNode, F as Fragment } from '../chunks/astro/server_BPXzsi7f.mjs';
import { $ as $$MarkdownLayout } from '../chunks/MarkdownLayout_l-J29eKh.mjs';
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
  "title": "Datenschutzerklärung"
};
function getHeadings() {
  return [{
    "depth": 1,
    "slug": "datenschutzerklärung",
    "text": "Datenschutzerklärung"
  }, {
    "depth": 2,
    "slug": "inhaltsübersicht",
    "text": "Inhaltsübersicht"
  }, {
    "depth": 2,
    "slug": "verantwortlicher",
    "text": "Verantwortlicher"
  }, {
    "depth": 2,
    "slug": "übersicht-der-verarbeitungen",
    "text": "Übersicht der Verarbeitungen"
  }, {
    "depth": 3,
    "slug": "arten-der-verarbeiteten-daten",
    "text": "Arten der verarbeiteten Daten"
  }, {
    "depth": 3,
    "slug": "kategorien-betroffener-personen",
    "text": "Kategorien betroffener Personen"
  }, {
    "depth": 3,
    "slug": "zwecke-der-verarbeitung",
    "text": "Zwecke der Verarbeitung"
  }, {
    "depth": 2,
    "slug": "maßgebliche-rechtsgrundlagen",
    "text": "Maßgebliche Rechtsgrundlagen"
  }, {
    "depth": 2,
    "slug": "sicherheitsmaßnahmen",
    "text": "Sicherheitsmaßnahmen"
  }, {
    "depth": 2,
    "slug": "übermittlung-von-personenbezogenen-daten",
    "text": "Übermittlung von personenbezogenen Daten"
  }, {
    "depth": 2,
    "slug": "internationale-datentransfers",
    "text": "Internationale Datentransfers"
  }, {
    "depth": 2,
    "slug": "rechte-der-betroffenen-personen",
    "text": "Rechte der betroffenen Personen"
  }, {
    "depth": 2,
    "slug": "bereitstellung-des-onlineangebots-und-webhosting",
    "text": "Bereitstellung des Onlineangebots und Webhosting"
  }, {
    "depth": 3,
    "slug": "verarbeitete-datenarten",
    "text": "Verarbeitete Datenarten:"
  }, {
    "depth": 3,
    "slug": "betroffene-personen",
    "text": "Betroffene Personen:"
  }, {
    "depth": 3,
    "slug": "zwecke-der-verarbeitung-1",
    "text": "Zwecke der Verarbeitung:"
  }, {
    "depth": 3,
    "slug": "aufbewahrung-und-löschung",
    "text": "Aufbewahrung und Löschung:"
  }, {
    "depth": 3,
    "slug": "rechtsgrundlagen",
    "text": "Rechtsgrundlagen:"
  }, {
    "depth": 2,
    "slug": "einsatz-von-cookies",
    "text": "Einsatz von Cookies"
  }, {
    "depth": 3,
    "slug": "speicherdauer",
    "text": "Speicherdauer:"
  }, {
    "depth": 2,
    "slug": "blogs-und-publikationsmedien",
    "text": "Blogs und Publikationsmedien"
  }, {
    "depth": 2,
    "slug": "kontakt--und-anfrageverwaltung",
    "text": "Kontakt- und Anfrageverwaltung"
  }, {
    "depth": 2,
    "slug": "präsenzen-in-sozialen-netzwerken-social-media",
    "text": "Präsenzen in sozialen Netzwerken (Social Media)"
  }, {
    "depth": 2,
    "slug": "plug-ins-und-eingebettete-funktionen-sowie-inhalte",
    "text": "Plug-ins und eingebettete Funktionen sowie Inhalte"
  }];
}
function _createMdxContent(props) {
  const _components = {
    a: "a",
    br: "br",
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
      id: "datenschutzerklärung",
      children: "Datenschutzerklärung"
    }), "\n", createVNode(_components.p, {
      children: [createVNode(_components.strong, {
        children: "Stand:"
      }), " ", createVNode("span", {
        children: new Date().toLocaleDateString('de-DE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
      })]
    }), "\n", createVNode(_components.h2, {
      id: "inhaltsübersicht",
      children: "Inhaltsübersicht"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "#m3",
          children: "Verantwortlicher"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "#mOverview",
          children: "Übersicht der Verarbeitungen"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "#m2427",
          children: "Maßgebliche Rechtsgrundlagen"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "#m27",
          children: "Sicherheitsmaßnahmen"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "#m25",
          children: "Übermittlung von personenbezogenen Daten"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "#m24",
          children: "Internationale Datentransfers"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "#m10",
          children: "Rechte der betroffenen Personen"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "#m225",
          children: "Bereitstellung des Onlineangebots und Webhosting"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "#m134",
          children: "Einsatz von Cookies"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "#m104",
          children: "Blogs und Publikationsmedien"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "#m182",
          children: "Kontakt- und Anfrageverwaltung"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "#m136",
          children: "Präsenzen in sozialen Netzwerken (Social Media)"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "#m328",
          children: "Plug-ins und eingebettete Funktionen sowie Inhalte"
        })
      }), "\n"]
    }), "\n", createVNode(_components.h2, {
      id: "verantwortlicher",
      children: "Verantwortlicher"
    }), "\n", createVNode(_components.p, {
      children: ["IGNITE - Startup Club Lüneburg", createVNode(_components.br, {}), "\nUniversitätsallee 1", createVNode(_components.br, {}), "\n21335 Lüneburg"]
    }), "\n", createVNode(_components.p, {
      children: [createVNode(_components.strong, {
        children: "Vertretungsberechtigte Person:"
      }), " Linus Heidemann", createVNode(_components.br, {}), "\n", createVNode(_components.strong, {
        children: "E-Mail-Adresse:"
      }), " ", createVNode(_components.a, {
        href: "mailto:ignite.startupclub@gmail.com",
        children: "ignite.startupclub@gmail.com"
      }), createVNode(_components.br, {}), "\n", createVNode(_components.strong, {
        children: "Impressum:"
      }), " ", createVNode(_components.a, {
        href: "https://ignite-startupclub.de/impressum",
        children: "https://ignite-startupclub.de/impressum"
      })]
    }), "\n", createVNode(_components.h2, {
      id: "übersicht-der-verarbeitungen",
      children: "Übersicht der Verarbeitungen"
    }), "\n", createVNode(_components.p, {
      children: "Die nachfolgende Übersicht fasst die Arten der verarbeiteten Daten und die Zwecke ihrer Verarbeitung zusammen und verweist auf die betroffenen Personen."
    }), "\n", createVNode(_components.h3, {
      id: "arten-der-verarbeiteten-daten",
      children: "Arten der verarbeiteten Daten"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: "Bestandsdaten"
      }), "\n", createVNode(_components.li, {
        children: "Kontaktdaten"
      }), "\n", createVNode(_components.li, {
        children: "Inhaltsdaten"
      }), "\n", createVNode(_components.li, {
        children: "Nutzungsdaten"
      }), "\n", createVNode(_components.li, {
        children: "Meta-, Kommunikations- und Verfahrensdaten"
      }), "\n", createVNode(_components.li, {
        children: "Protokolldaten"
      }), "\n"]
    }), "\n", createVNode(_components.h3, {
      id: "kategorien-betroffener-personen",
      children: "Kategorien betroffener Personen"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: "Kommunikationspartner"
      }), "\n", createVNode(_components.li, {
        children: "Nutzer"
      }), "\n"]
    }), "\n", createVNode(_components.h3, {
      id: "zwecke-der-verarbeitung",
      children: "Zwecke der Verarbeitung"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: "Kommunikation"
      }), "\n", createVNode(_components.li, {
        children: "Sicherheitsmaßnahmen"
      }), "\n", createVNode(_components.li, {
        children: "Reichweitenmessung"
      }), "\n", createVNode(_components.li, {
        children: "Tracking"
      }), "\n", createVNode(_components.li, {
        children: "Zielgruppenbildung"
      }), "\n", createVNode(_components.li, {
        children: "Organisations- und Verwaltungsverfahren"
      }), "\n", createVNode(_components.li, {
        children: "Feedback"
      }), "\n", createVNode(_components.li, {
        children: "Marketing"
      }), "\n", createVNode(_components.li, {
        children: "Bereitstellung unseres Onlineangebotes und Nutzerfreundlichkeit"
      }), "\n", createVNode(_components.li, {
        children: "Informationstechnische Infrastruktur"
      }), "\n", createVNode(_components.li, {
        children: "Öffentlichkeitsarbeit"
      }), "\n"]
    }), "\n", createVNode(_components.h2, {
      id: "maßgebliche-rechtsgrundlagen",
      children: "Maßgebliche Rechtsgrundlagen"
    }), "\n", createVNode(_components.h2, {
      id: "sicherheitsmaßnahmen",
      children: "Sicherheitsmaßnahmen"
    }), "\n", createVNode(_components.p, {
      children: "Wir treffen nach Maßgabe der gesetzlichen Vorgaben unter Berücksichtigung des Stands der Technik, der Implementierungskosten und der Art, des Umfangs, der Umstände und der Zwecke der Verarbeitung sowie der unterschiedlichen Eintrittswahrscheinlichkeiten und des Ausmaßes der Bedrohung der Rechte und Freiheiten natürlicher Personen geeignete technische und organisatorische Maßnahmen, um ein dem Risiko angemessenes Schutzniveau zu gewährleisten."
    }), "\n", createVNode(_components.p, {
      children: "Zu den Maßnahmen gehören insbesondere die Sicherung der Vertraulichkeit, Integrität und Verfügbarkeit von Daten durch Kontrolle des physischen und elektronischen Zugangs zu den Daten als auch des sie betreffenden Zugriffs, der Eingabe, der Weitergabe, der Sicherung der Verfügbarkeit und ihrer Trennung. Des Weiteren haben wir Verfahren eingerichtet, die eine Wahrnehmung von Betroffenenrechten, die Löschung von Daten und Reaktionen auf die Gefährdung der Daten gewährleisten. Ferner berücksichtigen wir den Schutz personenbezogener Daten bereits bei der Entwicklung bzw. Auswahl von Hardware, Software sowie Verfahren entsprechend dem Prinzip des Datenschutzes, durch Technikgestaltung und durch datenschutzfreundliche Voreinstellungen."
    }), "\n", createVNode(_components.h2, {
      id: "übermittlung-von-personenbezogenen-daten",
      children: "Übermittlung von personenbezogenen Daten"
    }), "\n", createVNode(_components.p, {
      children: "Im Rahmen unserer Verarbeitung von personenbezogenen Daten kommt es vor, dass diese an andere Stellen, Unternehmen, rechtlich selbstständige Organisationseinheiten oder Personen übermittelt beziehungsweise ihnen gegenüber offengelegt werden. Zu den Empfängern dieser Daten können z. B. mit IT-Aufgaben beauftragte Dienstleister gehören oder Anbieter von Diensten und Inhalten, die in eine Website eingebunden sind. In solchen Fällen beachten wir die gesetzlichen Vorgaben und schließen insbesondere entsprechende Verträge bzw. Vereinbarungen, die dem Schutz Ihrer Daten dienen, mit den Empfängern Ihrer Daten ab."
    }), "\n", createVNode(_components.h2, {
      id: "internationale-datentransfers",
      children: "Internationale Datentransfers"
    }), "\n", createVNode(_components.h2, {
      id: "rechte-der-betroffenen-personen",
      children: "Rechte der betroffenen Personen"
    }), "\n", createVNode(_components.h2, {
      id: "bereitstellung-des-onlineangebots-und-webhosting",
      children: "Bereitstellung des Onlineangebots und Webhosting"
    }), "\n", createVNode(_components.p, {
      children: "Wir verarbeiten die Daten der Nutzer, um ihnen unsere Online-Dienste zur Verfügung stellen zu können. Zu diesem Zweck verarbeiten wir die IP-Adresse des Nutzers, die notwendig ist, um die Inhalte und Funktionen unserer Online-Dienste an den Browser oder das Endgerät der Nutzer zu übermitteln."
    }), "\n", createVNode(_components.h3, {
      id: "verarbeitete-datenarten",
      children: "Verarbeitete Datenarten:"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: "Nutzungsdaten (z. B. Seitenaufrufe und Verweildauer, Klickpfade, Nutzungsintensität und -frequenz, verwendete Gerätetypen und Betriebssysteme, Interaktionen mit Inhalten und Funktionen)"
      }), "\n", createVNode(_components.li, {
        children: "Meta-, Kommunikations- und Verfahrensdaten (z. B. IP-Adressen, Zeitangaben, Identifikationsnummern, beteiligte Personen)"
      }), "\n", createVNode(_components.li, {
        children: "Protokolldaten (z. B. Logfiles betreffend Logins oder den Abruf von Daten oder Zugriffszeiten)"
      }), "\n"]
    }), "\n", createVNode(_components.h3, {
      id: "betroffene-personen",
      children: "Betroffene Personen:"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: "Nutzer (z. B. Webseitenbesucher, Nutzer von Onlinediensten)"
      }), "\n"]
    }), "\n", createVNode(_components.h3, {
      id: "zwecke-der-verarbeitung-1",
      children: "Zwecke der Verarbeitung:"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: "Bereitstellung unseres Onlineangebotes und Nutzerfreundlichkeit"
      }), "\n", createVNode(_components.li, {
        children: "Informationstechnische Infrastruktur (Betrieb und Bereitstellung von Informationssystemen und technischen Geräten (Computer, Server etc.))"
      }), "\n", createVNode(_components.li, {
        children: "Sicherheitsmaßnahmen"
      }), "\n"]
    }), "\n", createVNode(_components.h3, {
      id: "aufbewahrung-und-löschung",
      children: "Aufbewahrung und Löschung:"
    }), "\n", createVNode(_components.p, {
      children: "Löschung entsprechend Angaben im Abschnitt “Allgemeine Informationen zur Datenspeicherung und Löschung”."
    }), "\n", createVNode(_components.h3, {
      id: "rechtsgrundlagen",
      children: "Rechtsgrundlagen:"
    }), "\n", createVNode(_components.p, {
      children: "Berechtigte Interessen (Art. 6 Abs. 1 S. 1 lit. f) DSGVO)."
    }), "\n", createVNode(_components.h2, {
      id: "einsatz-von-cookies",
      children: "Einsatz von Cookies"
    }), "\n", createVNode(_components.p, {
      children: "Unter dem Begriff „Cookies” werden Funktionen, die Informationen auf Endgeräten der Nutzer speichern und aus ihnen auslesen, verstanden. Cookies können ferner in Bezug auf unterschiedliche Anliegen Einsatz finden, etwa zu Zwecken der Funktionsfähigkeit, der Sicherheit und des Komforts von Onlineangeboten sowie der Erstellung von Analysen der Besucherströme. Wir verwenden Cookies gemäß den gesetzlichen Vorschriften. Dazu holen wir, wenn erforderlich, vorab die Zustimmung der Nutzer ein. Ist eine Zustimmung nicht notwendig, setzen wir auf unsere berechtigten Interessen."
    }), "\n", createVNode(_components.h3, {
      id: "speicherdauer",
      children: "Speicherdauer:"
    }), "\n", createVNode(_components.p, {
      children: "Im Hinblick auf die Speicherdauer werden die folgenden Arten von Cookies unterschieden:"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Temporäre Cookies (auch: Session- oder Sitzungscookies):"
        }), " Temporäre Cookies werden spätestens gelöscht, nachdem ein Nutzer ein Onlineangebot verlassen und sein Endgerät (z. B. Browser oder mobile Applikation) geschlossen hat."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Permanente Cookies:"
        }), " Permanente Cookies bleiben auch nach dem Schließen des Endgeräts gespeichert. So können beispielsweise der Log-in-Status gespeichert und bevorzugte Inhalte direkt angezeigt werden, wenn der Nutzer eine Website erneut besucht."]
      }), "\n"]
    }), "\n", createVNode(_components.h2, {
      id: "blogs-und-publikationsmedien",
      children: "Blogs und Publikationsmedien"
    }), "\n", createVNode(_components.p, {
      children: "Wir nutzen Blogs oder vergleichbare Mittel der Onlinekommunikation und Publikation. Die Daten der Leser werden für die Zwecke des Publikationsmediums nur insoweit verarbeitet, als es für dessen Darstellung und die Kommunikation zwischen Autoren und Lesern oder aus Gründen der Sicherheit erforderlich ist."
    }), "\n", createVNode(_components.h2, {
      id: "kontakt--und-anfrageverwaltung",
      children: "Kontakt- und Anfrageverwaltung"
    }), "\n", createVNode(_components.p, {
      children: "Bei der Kontaktaufnahme mit uns (z. B. per Post, Kontaktformular, E-Mail, Telefon oder via soziale Medien) werden die Angaben der anfragenden Personen verarbeitet, soweit dies zur Beantwortung der Kontaktanfragen und etwaiger angefragter Maßnahmen erforderlich ist."
    }), "\n", createVNode(_components.h2, {
      id: "präsenzen-in-sozialen-netzwerken-social-media",
      children: "Präsenzen in sozialen Netzwerken (Social Media)"
    }), "\n", createVNode(_components.p, {
      children: "Wir unterhalten Onlinepräsenzen innerhalb sozialer Netzwerke und verarbeiten in diesem Rahmen Nutzerdaten, um mit den dort aktiven Nutzern zu kommunizieren oder Informationen über uns anzubieten."
    }), "\n", createVNode(_components.h2, {
      id: "plug-ins-und-eingebettete-funktionen-sowie-inhalte",
      children: "Plug-ins und eingebettete Funktionen sowie Inhalte"
    }), "\n", createVNode(_components.p, {
      children: "Wir binden Funktions- und Inhaltselemente in unser Onlineangebot ein, die von den Servern ihrer jeweiligen Anbieter (nachfolgend als „Drittanbieter” bezeichnet) bezogen werden."
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

const url = "/datenschutz";
const file = "/Users/silaskruckenberg/Documents/University/Leuphana/IGNITE CI/Website/IGNITE/src/pages/datenschutz.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/silaskruckenberg/Documents/University/Leuphana/IGNITE CI/Website/IGNITE/src/pages/datenschutz.mdx";
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
