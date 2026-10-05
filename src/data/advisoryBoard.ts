// Advisory Board der Startseite (Texte aus den öffentlichen Profilen). Reihenfolge = Anzeigereihenfolge.

export interface AdvisoryMember {
  name: string
  title: string // Position
  department: string
  boardRole: string
  bio: string
  image?: string
  linkedin?: string
}

export const advisoryMembers: AdvisoryMember[] = [
  {
    name: 'Prof. Dr. Markus Reihlen',
    title: 'Professor für Strategisches Management & Entrepreneurship',
    department: 'Vizepräsident Entrepreneurship, Transfer & Internationalisierung',
    boardRole: 'Schirmherrschaft',
    bio: 'Prof. Reihlen forscht zu Corporate und Digital Entrepreneurship, Strategischem Management sowie Organisationstheorie. Er war Gastprofessor an der Universität St. Gallen und der University of Wisconsin-Milwaukee. Mit acht Best Paper Awards der Academy of Management und zehn Büchern als Autor/Herausgeber gehört er zu den führenden Experten seines Fachgebiets.',
    image: 'https://www.leuphana.de/fileadmin/_processed_/6/5/csm_reihlen_markus__795-70697.690x690px.WEB_944517a3d2.jpg',
    linkedin: 'https://www.linkedin.com/in/markus-reihlen-10594940/',
  },
  {
    name: 'Prof. Dr. Burkhardt Funk',
    title: 'Professor für Wirtschaftsinformatik und Data Science',
    department: 'Leuphana Universität Lüneburg',
    boardRole: 'Advisory Board Member',
    bio: 'Prof. Funk forscht zu datengetriebenen Services und maschinellem Lernen in E-Commerce und E-Health. Er initiierte 2015 einen der ersten Data-Science-Studiengänge Deutschlands und leitet die DATAx-Initiative zur Data Literacy. Als Gastwissenschaftler an Stanford und der University of Virginia verbindet er Forschung mit Gründungserfahrung bei HelloBetter, Adference und Smartboatia.',
    image: '/img/advisory/burkhardt_funk_zg.jpg',
    linkedin: 'https://www.linkedin.com/in/burkhardt-funk-779361126/',
  },
  {
    name: 'Prof. Dr. Elke Schüßler',
    title: 'Professorin für Betriebswirtschaftslehre, insbesondere Entrepreneurship und Organisation',
    department: 'Leuphana Universität Lüneburg',
    boardRole: 'Advisory Board Member',
    bio: 'Prof. Schüßler erforscht die Dynamiken organisationalen Wandels mit Fokus auf nachhaltige Organisations- und Arbeitsformen. Zuvor war sie Professorin an der Johannes Kepler Universität Linz und Juniorprofessorin an der FU Berlin. Sie erhielt u.a. den Academy of Management Journal Best Article Award und ist Associate Editor bei Business & Society sowie im Executive Board von EGOS.',
    image: 'https://www.leuphana.de/fileadmin/_processed_/9/1/csm_schuessler_elke_795-81159.690x690px.WEB_cee730c75f.jpg',
    linkedin: 'https://www.linkedin.com/in/elke-schuessler-01a488a/',
  },
  {
    name: 'Prof. Dr. Matthias Wenzel',
    title: 'Professor für Organisation',
    department: 'Leuphana Universität Lüneburg',
    boardRole: 'Advisory Board Member',
    bio: 'Prof. Wenzel erforscht das Zusammenspiel von Organisation und Strategie aus praxistheoretischer Perspektive sowie dessen gesellschaftliche Implikationen. Seine Arbeiten erscheinen in renommierten Journals wie dem Academy of Management Journal und Strategic Management Journal. Ab 2025 ist er Senior Editor für Organization Studies und Co-Herausgeber für Media Innovations beim Strategic Management Journal.',
    image: 'https://www.leuphana.de/fileadmin/_processed_/c/0/csm_wenzel_matthias_87f76fcb0c.jpg',
  },
  {
    name: 'Dr. Markus Lemmens',
    title: 'Chief Communication Officer der Leuphana Universität',
    department: 'Leuphana Universität Lüneburg',
    boardRole: 'Advisory Board Member',
    bio: 'Dr. Markus Lemmens hat mehrfache Gründungserfahrung seit 1996 (Medien, Public Affairs, Fusionsenergie und IT). Er arbeitet im Wissenschaftsmanagement. Sein Fokus ist u.a. Deep Technology als Brücke zwischen Forschung und Mittelstand. Aktuell ist er Chief Communication Officer der Leuphana Universität Lüneburg.',
    image: '/img/advisory/markus_lemmens.JPG',
    linkedin: 'https://www.linkedin.com/in/dr-markus-lemmens-265a5099/',
  },
]
