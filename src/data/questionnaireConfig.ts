// Static Questionnaire Configuration
// Replaces Strapi CMS for questionnaire data.
// Step order on /mitmachen: intro → situation → contribution → fascination → personal.

export const questionnaireConfig = {
  intro: {
    buttonText: 'Bewerbung ausfüllen',
  },
  situation: {
    legend: 'Was beschreibt deine Situation am besten?',
    options: [
      { value: 'idea', label: 'Ich habe eine Startup-Idee' },
      { value: 'interest', label: 'Ich interessiere mich für Startups' },
      { value: 'learn', label: 'Ich möchte mehr über Entrepreneurship lernen' },
      { value: 'network', label: 'Ich möchte mich vernetzen' },
    ],
  },
  contribution: {
    label: 'Was denkst du, kannst du zu der Ignite-Community beitragen?',
  },
  fascination: {
    label: 'Was fasziniert Dich am meisten am Gründen?',
  },
  personal: {
    fields: {
      name: {
        label: 'Vorname',
        type: 'text',
        required: true,
      },
      lastname: {
        label: 'Nachname',
        type: 'text',
        required: true,
      },
      email: {
        label: 'E-Mail',
        type: 'email',
        required: true,
      },
    },
  },
}
