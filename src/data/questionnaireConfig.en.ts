// English counterpart of questionnaireConfig.ts. The option values are sent to /api/submit and must match the German file.
export const questionnaireConfig = {
  intro: {
    buttonText: 'Fill in application',
  },
  situation: {
    legend: 'What best describes your situation?',
    options: [
      { value: 'idea', label: 'I have a startup idea' },
      { value: 'interest', label: 'I am interested in startups' },
      { value: 'learn', label: 'I want to learn more about entrepreneurship' },
      { value: 'network', label: 'I want to network' },
    ],
  },
  contribution: {
    label: 'What do you think you can contribute to the IGNITE community?',
  },
  fascination: {
    label: 'What fascinates you most about founding?',
  },
  ui: {
    next: 'Next',
    wordsUnit: 'words',
    submit: 'Send application',
    submitting: 'Sending...',
    success: 'Thanks for your application! We are glad about your interest and will get back to you soon.',
    error: 'There was an error sending your application. Please try again or write to us directly.',
  },
  personal: {
    newsletterConsent: 'I would like to join the IGNITE WhatsApp community and be informed about events and workshops.',
    privacyBefore: 'I accept the',
    privacyLink: { label: 'privacy policy', url: '/en/privacy' },
    privacyAfter: '. (required)',
    fields: {
      name: {
        label: 'First name',
        type: 'text',
        required: true,
      },
      lastname: {
        label: 'Last name',
        type: 'text',
        required: true,
      },
      email: {
        label: 'Email',
        type: 'email',
        required: true,
      },
    },
  },
}
