import { useState } from 'react'

const advisoryMembers = [
  {
    id: 1,
    name: 'Prof. Dr. Markus Reihlen',
    title: 'Professor für Strategisches Management & Entrepreneurship',
    department: 'Vizepräsident Entrepreneurship, Transfer & Internationalisierung',
    boardRole: 'Schirmherrschaft',
    bio: 'Experte für Strategisches Management und Innovation',
    linkedin: '#',
    image: '',
    initials: 'MR',
  },
  //     {
  //     id: 2,
  //     name: "Prof. Dr. Markus Reihlen",
  //     title: "Professor für Strategisches Management",
  //     department: "Leuphana Business School",
  //     boardRole: "Schirmherrschaft",
  //     bio: "Experte für Strategisches Management und Innovation",
  //     linkedin: "#",
  //     image: "/path/to/markus-reihlen.jpg", // NEU - Bildpfad (optional)
  //     initials: "MR" // NEU - Manuelle Initialen (optional)
  //   }
]

function AdvisoryMemberCard({ member }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="hover:bg-white/8 hover:border-[var(--primary-500)]/30 hover:shadow-[var(--primary-500)]/20 group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-3xl transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl md:p-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Profile Image */}
      <div className="relative mx-auto mb-6 h-28 w-28 md:h-32 md:w-32">
        <div className="h-full w-full rounded-full bg-gradient-to-br from-[var(--primary-300)] via-[var(--secondary-200)] to-[var(--primary-400)] p-1 transition-all duration-300 group-hover:scale-105">
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gray-900/90">
            {/* Conditional: Real image or initials */}
            {member.image ? (
              <img src={member.image} alt={member.name} className="h-full w-full rounded-full object-cover" />
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

            {/* Hover overlay */}
            <div
              className={`bg-[var(--primary-500)]/90 absolute inset-1 flex items-center justify-center rounded-full transition-all duration-300 ${isHovered ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
            >
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Member Info */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold leading-tight text-white md:text-xl">{member.name}</h3>
        <p className="text-sm font-semibold leading-relaxed text-white/90 md:text-base">{member.title}</p>
        {member.boardRole && (
          <p className="text-sm font-bold leading-relaxed text-[var(--secondary-200)]">{member.boardRole}</p>
        )}
        {/* {member.department && (
    <p className="text-xs md:text-sm text-white/60">
      {member.department}
    </p>
  )} */}
        {member.bio && (
          <p className="translate-y-2 transform pt-2 text-xs leading-relaxed text-white/70 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 md:text-sm">
            {member.bio}
          </p>
        )}
      </div>
    </div>
  )
}

function AddMemberCard() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="hover:bg-white/8 hover:border-[var(--primary-500)]/40 hover:shadow-[var(--primary-500)]/20 group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center backdrop-blur-3xl transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl md:p-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Plus Icon */}
      <div className="relative mx-auto mb-6 h-28 w-28 md:h-32 md:w-32">
        <div className="group-hover:border-[var(--primary-300)]/50 flex h-full w-full items-center justify-center rounded-full border-2 border-dashed border-white/30 transition-all duration-300 group-hover:scale-105">
          <div
            className={`flex items-center justify-center text-6xl font-light leading-none text-white/40 transition-all duration-300 group-hover:text-[var(--secondary-200)] md:text-7xl ${isHovered ? 'scale-110' : ''}`}
          >
            +
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
            className="border-3 inline-flex items-center gap-2 rounded-full border-[var(--secondary-100)] bg-[var(--secondary-100)] px-3 py-3 text-center font-bold text-[var(--neutral-100)] shadow-[rgba(0,0,0,0.3)_0px_19px_38px,rgba(0,0,0,0.22)_0px_15px_12px] transition-all duration-150 ease-in-out hover:border-[var(--secondary-400)] hover:bg-[var(--secondary-400)] hover:text-white hover:underline focus:border-[var(--secondary-400)] focus:bg-[var(--secondary-400)] focus:text-white focus:underline"
          >
            Interesse melden
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-[var(--neutral-100)] group-hover:text-white"
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
    <section className={`px-4 py-16 md:py-24 ${className}`}>
      <div className="mx-auto max-w-7xl">
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
        <div className="mb-12 flex flex-wrap justify-center gap-6 px-4 md:mb-16 md:gap-8 overflow-x-hidden max-w-full">
          {advisoryMembers.map((member) => (
            <div key={member.id} className="flex w-full max-w-[280px] sm:w-auto sm:min-w-[280px] sm:max-w-[320px]">
              <AdvisoryMemberCard member={member} />
            </div>
          ))}
          {/* Add Member Card */}
          <div key="add-member" className="flex w-full max-w-[280px] sm:w-auto sm:min-w-[280px] sm:max-w-[320px]">
            <AddMemberCard />
          </div>
        </div>
      </div>
    </section>
  )
}
