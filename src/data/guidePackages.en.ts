import type { GuidePackage } from './guidePackages'

// English copy of guidePackages.ts: same ids, icons and order.
export const guidePackages: GuidePackage[] = [
  { id: 'idee', icon: 'lightbulb', title: 'Ideas & validation', subtitle: 'Find a problem, test assumptions, run interviews' },
  { id: 'geschaeftsmodell', icon: 'layout', title: 'Business model', subtitle: 'Business Model Canvas, target group, competition' },
  { id: 'gruendung', icon: 'scale', title: 'Legal form & registration', subtitle: 'GbR, UG or GmbH, registration, taxes' },
  { id: 'finanzierung', icon: 'coins', title: 'Funding & grants', subtitle: 'EXIST, scholarships, business angels' },
  { id: 'pitch', icon: 'presentation', title: 'Pitch & presentation', subtitle: 'Pitch deck, storytelling, questions from the jury' },
  { id: 'team', icon: 'users', title: 'Team & co-founders', subtitle: 'Find co-founders, roles, equity' },
  { id: 'marketing', icon: 'megaphone', title: 'Marketing & go-to-market', subtitle: 'Positioning, first customers, channels' },
]
