// English Advisory Board texts. Names, photos and links come from advisoryBoard.ts; only the descriptive fields are translated.
import { advisoryMembers as germanMembers, type AdvisoryMember } from './advisoryBoard'

type Translation = Pick<AdvisoryMember, 'title' | 'department' | 'boardRole' | 'bio'>

const translations: Record<string, Translation> = {
  'Prof. Dr. Markus Reihlen': {
    title: 'Professor of Strategic Management & Entrepreneurship',
    department: 'Vice President Entrepreneurship, Transfer & Internationalization',
    boardRole: 'Patronage',
    bio: 'Prof. Reihlen researches corporate and digital entrepreneurship, strategic management and organization theory. He was a visiting professor at the University of St. Gallen and the University of Wisconsin-Milwaukee. With eight Academy of Management best paper awards and ten books as author or editor, he is among the leading experts in his field.',
  },
  'Prof. Dr. Burkhardt Funk': {
    title: 'Professor of Information Systems and Data Science',
    department: 'Leuphana University Lüneburg',
    boardRole: 'Advisory Board Member',
    bio: 'Prof. Funk researches data-driven services and machine learning in e-commerce and e-health. In 2015 he initiated one of the first data science degree programs in Germany and leads the DATAx initiative on data literacy. As a visiting researcher at Stanford and the University of Virginia, he combines research with founding experience at HelloBetter, Adference and Smartboatia.',
  },
  'Prof. Dr. Elke Schüßler': {
    title: 'Professor of Business Administration, in particular Entrepreneurship and Organization',
    department: 'Leuphana University Lüneburg',
    boardRole: 'Advisory Board Member',
    bio: 'Prof. Schüßler studies the dynamics of organizational change, with a focus on sustainable forms of organizing and working. She was previously a professor at Johannes Kepler University Linz and a junior professor at FU Berlin. Among other honors, she received the Academy of Management Journal Best Article Award. She is an associate editor at Business & Society and sits on the executive board of EGOS.',
  },
  'Prof. Dr. Matthias Wenzel': {
    title: 'Professor of Organization',
    department: 'Leuphana University Lüneburg',
    boardRole: 'Advisory Board Member',
    bio: 'Prof. Wenzel studies the interplay of organization and strategy from a practice-theoretical perspective, and its societal implications. His work appears in leading journals such as the Academy of Management Journal and the Strategic Management Journal. From 2025 he is Senior Editor for Organization Studies and co-editor for Media Innovations at the Strategic Management Journal.',
  },
  'Prof. Dr. Pauline Reinecke': {
    title: 'Junior Professor of Business Administration, in particular Strategic Entrepreneurship',
    department: 'Leuphana University Lüneburg',
    boardRole: 'Advisory Board Member',
    bio: 'Prof. Reinecke researches strategic entrepreneurship and how entrepreneurial action can help solve complex societal challenges. Her work connects strategy, organization and innovation, with a focus on social enterprises, digital platforms and sustainable business models.',
  },
  'Dr. Markus Lemmens': {
    title: 'Chief Communication Officer of Leuphana University',
    department: 'Leuphana University Lüneburg',
    boardRole: 'Advisory Board Member',
    bio: 'Dr. Markus Lemmens has founded several ventures since 1996 (media, public affairs, fusion energy and IT). He works in science management. His focus includes deep technology as a bridge between research and the Mittelstand (Germany\'s small and mid-sized companies). He is currently Chief Communication Officer of Leuphana University Lüneburg.',
  },
}

export const advisoryMembers: AdvisoryMember[] = germanMembers.map((member) => {
  const translation = translations[member.name]
  if (!translation) throw new Error(`Missing English translation for advisory board member "${member.name}"`)
  return { ...member, ...translation }
})
