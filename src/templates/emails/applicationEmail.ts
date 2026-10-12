// Application Email Template
// Sent to admin when a team application is submitted

import { escapeHtml } from './escapeHtml'
import { fieldHtml, renderEmail } from './layout'

export interface ApplicationEmailData {
  startupInterest?: string
  contribution?: string
  fascination?: string
  name: string
  lastname: string
  email: string
  [key: string]: any // For dynamic questionnaire fields
}

export function getApplicationEmailSubject(): string {
  return 'Neue Bewerbung eingegangen'
}

export function getApplicationEmailHTML(data: ApplicationEmailData, questionLabels: Record<string, string>): string {
  const formatField = (value: any) => {
    if (value === null || value === undefined) return 'Nicht angegeben'
    if (Array.isArray(value)) return escapeHtml(value.join(', ')) || 'Keine Angabe'
    return escapeHtml(String(value))
  }

  const answered = (key: string, label: string) => (data[key] ? fieldHtml(label, formatField(data[key])) : '')

  return renderEmail({
    title: 'Neue Bewerbung',
    preheader: `${data.name} ${data.lastname} hat sich beworben.`,
    audience: 'team',
    contentHtml: [
      fieldHtml('Startup-Interesse', formatField(data.startupInterest)),
      answered('contribution', 'Beitrag zur Community'),
      answered('fascination', 'Faszination am Gründen'),
      ...Object.keys(questionLabels).map((qId) => answered(qId, questionLabels[qId])),
      fieldHtml('Name', `${formatField(data.name)} ${formatField(data.lastname)}`),
      fieldHtml('E-Mail', formatField(data.email)),
    ].join(''),
  })
}
