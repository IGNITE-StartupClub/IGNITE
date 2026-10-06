// Static Content - replaces Strapi CMS
// All website content is now hardcoded here for fast, offline-capable static generation

export const features = [
  {
    id: 1,
    icon: 'ion:diamond-outline',
    title: 'Workshops und Events',
    description:
      'Ideen ausprobieren, Erfahrungen teilen und Gründende kennenlernen. In Workshops und Events bringen wir Studierende mit Menschen zusammen, die schon losgelegt haben.',
    link: { label: 'Events entdecken', href: '/events/' },
    order: 1,
    layout: 'wide',
  },
  {
    id: 2,
    icon: 'ion:document-attach-outline',
    title: 'Wissen zum Weiterkommen',
    description: 'Checklisten, Leitfäden und praktische Tools helfen dir, den nächsten Schritt mit deiner Idee zu machen. Unsere Materialien kannst du auch unabhängig von einer Mitgliedschaft nutzen.',
    link: { label: 'Zu den Materialien', href: '/materialien/' },
    order: 3,
    layout: 'half',
  },
  {
    id: 3,
    icon: 'ion:flame-outline',
    title: 'Hackathons mit der Startup School',
    description:
      'Gemeinsam mit der Startup School arbeiten wir an Hackathons mit. Du entwickelst im Team Ideen, baust erste Lösungen und holst dir Feedback.',
    link: { label: 'Zur Events-Seite', href: '/events/' },
    order: 2,
    layout: 'tall',
  },
  {
    id: 5,
    icon: 'ion:people-outline',
    title: 'Eine Community zum Mitgestalten',
    description: 'Triff andere Gründungsinteressierte, tausche dich aus und gestalte IGNITE mit. Ob erste Frage oder konkrete Idee: Du kannst mit deinem eigenen Blickwinkel etwas beitragen.',
    link: { label: 'Mitmachen', href: '/mitmachen' },
    order: 5,
    layout: 'half',
  },
]

export const faqs = [
  {
    id: 1,
    question: 'Was ist IGNITE?',
    answer:
      '<p>IGNITE ist die studentische Gründungsinitiative an der Leuphana. Wir bringen Gründungsinteressierte zusammen, machen Entrepreneurship praktisch erlebbar und helfen dir, aus Neugier erste Schritte zu machen.</p>',
    openByDefault: true,
    order: 1,
  },
  {
    id: 2,
    question: 'Brauche ich schon eine Idee oder Gründungserfahrung?',
    answer:
      '<p>Nein. Neugier reicht für den Anfang. Du kannst mit einer eigenen Idee kommen oder erst herausfinden, welches Thema dich interessiert. Studierende aller Fachrichtungen sind willkommen.</p>',
    openByDefault: false,
    order: 2,
  },
  {
    id: 3,
    question: 'Was kann ich bei IGNITE machen?',
    answer:
      '<p>Du kannst an Workshops und Events teilnehmen, andere Gründungsinteressierte kennenlernen oder im Team Formate und Projekte mitgestalten. An Hackathons arbeiten wir gemeinsam mit der Startup School mit. Aktuelle Informationen findest du auf unserer <a href="/events/">Events-Seite</a>.</p>',
    openByDefault: false,
    order: 3,
  },
  {
    id: 4,
    question: 'Wie läuft der Bewerbungs- und Onboarding-Prozess ab?',
    answer:
      '<p>Über <a href="/mitmachen">Mitmachen</a> kannst du dich für unser Team melden. Im anschließenden Kennenlerngespräch besprechen wir deine Interessen und wo du dich einbringen möchtest. Für Veranstaltungen gelten die jeweiligen Teilnahmeinformationen.</p>',
    openByDefault: false,
    order: 4,
  },
  {
    id: 5,
    question: 'Wie viel Zeit sollte ich fürs Team mitbringen?',
    answer:
      '<p>Das hängt von deiner Rolle und den laufenden Projekten ab. Wir besprechen im Kennenlerngespräch, was zu deinem Studium passt. Wichtig sind verlässliche Absprachen und Freude daran, gemeinsam etwas umzusetzen.</p>',
    openByDefault: false,
    order: 5,
  },
  {
    id: 6,
    question: 'Kann man IGNITE sponsoren?',
    answer:
      '<p>Ja. Du kannst uns mit Expertise, Räumen, Kontakten oder finanziell bei Veranstaltungen und Projekten unterstützen. Schreib uns über das <a href="/kontakt">Kontaktformular</a>, wenn du mit IGNITE zusammenarbeiten möchtest.</p>',
    openByDefault: false,
    order: 6,
  },
]

export const homepage = {
  id: 1,
  heroTitle: 'Dein <em>Gründungsfunke</em> an der Leuphana.',
  heroSubtitle: 'Wir bringen Gründungsinteressierte zusammen und machen aus Neugier erste Schritte – mit Workshops, Events und einer Community, die du mitgestalten kannst.',
  // Hero image: swap the motif here. `src` is a file name in src/assets/photos (optimized) or a public URL.
  heroImage: {
    src: 'kickoff.jpg',
    alt: 'Gruppenfoto vom Kick-off-Event von IGNITE im Utopia: rund 35 Studierende vor der Projektion des IGNITE-Logos.',
  },
  heroCTA_Text: 'Mitmachen',
  heroCTA_URL: '/mitmachen',
  heroCTA_Icon: 'ion:people-outline',
  whyHeading: 'Gute Ideen beginnen mit <em>Menschen</em>, die loslegen.',
  whyParagraphs: [
    'IGNITE ist die studentische Gründungsinitiative an der Leuphana. Wir schaffen Gelegenheiten, Menschen kennenzulernen, Fragen zu stellen und gemeinsam Ideen auszuprobieren.',
    'Unser Ziel: <em>Gründen zugänglich machen</em>. Für alle Fachrichtungen und für alle, die etwas bewegen möchten – auch ohne fertige Geschäftsidee.',
  ],
  audienceHeading: '<em>Für wen</em> das ist',
  audienceLines: [
    'Für Studierende der Leuphana, die sich für Gründung interessieren.',
    'Für alle mit eigener Idee und für alle, die noch auf der Suche nach einer sind.',
    'Für alle, die gemeinsam in einem Team etwas aufbauen wollen.',
  ],
  featuresHeading: 'Was wir <em>machen</em>',
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
  newsLead: 'Einblicke und Rückblicke aus dem IGNITE-Alltag.',
  newsReadMore: 'Mehr lesen!',
  newsAuthorLabel: 'Von',
  newsCTA_Text: 'Alle Neuigkeiten',
  newsCTA_URL: '/news/',
  newsImageAltPrefix: 'Titelbild zu',
  faqHeading: '<em>Fragen?</em>',
  faqCTA_Text: 'Nimm Kontakt auf',
  faqCTA_URL: '/kontakt',
  finalHeading: 'Werde <em>Teil</em> von IGNITE',
  finalText: 'Bring deine Neugier, deine Ideen und deinen Blickwinkel mit. Gestalte mit uns die Gründungskultur an der Leuphana.',
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
    { label: 'Startseite', url: '/', isExternal: false, order: 1 },
    { label: 'Events', url: '/events/', isExternal: false, order: 2 },
    { label: 'Neuigkeiten', url: '/news/', isExternal: false, order: 3 },
    { label: 'Materialien', url: '/materialien/', isExternal: false, order: 4 },
    { label: 'Newsletter', url: '/subscribe', isExternal: false, order: 5 },
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
