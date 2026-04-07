// Static Content - replaces Strapi CMS
// All website content is now hardcoded here for fast, offline-capable static generation

export const features = [
  {
    id: 1,
    icon: 'ion:diamond-outline',
    title: 'Workshops & Events',
    description:
      'Wir lernen gemeinsam von Expert:innen & Peer-to-Peer über Startups und Entrepreneurship.\n\n<p class="text-neutral-500 my-3">Du willst einen Workshop im Rahmen unserer Initiative geben?</p>\n<a class="button secondary" href="/kontakt">Jetzt kontaktieren!</a>',
    order: 1,
  },
  {
    id: 2,
    icon: 'ion:document-attach-outline',
    title: 'Fact-Sheet',
    description: 'Wir analysieren die Angebote zum Thema Entrepreneurship an der Leuphana Universität.',
    order: 2,
  },
  {
    id: 3,
    icon: 'ion:flame-outline',
    title: 'Hackathon',
    description:
      'Wir veranstalten einen Hackathon, um innovative Ideen zu entwickeln und zu testen. Wir organisieren 2-3 tägige Events, um in kurzer Zeit Startup Ideen auszuarbeiten.',
    order: 3,
  },
  {
    id: 4,
    icon: 'ion:mic-outline',
    title: 'IGNITE Podcast',
    description: 'Im Utopia interviewen wir Startup Gründende und Leuphana Alumni.',
    order: 4,
  },
  {
    id: 5,
    icon: 'ion:people-outline',
    title: 'Community',
    description: 'Wir verbinden Studierende, Alumni und Gründende mit dem Ziel, ein starkes Netzwerk aufzubauen.',
    order: 5,
  },
  {
    id: 6,
    icon: 'ion:cash-outline',
    title: 'IGNITE Stipendium',
    description:
      'Wir möchten in Zukunft angehendenden Gründenden einen Co-Working Platz und Förderung im Utopia ermöglichen.\n\n<p class="text-neutral-500 my-3">Dafür suchen wir Partner:innen, die uns unterstützen.</p>\n<a class="button secondary" href="/kontakt">Partner werden</a>',
    order: 6,
  },
]

export const faqs = [
  {
    id: 1,
    question: 'Was ist IGNITE?',
    answer:
      '<p>Wir sind eine studentische Initiative an der Leuphana Universität Lüneburg, die sich leidenschaftlich für Entrepreneurship und Startup-Kultur einsetzt. Unser Ziel ist es, Gründungsgeist zu fördern, Studierende zu vernetzen und praxisnahe Erfahrungen im Bereich Unternehmensgründung zu ermöglichen.</p>',
    openByDefault: true,
    order: 1,
  },
  {
    id: 2,
    question: 'Welche Erwartungen stellen wir an die Mitglieder?',
    answer:
      '<p>Der durchschnittliche Aufwand liegt bei etwa 3–5 Stunden pro Woche – je nach Projektphase etwas mehr oder weniger. Wir erwarten regelmäßige Teilnahme an Team-Meetings, aktive Projektarbeit und proaktive Kommunikation.</p>',
    openByDefault: false,
    order: 2,
  },
  {
    id: 3,
    question: 'Wie profitiere ich von meinem Ehrenamt?',
    answer:
      '<p>Du erhältst exklusiven Zugang zu Unternehmen, Gründer:innen, Investor:innen und Alumni, nimmst an praxisorientierten Workshops teil und erhältst individuelles Feedback in Mentoring-Sessions.</p>',
    openByDefault: false,
    order: 3,
  },
  {
    id: 4,
    question: 'Wie läuft der Bewerbungs- und Onboarding-Prozess ab?',
    answer:
      '<p>Du füllst das Online-Formular auf unserer Website aus, bekommst eine Rückmeldung per E-Mail mit Einladung zum persönlichen Gespräch und startest nach positiver Entscheidung mit einem strukturierten Onboarding.</p>',
    openByDefault: false,
    order: 4,
  },
  {
    id: 5,
    question: 'Welche Rollen und Gremien gibt es innerhalb der Initiative?',
    answer:
      '<p>Wir arbeiten in projektbezogenen Teams, die sich um verschiedene Themen kümmern, wie z.B. Workshops, Events, Podcast, Community-Building. Jedes Team hat eine:n Teamleiter:in, die/der für die Koordination verantwortlich ist.</p>',
    openByDefault: false,
    order: 5,
  },
  {
    id: 6,
    question: 'Kann man IGNITE sponsoren?',
    answer:
      '<p>Ja, wir suchen aktiv nach Sponsoren, die uns bei der Umsetzung unserer Projekte unterstützen. Wenn du Interesse hast, kontaktiere uns gerne über das <a href="/kontakt">Kontaktformular</a></p>',
    openByDefault: false,
    order: 6,
  },
]

export const homepage = {
  id: 1,
  heroTitle: 'IGNITE',
  heroSubtitle:
    'Dein <span class="bg-gradient-to-br from-[var(--primary-300)] via-[var(--secondary-200)] to-[var(--primary-400)] bg-clip-text text-transparent drop-shadow-lg">Gründungsfunken</span> an der Leuphana Universität',
  heroDescription: 'Gründer*innen-Community für ambitionierte Studierende der Leuphana',
  heroCTA_Text: 'Mitmachen',
  heroCTA_URL: '/mitmachen',
  heroCTA_Icon: 'ion:people-outline',
  heroBackgroundColors: ['#5227FF', '#FF9FFC', '#B19EEF'],
  featuresHeading: 'Was wir machen',
  featuresSubheading: '',
  faqHeading: 'FAQ',
  faqDescription: 'Häufig gestellte Fragen zu IGNITE.',
  faqCTA_Text: 'Nimm Kontakt auf!',
  faqCTA_URL: '/kontakt',
  showAdvisoryBoard: true,
  showNews: true,
  newsHeading: 'Neuigkeiten',
}

export const navigation = {
  id: 1,
  logo: null,
  logoText: 'IGNITE',
  menuItems: [
    { label: 'Startseite', url: '/', isExternal: false, order: 1 },
    { label: 'Neuigkeiten', url: '/news/', isExternal: false, order: 2 },
    // { label: 'Über uns', url: '/about', isExternal: false, order: 2 },
    {
      label: 'Events',
      url: '#',
      isExternal: false,
      order: 4,
      children: [
        { label: 'IGNITE Workshops', url: '/IGNITEWorkshops/', isExternal: false, order: 1 },
        { label: 'Peer-to-Peer Workshops', url: '/peer-to-peer', isExternal: false, order: 2 },
      ],
    },
    { label: 'Newsletter', url: '/subscribe', isExternal: false, order: 5 },
  ],
}

export const footer = {
  id: 1,
  description:
    'Startup Initiative an der Leuphana Universität Lüneburg. Wir sind die Anlaufstelle für alle Gründungsinteressierten',
  showNewsletter: true,
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
    { label: 'Impressum', url: '/impressum', order: 1 },
    { label: 'Datenschutz', url: '/datenschutz', order: 2 },
    { label: 'Kontakt', url: '/kontakt', order: 3 },
  ],
}

export const globalConfig = {
  id: 1,
  siteName: 'IGNITE Startup Club Lüneburg',
  siteTagline: 'Deine Gründer*innen-Community an der Leuphana',
  contactEmail: 'info@ignite-startupclub.de',
  copyrightText: 'IGNITE Startup Club Lüneburg. Alle Rechte vorbehalten.',
  error404_heading: '404 - Seite nicht gefunden',
  error404_message: 'Die Seite, die du suchst, existiert nicht.',
  error404_buttonText: 'Zurück zur Startseite',
  error404_buttonUrl: '/',
  newsletterSuccessMessage: 'Danke für deine Anmeldung!',
  newsletterErrorMessage: 'Ein Fehler ist aufgetreten',
  loadingText: 'Lädt...',
  submitButtonText: 'Absenden',
}

export const teamPage = {
  id: 1,
  pageTitle: 'Unser Team',
  pageDescription:
    '<p>Lerne das talentierte Team kennen, das den IGNITE Startup Club Lüneburg vorantreibt. Jeder von uns trägt mit einzigartigen Fähigkeiten und einer gemeinsamen Vision bei, um die nächste Generation von Unternehmern zu unterstützen.</p>',
  modalMoreButtonText: 'Mehr lesen',
  modalCloseButtonText: 'Schließen',
  emailIconAlt: 'E-Mail senden',
  linkedinIconAlt: 'LinkedIn-Profil',
}

export const contactPage = {
  id: 1,
  pageTitle: "Schreib' uns!",
  pageIntro: 'Bei Fragen oder Anregungen kannst du uns jederzeit über das Kontaktformular erreichen.',
  formTopicLabel: 'Anliegen',
  formTopicPlaceholder: 'Bitte wählen',
  formFirstNameLabel: 'Vorname',
  formLastNameLabel: 'Nachname',
  formEmailLabel: 'E-Mail',
  formMessageLabel: 'Nachricht',
  formOrganizationLabel: 'Organisation/Unternehmen',
  formExpertiseLabel: 'Fachgebiet/Expertise',
  formExpertisePlaceholder: 'Beschreiben Sie kurz Ihre Expertise und wie Sie das IGNITE Team unterstützen können...',
  submitButtonText: 'Absenden',
  successMessage: '<h3>Danke für deine Nachricht!</h3><p>Wir werden uns bald bei dir melden.</p>',
  successMessageAdvisory:
    '<h3>Vielen Dank für Ihr Interesse!</h3><p>Wir haben Ihre Anfrage zum Advisory Board erhalten und freuen uns sehr über Ihr Interesse, den IGNITE Startup Club Lüneburg zu unterstützen. Unser Team wird sich zeitnah bei Ihnen melden, um die nächsten Schritte zu besprechen.</p><p class="contact-info">Bei dringenden Fragen erreichen Sie uns auch direkt unter <a href="mailto:info@ignite-startupclub.de">info@ignite-startupclub.de</a></p>',
  advisoryInfoMessage:
    'Vielen Dank für Ihr Interesse an unserem Advisory Board! Um Sie optimal unterstützen zu können, bitten wir Sie um einige zusätzliche Informationen zu Ihrer Person und Expertise.',
  errorMessage: 'Fehler beim Absenden der Nachricht',
}

export const contactTopics = [
  { id: 1, value: 'advisory', label: 'Advisory Board Interesse', requiresAdditionalFields: true, order: 1 },
  { id: 2, value: 'partner', label: 'Partner werden', requiresAdditionalFields: false, order: 2 },
  { id: 3, value: 'mitglied', label: 'Mitglied werden', requiresAdditionalFields: false, order: 3 },
  { id: 4, value: 'workshop', label: 'Workshop veranstalten', requiresAdditionalFields: false, order: 4 },
  { id: 5, value: 'sonstiges', label: 'Sonstiges', requiresAdditionalFields: false, order: 5 },
]
