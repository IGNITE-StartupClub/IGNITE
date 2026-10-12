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
  ui: {
    next: 'Weiter',
    wordsUnit: 'Wörter',
    submit: 'Anfrage absenden',
    submitting: 'Wird gesendet...',
    success: 'Danke für deine Anfrage! Wir freuen uns über dein Interesse und melden uns bald bei dir.',
    error: 'Es gab einen Fehler beim Absenden. Bitte versuche es erneut oder schreib uns direkt an.',
  },
  personal: {
    privacyBefore: 'Ich akzeptiere die',
    privacyLink: { label: 'Datenschutzbestimmungen', url: '/datenschutz' },
    privacyAfter: '. (Pflichtfeld)',
    emailMismatch: 'Die E-Mail-Adressen stimmen nicht überein.',
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
      emailConfirm: {
        label: 'E-Mail wiederholen',
        type: 'email',
        required: true,
      },
    },
  },
}
