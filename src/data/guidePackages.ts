/**
 * Knowledge packages of the Guide (/materialien, /en/materials). Visitors pick one or more and the team mails them.
 * `id` is what the form sends and the API checks, so keep ids stable; titles may change. `icon` is a lucide-react
 * name that GuideRequestForm.jsx maps to its component. English text: guidePackages.en.ts (same ids, same order).
 */
export interface GuidePackage {
  id: string
  icon: 'lightbulb' | 'rocket' | 'trendingUp' | 'coins' | 'presentation' | 'network'
  title: string
  subtitle: string
}

export const guidePackages: GuidePackage[] = [
  { id: 'idee', icon: 'lightbulb', title: 'Von der Idee zum Konzept', subtitle: 'Ideen finden und validieren, Startup-Basics und Startup-ABC' },
  { id: 'gruendung', icon: 'rocket', title: 'Vom Konzept zum Startup', subtitle: 'Team, Geschäftsmodell, Rechtsform und Gründung, erstes MVP' },
  { id: 'wachstum', icon: 'trendingUp', title: 'Vom Startup zum Wachstum', subtitle: 'Markteintritt, erste Kunden, Vertrieb und Marketing, Skalierung' },
  { id: 'finanzierung', icon: 'coins', title: 'Finanzierung & Förderung', subtitle: 'Bootstrapping, EXIST und Stipendien, Business Angels, VC' },
  { id: 'pitch', icon: 'presentation', title: 'Pitch & Präsentation', subtitle: 'Pitch Deck, überzeugend präsentieren, Wettbewerbe und Investoren' },
  { id: 'netzwerk', icon: 'network', title: 'Netzwerk & Ökosystem', subtitle: 'Inkubatoren, Acceleratoren, Events, Mitgründer:innen finden' },
]
