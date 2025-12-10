// =============================================================================
// STAKEHOLDER DATA - EDIT HERE
// =============================================================================
// TOON Format: Compact keys reduce tokens, full names in comments
// Add stakeholders by copying a block and changing values
// =============================================================================

import type { MapData } from "../types/stakeholder-map";

export const DATA: MapData = {
  // cur: current selections (phase ID, stakeholder ID)
  cur: { p: "p1", s: "s1" },

  // ph: phases array
  ph: [
    // ──────────────── PHASE 1 ────────────────
    {
      id: "p1",                                    // phase ID
      n: 1,                                        // order number
      t: "Ideenfindung & Validierung",             // title
      cat: "Inspiration",                          // category
      // st: stakeholders in this phase
      st: [
        {
          id: "s1",                                // stakeholder ID
          nm: "IGNITE Startup Club",               // name (fallback if no logo)
          logo: "/logos/placeholder.svg",          // logo URL
          pill: "Studentisch",                     // category pill text
          desc: "Community & erste Vernetzung",    // short description (max 50 chars)
          url: "https://ignite-startupclub.de",    // external website
          // det: detail information
          det: {
            full: "Der studentische Startup Club der Leuphana. Vernetzt Gründungsinteressierte und organisiert Events, Workshops und Networking-Sessions.",
            func: "Community Building, Events, Peer-to-Peer Mentoring, Workshops",
            contact: "E-Mail: hello@ignite-startupclub.de | Instagram: @ignite.startupclub"
          }
        },
        {
          id: "s2",
          nm: "Leuphana E-Hub",
          logo: "/logos/placeholder.svg",
          pill: "Universität",
          desc: "Beratung & Gründungsgarage",
          url: "https://leuphana.de/einrichtungen/gruendungsservice",
          det: {
            full: "Zentrale Anlaufstelle für alle Gründungsinteressierten an der Leuphana. Bietet kostenlose Erstberatung und Zugang zur Gründungsgarage.",
            func: "Erstberatung, Zugang zu Ressourcen, Gründungsgarage, Coaching",
            contact: "E-Mail: gruendungsservice@leuphana.de | Ort: Gründungsgarage, Scharnhorststraße"
          }
        },
        {
          id: "s3",
          nm: "IHK Lüneburg-Wolfsburg",
          logo: "/logos/placeholder.svg",
          pill: "Öffentlich",
          desc: "Gründungsberatung & Netzwerk",
          url: "https://www.ihk.de/lueneburg-wolfsburg",
          det: {
            full: "Die Industrie- und Handelskammer bietet umfassende Beratung für Gründer:innen und vermittelt Kontakte zu Unternehmen.",
            func: "Gründungsberatung, Netzwerkvermittlung, Rechtsberatung, Fördermittelberatung",
            contact: "Telefon: 04131 742-0 | Web: www.ihk.de/lueneburg-wolfsburg"
          }
        }
        // ↓ Add more stakeholders here ↓
      ]
    },

    // ──────────────── PHASE 2 ────────────────
    {
      id: "p2",
      n: 2,
      t: "Gründung & Prototyping",
      cat: "Funding & Structure",
      st: [
        {
          id: "s1",
          nm: "Wirtschaftsförderung Lüneburg",
          logo: "/logos/placeholder.svg",
          pill: "Öffentlich",
          desc: "Lokale Netzwerke & Förderung",
          url: "https://www.wirtschaft-lueneburg.de",
          det: {
            full: "Anlaufstelle für lokale Vernetzung und Unterstützung bei Standortfragen. Vermittelt Kontakte zu regionalen Unternehmen.",
            func: "Lokale Vernetzung, Verwaltungshilfe, Zugang zu IHK/HWK, Standortberatung",
            contact: "Telefon: 04131 / 309-3411 | E-Mail: wirtschaftsfoerderung@stadt.lueneburg.de"
          }
        },
        {
          id: "s2",
          nm: "Gründungszentrum Lüneburg",
          logo: "/logos/placeholder.svg",
          pill: "Öffentlich",
          desc: "Co-Working & Infrastruktur",
          url: "https://www.gruendungszentrum-lueneburg.de",
          det: {
            full: "Bietet Büroflächen, Co-Working-Spaces und Infrastruktur für junge Unternehmen. Fördert den Austausch zwischen Startups.",
            func: "Co-Working, Büroflächen, Infrastruktur, Networking-Events",
            contact: "Adresse: Am Sande 1, 21335 Lüneburg | Telefon: 04131 / 123456"
          }
        },
        {
          id: "s3",
          nm: "EXIST-Gründerstipendium",
          logo: "/logos/placeholder.svg",
          pill: "Förderung",
          desc: "Finanzielle Förderung",
          url: "https://www.exist.de",
          det: {
            full: "Förderprogramm des Bundesministeriums für Wirtschaft und Klimaschutz für innovative technologieorientierte oder wissensbasierte Gründungsvorhaben.",
            func: "Finanzielle Förderung (bis zu 1 Jahr), Coaching, Sachausgaben",
            contact: "Web: www.exist.de | Beratung über Leuphana Gründungsservice"
          }
        }
        // ↓ Add more stakeholders here ↓
      ]
    },

    // ──────────────── PHASE 3 ────────────────
    {
      id: "p3",
      n: 3,
      t: "Wachstum & Skalierung",
      cat: "Scaling",
      st: [
        {
          id: "s1",
          nm: "Mittelständische Beteiligungsgesellschaft",
          logo: "/logos/placeholder.svg",
          pill: "Privat",
          desc: "Venture Capital & Beteiligungen",
          url: "https://www.mbg.de",
          det: {
            full: "Beteiligungsgesellschaft, die junge Unternehmen mit Eigenkapital und Mezzanine-Kapital unterstützt.",
            func: "Eigenkapital, Mezzanine-Finanzierung, strategische Beratung",
            contact: "Web: www.mbg.de | Regional unterschiedliche Ansprechpartner"
          }
        },
        {
          id: "s2",
          nm: "Business Angels Netzwerk",
          logo: "/logos/placeholder.svg",
          pill: "Netzwerk",
          desc: "Private Investor:innen",
          url: "https://www.business-angels.de",
          det: {
            full: "Netzwerk erfahrener Unternehmer:innen, die Startups mit Kapital und Know-how unterstützen.",
            func: "Seed-Finanzierung, Mentoring, Netzwerkzugang",
            contact: "Web: www.business-angels.de | Kontakt über Gründungsservice"
          }
        },
        {
          id: "s3",
          nm: "Sparkasse Lüneburg",
          logo: "/logos/placeholder.svg",
          pill: "Öffentlich",
          desc: "Bankpartner & Finanzierung",
          url: "https://www.sparkasse-lueneburg.de",
          det: {
            full: "Lokaler Bankpartner mit speziellen Angeboten für Gründer:innen und Startups.",
            func: "Geschäftskonten, Kredite, Finanzierungsberatung",
            contact: "Telefon: 04131 / 288-0 | Beratungstermine nach Vereinbarung"
          }
        }
        // ↓ Add more stakeholders here ↓
      ]
    }
  ]
};
