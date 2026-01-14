import { useState } from 'react'

const advisoryMembers = [
  {
    id: 1,
    name: 'Prof. Dr. Markus Reihlen',
    title: 'Professor für Strategisches Management & Entrepreneurship',
    department: 'Vizepräsident Entrepreneurship, Transfer & Internationalisierung',
    boardRole: 'Schirmherrschaft',
    bio: 'Prof. Reihlen forscht zu Corporate und Digital Entrepreneurship, Strategischem Management sowie Organisationstheorie. Er war Gastprofessor an der Universität St. Gallen und der University of Wisconsin-Milwaukee. Mit acht Best Paper Awards der Academy of Management und zehn Büchern als Autor/Herausgeber gehört er zu den führenden Experten seines Fachgebiets.',
    linkedin: 'https://www.linkedin.com/in/markus-reihlen-10594940/',
    image:
      'https://www.leuphana.de/fileadmin/_processed_/6/5/csm_reihlen_markus__795-70697.690x690px.WEB_944517a3d2.jpg',
    initials: 'MR',
  },
   {
  id: 2,
  name: 'Prof. Dr. Burkhardt Funk',
  title: 'Professor für Wirtschaftsinformatik und Data Science',
  department: 'Leuphana Universität Lüneburg',
  boardRole: 'Advisory Board Member',
  bio: 'Prof. Funk forscht zu datengetriebenen Services und maschinellem Lernen in E-Commerce und E-Health. Er initiierte 2015 einen der ersten Data-Science-Studiengänge Deutschlands und leitet die DATAx-Initiative zur Data Literacy. Als Gastwissenschaftler an Stanford und der University of Virginia verbindet er Forschung mit Gründungserfahrung bei HelloBetter, Adference und Smartboatia.',
  linkedin: 'https://www.linkedin.com/in/burkhardt-funk-779361126/?originalSubdomain=de',
  image: '/img/advisory/burkhardt_funk_zg.jpg',
  initials: 'BF',
},
   {
  id: 3,
  name: 'Prof. Dr. Elke Schüßler',
  title: 'Professorin für Betriebswirtschaftslehre, insbesondere Entrepreneurship und Organisation',
  department: 'Leuphana Universität Lüneburg',
  boardRole: 'Advisory Board Member',
  bio: 'Prof. Schüßler erforscht die Dynamiken organisationalen Wandels mit Fokus auf nachhaltige Organisations- und Arbeitsformen. Zuvor war sie Professorin an der Johannes Kepler Universität Linz und Juniorprofessorin an der FU Berlin. Sie erhielt u.a. den Academy of Management Journal Best Article Award und ist Associate Editor bei Business & Society sowie im Executive Board von EGOS.',
  linkedin: 'https://www.linkedin.com/in/elke-schuessler-01a488a/?originalSubdomain=de',
  image: 'https://www.leuphana.de/fileadmin/_processed_/9/1/csm_schuessler_elke_795-81159.690x690px.WEB_cee730c75f.jpg',
  initials: 'ES',
},
{  
  id: 4,
  name: 'Prof. Dr. Matthias Wenzel',
  title: 'Professor für Organisation',
  department: 'Leuphana Universität Lüneburg',
  boardRole: 'Advisory Board Member',
  bio: 'Prof. Wenzel erforscht das Zusammenspiel von Organisation und Strategie aus praxistheoretischer Perspektive sowie dessen gesellschaftliche Implikationen. Seine Arbeiten erscheinen in renommierten Journals wie dem Academy of Management Journal und Strategic Management Journal. Ab 2025 ist er Senior Editor für Organization Studies und Co-Herausgeber für Media Innovations beim Strategic Management Journal.',
  linkedin: '', // Keine LinkedIn-Informationen auf der Website verfügbar
  image: 'https://www.leuphana.de/fileadmin/_processed_/c/0/csm_wenzel_matthias_87f76fcb0c.jpg', // Kein Bild auf der Website verfügbar
  initials: 'MW',
},
{  
  id: 5,
  name: 'Dr. Markus Lemmens',
  title: 'Chief Communication Officer der Leuphana Universität',
  department: 'Leuphana Universität Lüneburg',
  boardRole: 'Advisory Board Member',
  bio: 'Dr. Markus Lemmens hat mehrfache Gründungserfahrung seit 1996 (Medien, Public Affairs, Fusionsenergie und IT). Er arbeitet im Wissenschaftsmanagement. Sein Fokus ist u.a. Deep Technology als Brücke zwischen Forschung und Mittelstand. Aktuell ist er Chief Communication Officer der Leuphana Universität Lüneburg.',
  linkedin: 'https://www.linkedin.com/in/dr-markus-lemmens-265a5099/', // Keine LinkedIn-Informationen auf der Website verfügbar
  image: '/img/advisory/markus_lemmens.JPG', // Kein Bild auf der Website verfügbar
  initials: 'ML',
}
]

function AdvisoryMemberCard({ member }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleExpandClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    setIsExpanded((prev) => !prev)
  }

  return (
    <div
      className="hover:bg-white/8 hover:border-[var(--primary-500)]/30 hover:shadow-[var(--primary-500)]/20 group relative flex h-full w-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-3xl transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl md:p-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Profile Image */}
      <div className="relative mx-auto mb-6 h-28 w-28 md:h-32 md:w-32">
        <div className="h-full w-full rounded-full bg-gradient-to-br from-[var(--primary-300)] via-[var(--secondary-200)] to-[var(--primary-400)] p-1 transition-all duration-300 group-hover:scale-105">
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gray-900/90">
            {/* Conditional: Real image or initials */}
            {member.image ? (
              member.linkedin ? (
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="h-full w-full">
                  <img src={member.image} alt={member.name} className="h-full w-full rounded-full object-cover" />
                </a>
              ) : (
                <img src={member.image} alt={member.name} className="h-full w-full rounded-full object-cover" />
              )
            ) : (
              <div className="bg-gradient-to-br from-[var(--primary-300)] to-[var(--secondary-200)] bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
                {member.initials ||
                  member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
              </div>
            )}

            {/* Hover overlay - only show if LinkedIn is available */}
            {member.linkedin && (
              <div
                className={`bg-[var(--primary-500)]/90 pointer-events-none absolute inset-1 flex items-center justify-center rounded-full transition-all duration-300 ${isHovered ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
              >
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white/30"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Member Info */}
      <div className="flex flex-1 flex-col space-y-2">
        <h3 className="text-lg font-bold leading-tight text-white md:text-xl">{member.name}</h3>
        <p className="text-sm font-semibold leading-relaxed text-white/90 md:text-base">{member.title}</p>
        {member.boardRole && (
          <p className="text-sm font-bold leading-relaxed text-[var(--secondary-200)]">{member.boardRole}</p>
        )}

        {/* Expandable Bio */}
        {member.bio && (
          <div className="mt-auto pt-3">
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <p className="pb-3 text-xs leading-relaxed text-white/70 md:text-sm">
                {member.bio}
              </p>
            </div>
            <button
              type="button"
              onClick={handleExpandClick}
              className="relative z-50 inline-flex cursor-pointer items-center gap-1 border-none bg-transparent text-xs font-medium text-[var(--secondary-200)] outline-none transition-colors duration-200 hover:text-[var(--secondary-100)] focus:outline-none focus:ring-0 md:text-sm [&>*]:pointer-events-auto"
            >
              <span className="pointer-events-auto">{isExpanded ? 'Weniger' : 'Mehr lesen'}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`pointer-events-auto transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AddMemberCard() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="hover:bg-white/8 hover:border-[var(--primary-500)]/40 hover:shadow-[var(--primary-500)]/20 group relative h-full w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center backdrop-blur-3xl transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl md:p-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Plus Icon */}
      <div className="relative mx-auto mb-6 h-28 w-28 md:h-32 md:w-32">
        <div className="group-hover:border-[var(--primary-300)]/50 flex h-full w-full items-center justify-center rounded-full border-2 border-dashed border-white/30 transition-all duration-300 group-hover:scale-105">
          <div
            className={`flex items-center justify-center text-6xl font-light leading-none text-white/40 transition-all duration-300 group-hover:text-[var(--secondary-200)] md:text-7xl ${isHovered ? 'scale-110' : ''}`}
          >
            ＋
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold leading-tight text-white md:text-xl">Werden Sie Teil unseres Boards</h3>
        <p className="text-sm font-semibold leading-relaxed text-white/90 md:text-base">Advisory Board Member</p>
        <p className="text-xs text-white/60 md:text-sm">Ihre Expertise gesucht</p>
        <div className="pt-2">
          <a
           href="/kontakt?intent=advisory"
  className="inline-flex items-center gap-2 rounded-full border-[var(--secondary-100)] bg-[var(--secondary-100)] px-3 py-3 text-center font-bold text-[var(--neutral-100)] hover:!text-[var(--neutral-100)] shadow-[rgba(0,0,0,0.3)_0px_19px_38px,rgba(0,0,0,0.22)_0px_15px_12px] transition-all duration-150 ease-in-out hover:scale-105 hover:-translate-y-1"
>
            Interesse melden
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-[var(--neutral-100)]"
            >
    <line x1="7" y1="17" x2="17" y2="7"></line>
    <polyline points="7,7 17,7 17,17"></polyline>
  </svg>
</a>
        </div>
      </div>
    </div>
  )
}

export default function AdvisoryBoard({ className = '' }) {
  return (
    <section className={`overflow-x-hidden px-4 py-16 md:py-24 ${className}`}>
      <div className="mx-auto max-w-7xl overflow-hidden">
        {/* Header */}
        <div className="mb-12 text-center md:mb-16">
          <h2 className="mb-6 bg-gradient-to-br from-[var(--primary-300)] via-[var(--secondary-200)] to-[var(--primary-400)] bg-clip-text pb-2 text-4xl font-black leading-tight text-transparent drop-shadow-lg md:text-5xl lg:text-6xl">
            Unser Advisory Board
          </h2>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-white/80 md:text-xl">
            Erfahrene Mentoren und Experten, die IGNITE zum Erfolg führen
          </p>
        </div>

        {/* Board Grid */}
        <div className="mb-12 mt-12 grid grid-cols-1 gap-6 py-4 sm:grid-cols-2 md:mb-16 md:gap-8 lg:grid-cols-3">
          {advisoryMembers.map((member) => (
            <div key={member.id} className="flex w-full">
              <AdvisoryMemberCard member={member} />
            </div>
          ))}
          {/* Add Member Card */}
          <div key="add-member" className="flex w-full">
            <AddMemberCard />
          </div>
        </div>
      </div>
    </section>
  )
}
