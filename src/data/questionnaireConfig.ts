// Static Questionnaire Configuration
// Replaces Strapi CMS for questionnaire data

export const questionnaireConfig = {
  step1: {
    buttonText: 'Bewerbung ausfüllen',
  },
  step2: {
    label: 'Wähle 2-3 Teams:',
    minTeams: 2,
    maxTeams: 3,
    hintTooFew: 'Bitte wähle mindestens 2 Teams aus.',
    hintMaximum: 'Du hast die maximale Anzahl erreicht.',
  },
  step3: {
    legend: 'Was beschreibt deine Situation am besten?',
    options: [
      { value: 'idea', label: 'Ich habe eine Startup-Idee' },
      { value: 'interest', label: 'Ich interessiere mich für Startups' },
      { value: 'learn', label: 'Ich möchte mehr über Entrepreneurship lernen' },
      { value: 'network', label: 'Ich möchte mich vernetzen' },
    ],
    questions: {},
  },
  step4: {
    questions: {},
  },
  step5: {
    questions: {},
  },
  step6: {
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
  allQuestions: [],
};
