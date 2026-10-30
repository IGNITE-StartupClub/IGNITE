// English copy. Mirrors every export of staticContent.ts (the German default); the shapes are checked in copy.ts.
// Internal links point into /en/ (see englishSlugs in src/lib/i18n.ts).

export const siteMeta = {
  title: 'IGNITE Startup Club Lueneburg',
  shortName: 'IGNITE Startup Club Lüneburg',
  description: 'IGNITE is the student initiative for entrepreneurship at Leuphana University Lüneburg.',
  author: 'IGNITE Startup Club Lueneburg',
  keywords: ['Startup', 'Lüneburg', 'Student initiative', 'Leuphana', 'University', 'Entrepreneurship', 'Innovation', 'Business', 'Network', 'Mentoring', 'Community', 'Workshops', 'Pitch', 'Founding'],
}

// <title> and meta description per page. A page without description falls back to siteMeta.description.
export const pageMeta = {
  home: {
    title: 'IGNITE - Startup Club Lüneburg',
    description: 'Welcome to IGNITE, your student initiative for entrepreneurship at Leuphana University Lüneburg.',
  },
  contact: {
    title: 'Contact',
    description: 'Get in touch with us. We look forward to your message and are happy to help.',
  },
  join: {
    title: 'Join us',
    description: 'We look forward to having you on the IGNITE team, your startup network in Lüneburg.',
  },
  community: { title: 'Community' },
  events: {
    title: 'Events',
    description: 'Workshops, networking and hackathons about founding a startup at Leuphana.',
  },
  news: { title: 'News' },
  materials: { title: 'Materials and resources' },
  notFound: { title: '404', description: 'Page not found' },
}

// Small strings shared by several components.
export const commonUi = {
  breadcrumbsLabel: 'Breadcrumbs',
  homeCrumb: 'Home',
  coverAltPrefix: 'Cover image:',
  instagramLink: 'Watch on Instagram',
  pagination: {
    label: 'Pagination',
    previous: 'Previous',
    next: 'Next',
    pageOf: (current: number, total: number) => `Page ${current} of ${total}`,
  },
}

export const features = [
  {
    id: 1,
    icon: 'ion:diamond-outline',
    title: 'Workshops and events',
    description:
      'Try out ideas, share experiences and meet founders. In workshops and events we bring students together with people who have already started.',
    link: { label: 'Discover events', href: '/en/events/' },
    order: 1,
    layout: 'wide',
  },
  {
    id: 2,
    icon: 'ion:document-attach-outline',
    title: 'Knowledge to move forward',
    description: 'Checklists, guides and practical tools help you take the next step with your idea. You can use our materials without being a member.',
    link: { label: 'Go to the materials', href: '/en/materials/' },
    order: 3,
    layout: 'half',
  },
  {
    id: 3,
    icon: 'ion:flame-outline',
    title: 'Hackathons with the Startup School',
    description:
      'Together with the Startup School, we help run hackathons. You develop ideas in a team, build first solutions and get feedback.',
    link: { label: 'Go to the events page', href: '/en/events/' },
    order: 2,
    layout: 'half',
  },
  {
    id: 5,
    icon: 'ion:people-outline',
    title: 'A community to shape',
    description: 'Meet other people interested in founding, exchange ideas and help shape IGNITE. Whether you have a first question or a concrete idea: your own perspective adds something.',
    link: { label: 'Join us', href: '/en/join' },
    order: 5,
    layout: 'half',
  },
]

export const faqs = [
  {
    id: 1,
    question: 'What is IGNITE?',
    answer:
      '<p>IGNITE is the student founding initiative at Leuphana. We bring people interested in founding together, make entrepreneurship tangible in practice and help you turn curiosity into first steps.</p>',
    openByDefault: true,
    order: 1,
  },
  {
    id: 2,
    question: 'Do I need an idea or founding experience already?',
    answer:
      '<p>No. Curiosity is enough to start. You can come with an idea of your own or first find out which topic interests you. Students from all fields of study are welcome.</p>',
    openByDefault: false,
    order: 2,
  },
  {
    id: 3,
    question: 'What can I do at IGNITE?',
    answer:
      '<p>You can attend workshops and events, meet other people interested in founding, or help shape formats and projects in a team. We help run hackathons together with the Startup School. You can find current information on our <a href="/en/events/">events page</a>.</p>',
    openByDefault: false,
    order: 3,
  },
  {
    id: 4,
    question: 'How does the application and onboarding process work?',
    answer:
      '<p>You can apply to join our team via <a href="/en/join">Join us</a>. In the introductory conversation that follows, we talk about your interests and where you would like to contribute. Events have their own participation details.</p>',
    openByDefault: false,
    order: 4,
  },
  {
    id: 5,
    question: 'How much time should I plan for the team?',
    answer:
      '<p>That depends on your role and the current projects. In the introductory conversation we work out what fits your studies. What matters is reliable agreements and enjoying getting things done together.</p>',
    openByDefault: false,
    order: 5,
  },
  {
    id: 6,
    question: 'Can I sponsor IGNITE?',
    answer:
      '<p>Yes. You can support our events and projects with expertise, rooms, contacts or funding. Write to us via the <a href="/en/contact">contact form</a> if you would like to work with IGNITE.</p>',
    openByDefault: false,
    order: 6,
  },
]

export const homepage = {
  id: 1,
  heroTitle: 'Your <em>startup spark</em> at Leuphana.',
  heroSubtitle: 'We bring people interested in founding together and turn curiosity into first steps, with workshops, events and a community you can help shape.',
  // Hero image: swap the motif here. `src` is a file name in src/assets/photos (optimized) or a public URL.
  heroImage: {
    src: 'kickoff.jpg',
    alt: 'Group photo from the IGNITE kick-off event at Utopia: around 35 students in front of the projected IGNITE logo.',
  },
  heroObjectAlt: 'Four young founders as marble sculptures discuss in front of a stone tablet engraved with machine blueprints',
  heroCTA_Text: 'Join us',
  heroCTA_URL: '/en/join',
  heroCTA_Icon: 'ion:people-outline',
  whyHeading: 'Good ideas start with <em>people</em> who get going.',
  whyImageAlt: 'Two marble sculptures develop an idea together on a laptop',
  whyParagraphs: [
    'IGNITE is the student founding initiative at Leuphana. We create opportunities to meet people, ask questions and try out ideas together.',
    'Our goal: <em>make founding accessible</em>. For every field of study and for everyone who wants to make something happen, even without a finished business idea.',
  ],
  audienceHeading: '<em>Who</em> it is for',
  audienceLines: [
    'For Leuphana students who are interested in founding.',
    'For everyone with an idea of their own and for everyone still looking for one.',
    'For everyone who wants to build something together in a team.',
  ],
  featuresHeading: 'What we <em>do</em>',
  featuresPhotoAlt: 'Student Startup Guide event: audience and panel in a room at Leuphana.',
  advisoryHeading: 'Our <em>Advisory Board</em>',
  advisoryPhotoAltPrefix: 'Portrait of',
  advisoryMoreLabel: 'Read more',
  advisoryLessLabel: 'Less',
  advisoryLinkedinText: 'LinkedIn',
  advisoryLinkedinLabel: 'LinkedIn profile of',
  advisoryJoinTitle: 'Become part of our board',
  advisoryJoinRole: 'Advisory Board Member',
  advisoryJoinHint: 'Your expertise is wanted.',
  advisoryJoinCTA_Text: 'Express interest',
  advisoryJoinCTA_URL: '/en/contact?intent=advisory',
  newsHeading: 'News from our community',
  newsLead: 'Insights and recaps from everyday life at IGNITE.',
  newsReadMore: 'Read more!',
  newsAuthorLabel: 'By',
  newsCTA_Text: 'All news',
  newsCTA_URL: '/en/news/',
  newsImageAltPrefix: 'Cover image for',
  faqHeading: '<em>Questions?</em>',
  faqCTA_Text: 'Get in touch',
  faqCTA_URL: '/en/contact',
  finalHeading: 'Become <em>part</em> of IGNITE',
  finalText: 'Bring your curiosity, your ideas and your perspective. Help us shape the founding culture at Leuphana.',
  finalCTA_Text: 'Join us',
  finalCTA_URL: '/en/join',
}

export const navigation = {
  id: 1,
  logo: null,
  logoText: 'IGNITE',
  homeUrl: '/en/',
  ctaLabel: 'Join us',
  ctaUrl: '/en/join',
  skipLinkLabel: 'Skip to content',
  mainNavLabel: 'Main navigation',
  menuOpenLabel: 'Open menu',
  menuCloseLabel: 'Close menu',
  themeToLightLabel: 'Switch to light theme',
  themeToDarkLabel: 'Switch to dark theme',
  // Names the target language, written in that language (the toggle link carries lang="de").
  languageToggle: { code: 'DE', label: 'Auf Deutsch wechseln' },
  mobileSocialHeading: 'Follow us',
  menuItems: [
    { label: 'Home', url: '/en/', isExternal: false, order: 1 },
    { label: 'Events', url: '/en/events/', isExternal: false, order: 2 },
    { label: 'News', url: '/en/news/', isExternal: false, order: 3 },
    { label: 'Guide', url: '/en/materials/', isExternal: false, order: 4 },
    { label: 'Community', url: '/en/subscribe', isExternal: false, order: 5 },
  ],
}

export const footer = {
  id: 1,
  description:
    'Startup initiative at Leuphana University Lüneburg. We are the first point of contact for everyone interested in founding',
  showCommunityForm: true,
  navigationHeading: 'Navigation',
  legalHeading: 'Legal',
  socialHeading: 'Social',
  footerNavLabel: 'Footer',
  socialLinks: [
    { platform: 'Instagram', url: 'https://www.instagram.com/ignite.lueneburg/', icon: 'ion:logo-instagram', order: 1 },
    {
      platform: 'LinkedIn',
      url: 'https://www.linkedin.com/company/ignite-leuphana/',
      icon: 'ion:logo-linkedin',
      order: 2,
    },
    { platform: 'GitHub', url: 'https://github.com/IGNITE-StartupClub/IGNITE', icon: 'ion:logo-github', order: 3 },
  ],
  legalLinks: [
    { label: 'Legal notice', url: '/en/imprint', order: 1 },
    { label: 'Privacy policy', url: '/en/privacy', order: 2 },
    { label: 'Contact', url: '/en/contact', order: 3 },
  ],
}

export const globalConfig = {
  id: 1,
  siteName: 'IGNITE Startup Club Lüneburg',
  siteTagline: 'Your founder community at Leuphana',
  contactEmail: 'stud.initiative.ignite@leuphana.de',
  copyrightText: 'IGNITE Startup Club Lüneburg. All rights reserved.',
  error404_heading: '404 - Page not found',
  error404_message: 'The page you are looking for does not exist.',
  error404_buttonText: 'Back to the home page',
  error404_buttonUrl: '/en/',
  loadingText: 'Loading...',
  submitButtonText: 'Submit',
}

export const teamPage = {
  id: 1,
  pageTitle: 'Our team',
  pageDescription:
    '<p>Meet the talented team driving the IGNITE Startup Club Lüneburg forward. Each of us contributes unique skills and a shared vision to support the next generation of entrepreneurs.</p>',
  modalMoreButtonText: 'Read more',
  modalCloseButtonText: 'Close',
  emailIconAlt: 'Send email',
  linkedinIconAlt: 'LinkedIn profile',
}

export const contactPage = {
  id: 1,
  pageTitle: 'Get in touch!',
  pageIntro: 'If you have questions or suggestions, you can reach us at any time through the contact form.',
  formTopicLabel: 'Topic',
  formTopicPlaceholder: 'Please select',
  formFirstNameLabel: 'First name',
  formLastNameLabel: 'Last name',
  formEmailLabel: 'Email',
  formMessageLabel: 'Message',
  formOrganizationLabel: 'Organization/Company',
  formExpertiseLabel: 'Field/Expertise',
  formExpertisePlaceholder: 'Briefly describe your expertise and how you can support the IGNITE team...',
  submitButtonText: 'Submit',
  successMessage: '<h3>Thanks for your message!</h3><p>We will get back to you soon.</p>',
  successMessageAdvisory:
    '<h3>Thank you for your interest!</h3><p>We have received your Advisory Board enquiry and are delighted that you would like to support the IGNITE Startup Club Lüneburg. Our team will contact you shortly to discuss the next steps.</p><p class="contact-info">For urgent questions you can also reach us directly at <a href="mailto:stud.initiative.ignite@leuphana.de">stud.initiative.ignite@leuphana.de</a></p>',
  advisoryInfoMessage:
    'Thank you for your interest in our Advisory Board! To support you as well as we can, please give us some additional information about yourself and your expertise.',
  errorMessage: 'Error sending the message',
}

// `value` is sent to /api/contact and must match the German list; only the labels are translated.
export const contactTopics = [
  { id: 1, value: 'advisory', label: 'Interest in the Advisory Board', requiresAdditionalFields: true, order: 1 },
  { id: 2, value: 'partner', label: 'Become a partner', requiresAdditionalFields: false, order: 2 },
  { id: 3, value: 'mitglied', label: 'Become a member', requiresAdditionalFields: false, order: 3 },
  { id: 4, value: 'workshop', label: 'Host a workshop', requiresAdditionalFields: false, order: 4 },
  { id: 5, value: 'sonstiges', label: 'Other', requiresAdditionalFields: false, order: 5 },
]

export const mitmachenPage = {
  title: 'Entrepreneurial spirit <em>connects</em>',
  lead: 'Become part of the IGNITE Startup Club Lüneburg. We are looking for students who want to help shape events, networks and projects.',
  ctaLabel: 'Apply now',
  teamsHeading: 'Our <em>teams</em>',
  teamCategoryLabels: { intern: 'Internal', extern: 'External' },
  teamsLead: 'These are the teams you can join at IGNITE. We work out together in the introductory conversation which one suits you.',
  formHeading: 'Join <em>us</em> now',
  formLead: 'Apply quickly and easily with this form.',
  processHeading: 'Your path to <em>IGNITE</em>',
  steps: [
    {
      title: 'Submit your application',
      text: 'Fill in the application form on this page and send it off. You will receive a confirmation by email right away.',
    },
    {
      title: 'Introductory conversation',
      text: 'We review your application and invite you to a short introductory conversation with our HR team.',
    },
    {
      title: 'The right team and a first project',
      text: 'Together we find a team that fits your field of study and your interests. There you complete a first project and officially become part of the IGNITE team.',
    },
  ],
}

export const listingPages = {
  news: {
    path: '/en/news',
    crumb: 'News',
    readLabel: 'Read news:',
    paginationLabel: 'News pages',
    backLabel: 'Back to the news',
    title: '<em>What is happening</em> at IGNITE',
    lead: 'Insights into events, encounters and the people who help build our founding culture.',
    empty: 'No news yet.',
    readMore: 'Read on',
  },
  materials: {
    path: '/en/materials',
    crumb: 'Materials',
    readLabel: 'View material:',
    paginationLabel: 'Materials pages',
    backLabel: 'Back to the materials',
    defaultTag: 'Resource',
    defaultAuthor: 'IGNITE Team',
    title: 'Materials for the <em>next step</em>',
    lead: 'Think more clearly, test better, start more boldly: guides and frameworks for your founding journey.',
    empty: 'Soon you will find exciting materials here that make founding more accessible.',
    readMore: 'View',
  },
}

export const eventsPage = {
  title: "Let's <em>get started.</em>",
  lead: 'Workshops, networking and hackathons with the Startup School: find the upcoming events by IGNITE and with IGNITE here.',
  heading: 'Upcoming events',
  empty: 'There are no events at the moment. Follow our Luma calendar to be the first to hear about new dates.',
  unavailable: 'The events from our Luma calendar could not be loaded right now.',
  register: 'Register now',
  soldOut: 'Sold out',
  free: 'Free',
  guests: 'registrations',
  attended: 'attendees',
  pastHeading: 'Past events',
  followCalendar: 'Subscribe to the Luma calendar',
}

export const subscribePage = {
  title: 'Stay in the <em>loop</em>',
  lead: 'Our newsletter runs on WhatsApp. Sign up and we will send you the invitation link to the community.',
  submit: 'Ship the dam thing!',
}

export const communityForm = {
  heading: 'Become part of the community',
  note: 'You will receive an email with the invitation link to the WhatsApp community.',
  emailPlaceholder: 'you@email.com',
  submit: 'Join now',
  submitting: 'Sending...',
  consent: 'By submitting your email address you agree to our privacy policy.',
  success: 'Thanks! We have emailed you the invitation link. Check your spam folder too.',
  pending: 'We have already sent you the link. Please check your inbox, including your spam folder.',
  error: 'Something went wrong. Please try again later.',
}

// Members area behind the magic-link login (/en/members). `form` goes to the MemberLoginForm island.
export const memberArea = {
  pageTitle: 'Members area',
  // Entry point on the Community page.
  teaser: {
    heading: 'For <em>members</em>',
    lead: 'Already on the team? The members area has internal news, documents and dates.',
    link: 'Go to the members area',
  },
  login: {
    title: 'Members <em>area</em>',
    lead: 'Sign in with the email address IGNITE has on file for you. We will send you a link, no password needed.',
    linkInvalid: 'This login link has expired or was already used. Just request a new one.',
    confirmTitle: 'Confirm <em>sign-in</em>',
    confirmLead: 'One more click and you are in the members area.',
    confirm: 'Sign in now',
  },
  form: {
    emailLabel: 'Email address',
    emailPlaceholder: 'you@email.com',
    submit: 'Send login link',
    submitting: 'Sending...',
    sent: 'If your address is enabled for the members area, you will receive an email with the login link shortly. It is valid for 15 minutes. Check your spam folder too.',
    tooMany: 'Too many login links are being requested right now. Please try again in an hour.',
    error: 'Something went wrong. Please try again later.',
  },
  home: {
    title: 'Welcome to the <em>members area</em>',
    lead: 'Soon you will find internal news, documents and dates for IGNITE members here.',
    signedInAs: 'Signed in as',
    logout: 'Sign out',
    signatureLink: 'Create your email signature',
  },
  signature: {
    pageTitle: 'Email signature',
    title: 'Your <em>email signature</em>',
    lead: 'Fill in your details and copy the signature. In Outlook you add it as an extra signature. It then only appears in the emails you insert it into, and your private emails stay without it.',
    back: 'Back to the members area',
    stepsHeading: 'How to add it to Outlook',
    // HTML allowed.
    steps: [
      'Click <strong>Copy signature</strong> above.',
      'Open Outlook on the web or the new Outlook: <strong>Settings → Accounts → Signatures</strong>.',
      '<strong>+ New signature</strong>, name it <em>IGNITE</em>, paste the signature into the text field and save.',
      'Leave the default signatures for new messages and for replies at <strong>(no signature)</strong>. That keeps private emails free of the IGNITE signature.',
      'In an IGNITE email: <strong>Insert → Signature → IGNITE</strong>.',
    ],
    generator: {
      labels: { name: 'Name', role: 'Role at IGNITE', email: 'Email address', phone: 'Phone', photo: 'Photo URL' },
      placeholders: {
        name: 'First Last',
        role: 'e.g. Board, Events',
        email: 'first.last@stud.leuphana.de',
        phone: '+49 …',
        photo: 'https://…',
      },
      hints: { photo: 'A publicly reachable, square image with an https address.' },
      optional: '(optional)',
      sampleMail: ['Hi all,', 'thanks for the conversation today. I will send you the documents by Friday.', 'Best regards'],
      copy: 'Copy signature',
      copyHtml: 'Copy HTML code',
      copied: 'Copied. Now paste it into Outlook.',
      copiedHtml: 'HTML code copied.',
      missing: 'Please fill in name, role and email address.',
      copyFailed: 'Copying did not work. Try another browser.',
      signature: {
        tagline: 'Student initiative for entrepreneurship at Leuphana University Lüneburg',
        namePlaceholder: 'First Last',
        rolePlaceholder: 'Role',
        emailPlaceholder: 'first.last@stud.leuphana.de',
      },
    },
  },
}
