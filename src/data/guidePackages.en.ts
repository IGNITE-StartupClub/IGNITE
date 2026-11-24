import type { GuidePackage } from './guidePackages'

// English copy of guidePackages.ts: same ids, icons and order.
export const guidePackages: GuidePackage[] = [
  { id: 'idee', icon: 'lightbulb', title: 'From idea to concept', subtitle: 'Find and validate ideas, startup basics and startup ABC' },
  { id: 'gruendung', icon: 'rocket', title: 'From concept to startup', subtitle: 'Team, business model, legal form and registration, first MVP' },
  { id: 'wachstum', icon: 'trendingUp', title: 'From startup to growth', subtitle: 'Market entry, first customers, sales and marketing, scaling' },
  { id: 'finanzierung', icon: 'coins', title: 'Funding & grants', subtitle: 'Bootstrapping, EXIST and scholarships, business angels, VC' },
  { id: 'pitch', icon: 'presentation', title: 'Pitch & presentation', subtitle: 'Pitch deck, presenting convincingly, competitions and investors' },
  { id: 'netzwerk', icon: 'network', title: 'Network & ecosystem', subtitle: 'Incubators, accelerators, events, finding co-founders' },
]
