/**
 * Knowledge packages of the Guide (/materialien, /en/materials). Visitors pick one or more and the team mails them.
 * `id` is what the form sends and the API checks, so keep ids stable; titles may change. `icon` is a lucide-react
 * name that GuideRequestForm.jsx maps to its component. English text: guidePackages.en.ts (same ids, same order).
 */
export interface GuidePackage {
  id: string
  icon: 'lightbulb' | 'layout' | 'scale' | 'coins' | 'presentation' | 'users' | 'megaphone'
  title: string
  subtitle: string
}

export const guidePackages: GuidePackage[] = [
  { id: 'idee', icon: 'lightbulb', title: 'Ideenfindung & Validierung', subtitle: 'Problem finden, Annahmen testen, Interviews führen' },
  { id: 'geschaeftsmodell', icon: 'layout', title: 'Geschäftsmodell', subtitle: 'Business Model Canvas, Zielgruppe, Wettbewerb' },
  { id: 'gruendung', icon: 'scale', title: 'Rechtsform & Gründung', subtitle: 'GbR, UG oder GmbH, Anmeldung, Steuern' },
  { id: 'finanzierung', icon: 'coins', title: 'Finanzierung & Förderung', subtitle: 'EXIST, Stipendien, Business Angels' },
  { id: 'pitch', icon: 'presentation', title: 'Pitch & Präsentation', subtitle: 'Pitch Deck, Storytelling, Fragen der Jury' },
  { id: 'team', icon: 'users', title: 'Team & Mitgründung', subtitle: 'Mitgründende finden, Rollen, Anteile' },
  { id: 'marketing', icon: 'megaphone', title: 'Marketing & Markteintritt', subtitle: 'Positionierung, erste Kundschaft, Kanäle' },
]
