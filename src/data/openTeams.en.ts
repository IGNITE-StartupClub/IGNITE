/**
 * English texts of the open teams on /en/join. Team names, categories and ids come from openTeams.ts;
 * only the role title and description are translated.
 */
import { openTeams as germanTeams, type OpenTeam } from './openTeams'

type Translation = Pick<OpenTeam, 'title' | 'description'>

const translations: Record<string, Translation> = {
  'ignite-relations': {
    title: 'Relations Team',
    description:
      'Builds contacts with organizations, companies and Advisory Board members. Coordinates partnerships and external relations.',
  },
  'ignite-marketing': {
    title: 'Marketing Team',
    description:
      'Creates visibility through social media, the website, the newsletter and a physical presence on campus. Produces content and promotional material.',
  },
  'ignite-hr': {
    title: 'People Team',
    description:
      'Organizes recruiting, introductory conversations and team building. Point of contact for internal topics and meetings.',
  },
  'ignite-finance-legal': {
    title: 'Finance & Legal Team',
    description:
      'Takes care of the association setup, bookkeeping, budgeting and sponsorships. Manages legal and financial matters.',
  },
  'ignite-infrastructure': {
    title: 'Process & Tools Team',
    description:
      'Selects tools, manages accounts and improves internal workflows. Makes sure the team collaborates efficiently.',
  },
}

export const openTeams: readonly OpenTeam[] = germanTeams.map((team) => {
  const translation = translations[team.id]
  if (!translation) throw new Error(`Missing English translation for open team "${team.id}"`)
  return { ...team, ...translation }
})
