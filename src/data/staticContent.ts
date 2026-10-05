// Static Content - replaces Strapi CMS
// All website content is now hardcoded here for fast, offline-capable static generation

export const features = [
  {
    id: 1,
    icon: 'ion:diamond-outline',
    title: 'Workshops und Events',
    description:
      'Wir lernen gemeinsam von Expert:innen und Peer-to-Peer über Startups und Entrepreneurship. Du willst selbst einen Workshop im Rahmen unserer Initiative geben?',
    link: { label: 'Jetzt kontaktieren', href: '/kontakt' },
    order: 1,
    layout: 'wide',
  },
  {
    id: 2,
    icon: 'ion:document-attach-outline',
    title: 'Ein Fact-Sheet zur Orientierung',
    description: 'Wir analysieren die Angebote zum Thema Entrepreneurship an der Leuphana Universität.',
    link: { label: 'Zu den Materialien', href: '/materialien/' },
    order: 3,
    layout: 'half',
  },
  {
    id: 3,
    icon: 'ion:flame-outline',
    title: 'Der Hackathon',
    description:
      'Wir veranstalten einen Hackathon, um innovative Ideen zu entwickeln und zu testen. In zwei bis drei Tagen arbeiten wir Startup-Ideen aus.',
    order: 2,
    layout: 'tall',
  },
  {
    id: 4,
    icon: 'ion:mic-outline',
    title: 'Der IGNITE Podcast',
    description: 'Im Utopia interviewen wir Startup-Gründende und Leuphana-Alumni.',
    order: 4,
    layout: 'half',
  },
  {
    id: 5,
    icon: 'ion:people-outline',
    title: 'Eine Community',
    description: 'Wir verbinden Studierende, Alumni und Gründende mit dem Ziel, ein starkes Netzwerk aufzubauen.',
    link: { label: 'Mitmachen', href: '/mitmachen' },
    order: 5,
    layout: 'third',
  },
  {
    id: 6,
    icon: 'ion:cash-outline',
    title: 'Das IGNITE Stipendium',
    description:
      'In Zukunft möchten wir angehenden Gründenden einen Co-Working-Platz und Förderung im Utopia ermöglichen. Dafür suchen wir Partner:innen, die uns unterstützen.',
    link: { label: 'Partner werden', href: '/kontakt' },
    order: 6,
    layout: 'third',
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
      '<p>Der durchschnittliche Aufwand liegt bei etwa 3 bis 5 Stunden pro Woche, je nach Projektphase etwas mehr oder weniger. Wir erwarten regelmäßige Teilnahme an Team-Meetings, aktive Projektarbeit und proaktive Kommunikation.</p>',
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
  heroTitle: 'Dein <em>Gründungsfunke</em> an der Leuphana.',
  heroSubtitle: 'Die Gründer*innen-Community für Studierende der Leuphana.',
  heroKpiLabel: 'IGNITE in Zahlen',
  // Hero image: swap the motif here. `src` is a file name in src/assets/photos (optimized) or a public URL.
  heroImage: {
    src: 'kickoff.jpg',
    alt: 'Gruppenfoto vom Kick-off-Event von IGNITE im Utopia: rund 35 Studierende vor der Projektion des IGNITE-Logos.',
  },
  heroCTA_Text: 'Mitmachen',
  heroCTA_URL: '/mitmachen',
  heroCTA_Icon: 'ion:people-outline',
  whyHeading: 'IGNITE existiert, um <em>Gründungsgeist</em> an der Leuphana zu entfachen',
  whyParagraphs: [
    'Wir sind eine studentische Initiative an der Leuphana Universität Lüneburg, die sich für Entrepreneurship und Startup-Kultur einsetzt.',
    'Wir bieten dir <em>Workshops, Netzwerk und ein Team</em>, mit dem du Ideen testest und praxisnahe Erfahrungen rund um Unternehmensgründung sammelst.',
    'Wir wollen die Anlaufstelle für alle Gründungsinteressierten sein, aus allen Fachrichtungen.',
  ],
  audienceHeading: '<em>Für wen</em> das ist',
  audienceLines: [
    'Für Studierende der Leuphana, die sich für Gründung interessieren.',
    'Für alle mit eigener Idee und für alle, die noch auf der Suche nach einer sind.',
    'Für alle, die gemeinsam in einem Team etwas aufbauen wollen.',
  ],
  featuresHeading: 'Was dich <em>erwartet</em>',
  featuresPhotoAlt: 'Student Startup Guide Event: Publikum und Podium in einem Raum der Leuphana.',
  advisoryHeading: 'Unser <em>Advisory Board</em>',
  advisoryPhotoAltPrefix: 'Porträt von',
  advisoryMoreLabel: 'Mehr lesen',
  advisoryLessLabel: 'Weniger',
  advisoryLinkedinText: 'LinkedIn',
  advisoryLinkedinLabel: 'LinkedIn-Profil von',
  advisoryJoinTitle: 'Werde Teil unseres Boards',
  advisoryJoinRole: 'Advisory Board Member',
  advisoryJoinHint: 'Deine Expertise ist gesucht.',
  advisoryJoinCTA_Text: 'Interesse melden',
  advisoryJoinCTA_URL: '/kontakt?intent=advisory',
  newsHeading: 'News aus unserer Community',
  newsLead: 'Erfahre mehr und bleibe auf dem Laufenden.',
  newsReadMore: 'Mehr lesen!',
  newsAuthorLabel: 'Von',
  newsCTA_Text: 'Alle Neuigkeiten',
  newsCTA_URL: '/news/',
  newsImageAltPrefix: 'Titelbild zu',
  faqHeading: '<em>Fragen?</em>',
  faqCTA_Text: 'Nimm Kontakt auf',
  faqCTA_URL: '/kontakt',
  finalHeading: 'Werde <em>Teil</em> von IGNITE',
  finalText: 'Bewirb dich als Mitglied und baue mit uns die Gründungskultur an der Leuphana auf.',
  finalCTA_Text: 'Mitmachen',
  finalCTA_URL: '/mitmachen',
}

export const navigation = {
  id: 1,
  logo: null,
  logoText: 'IGNITE',
  ctaLabel: 'Mitmachen',
  ctaUrl: '/mitmachen',
  skipLinkLabel: 'Zum Inhalt springen',
  mainNavLabel: 'Hauptnavigation',
  menuOpenLabel: 'Menü öffnen',
  menuCloseLabel: 'Menü schließen',
  themeToLightLabel: 'Zum hellen Design wechseln',
  themeToDarkLabel: 'Zum dunklen Design wechseln',
  mobileSocialHeading: 'Folge uns',
  menuItems: [
    { label: 'Neuigkeiten', url: '/news/', isExternal: false, order: 1 },
    {
      label: 'Events',
      url: '#',
      isExternal: false,
      order: 2,
      children: [
        { label: 'IGNITE Workshops', url: '/IGNITEWorkshops/', isExternal: false, order: 1 },
        { label: 'Peer-to-Peer Workshops', url: '/peer-to-peer', isExternal: false, order: 2 },
      ],
    },
    { label: 'Materialien', url: '/materialien/', isExternal: false, order: 3 },
    { label: 'Newsletter', url: '/subscribe', isExternal: false, order: 4 },
  ],
}

export const footer = {
  id: 1,
  description:
    'Startup Initiative an der Leuphana Universität Lüneburg. Wir sind die Anlaufstelle für alle Gründungsinteressierten',
  showNewsletter: true,
  navigationHeading: 'Navigation',
  legalHeading: 'Rechtliches',
  socialHeading: 'Social',
  footerNavLabel: 'Fußbereich',
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

export const mitmachenPage = {
  title: 'Entrepreneurship-Spirit <em>verbindet</em>',
  lead: 'Werde Teil des IGNITE Startup Club Lüneburg. Wir suchen Studierende, die Lust haben, Events, Netzwerke und Projekte mitzugestalten.',
  ctaLabel: 'Jetzt bewerben',
  teamsHeading: 'Unsere <em>Teams</em>',
  teamsLead: 'Du wählst zwei bis drei Teams, in denen du dir vorstellen kannst mitzuarbeiten.',
  formHeading: 'Jetzt <em>mitmachen</em>',
  formLead: 'Bewirb dich schnell und unkompliziert mit diesem Formular.',
  processHeading: 'Wie geht es <em>weiter</em>?',
  processLead: 'So wirst du Teil von IGNITE.',
  steps: [
    { title: 'Formular ausfüllen', text: 'Fülle unser Formular aus und erzähle uns von dir und deinen Interessen.' },
    { title: 'Bestätigungsmail', text: 'Du erhältst eine Bestätigungsmail von uns, dass deine Anfrage bei uns eingegangen ist.' },
    { title: 'Auswertung', text: 'Wir lesen uns deine Anfrage durch und laden dich zu einem kurzen Info-Gespräch ein.' },
    { title: 'Info-Gespräch', text: 'Das Info-Gespräch führt unser People-Team mit dir. Dabei lernen wir uns gegenseitig kennen.' },
    { title: 'Team-Matching', text: 'Nach dem Info-Gespräch entscheidet das People-Team, in welchem deiner gewählten Teams du gerade am besten unterstützen kannst.' },
  ],
}

export const listingPages = {
  news: {
    title: '<em>Was passiert</em> bei IGNITE',
    lead: 'Einblicke in Events, Begegnungen und die Menschen, die unsere Gründungskultur mitbauen.',
    empty: 'Noch keine Neuigkeiten vorhanden.',
    readMore: 'Weiterlesen',
  },
  materials: {
    title: 'Materialien für den <em>nächsten Schritt</em>',
    lead: 'Klarer denken, besser testen, mutiger loslegen: Guides und Frameworks für deinen Gründerweg.',
    empty: 'Noch keine Materialien vorhanden.',
    readMore: 'Ansehen',
  },
}

export const subscribePage = {
  title: 'Bleib auf dem <em>Laufenden</em>',
  lead: 'Erhalte Updates zu Events, Workshops und Neuigkeiten aus der Startup-Szene in Lüneburg.',
}
