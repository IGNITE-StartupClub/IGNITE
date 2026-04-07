import { c as contactTopics, a as contactPage } from '../../chunks/staticContent_DtTHaJzU.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async () => {
  try {
    const defaultConfig = {
      formTopicLabel: "Anliegen",
      formTopicPlaceholder: "Bitte wählen",
      formFirstNameLabel: "Vorname",
      formLastNameLabel: "Nachname",
      formEmailLabel: "E-Mail",
      formMessageLabel: "Nachricht",
      formOrganizationLabel: "Organisation/Unternehmen",
      formExpertiseLabel: "Fachgebiet/Expertise",
      formExpertisePlaceholder: "Beschreiben Sie kurz Ihre Expertise und wie Sie das IGNITE Team unterstützen können...",
      submitButtonText: "Absenden",
      successMessage: "<h3>Danke für deine Nachricht!</h3><p>Wir werden uns bald bei dir melden.</p>",
      successMessageAdvisory: '<h3>Vielen Dank für Ihr Interesse!</h3><p>Wir haben Ihre Anfrage zum Advisory Board erhalten und freuen uns sehr über Ihr Interesse, den IGNITE Startup Club Lüneburg zu unterstützen. Unser Team wird sich zeitnah bei Ihnen melden, um die nächsten Schritte zu besprechen.</p><p class="contact-info">Bei dringenden Fragen erreichen Sie uns auch direkt unter <a href="mailto:info@ignite-startupclub.de">info@ignite-startupclub.de</a></p>',
      advisoryInfoMessage: "Vielen Dank für Ihr Interesse an unserem Advisory Board! Um Sie optimal unterstützen zu können, bitten wir Sie um einige zusätzliche Informationen zu Ihrer Person und Expertise.",
      errorMessage: "Fehler beim Absenden der Nachricht",
      topics: [
        { value: "advisory", label: "Advisory Board Interesse", requiresAdditionalFields: true },
        { value: "partner", label: "Partner werden", requiresAdditionalFields: false },
        { value: "mitglied", label: "Mitglied werden", requiresAdditionalFields: false },
        { value: "workshop", label: "Workshop veranstalten", requiresAdditionalFields: false },
        { value: "sonstiges", label: "Sonstiges", requiresAdditionalFields: false }
      ]
    };
    const config = {
      formTopicLabel: contactPage.formTopicLabel,
      formTopicPlaceholder: contactPage.formTopicPlaceholder,
      formFirstNameLabel: contactPage.formFirstNameLabel,
      formLastNameLabel: contactPage.formLastNameLabel,
      formEmailLabel: contactPage.formEmailLabel,
      formMessageLabel: contactPage.formMessageLabel,
      formOrganizationLabel: contactPage.formOrganizationLabel,
      formExpertiseLabel: contactPage.formExpertiseLabel,
      formExpertisePlaceholder: contactPage.formExpertisePlaceholder,
      submitButtonText: contactPage.submitButtonText,
      successMessage: contactPage.successMessage,
      successMessageAdvisory: contactPage.successMessageAdvisory,
      advisoryInfoMessage: contactPage.advisoryInfoMessage,
      errorMessage: contactPage.errorMessage,
      topics: contactTopics
    };
    return new Response(JSON.stringify(config), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error fetching contact config:", error);
    return new Response(JSON.stringify({ error: "Failed to load contact configuration" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
