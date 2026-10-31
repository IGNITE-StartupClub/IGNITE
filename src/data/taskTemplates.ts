/**
 * Standard checklists of the tasks module. tasksStore.ts copies them once into the `task_templates` collection, where
 * admins can archive them like any template a project was saved as; changing a list here does not touch the copy in
 * the database. They stay German in both languages, because the tasks they become are the club's own working data.
 * offsetDays: days relative to the event (negative = before), null for no deadline.
 */
import type { TemplateTask } from '../lib/tasks'

interface StandardTemplate {
  id: `std-${string}`
  name: string
  description: string
  tasks: TemplateTask[]
}

const item = (title: string, offsetDays: number | null, extra: Partial<TemplateTask> = {}): TemplateTask => ({
  title,
  description: '',
  priority: 'normal',
  required: false,
  offsetDays,
  ...extra,
})

export const standardTemplates: StandardTemplate[] = [
  {
    id: 'std-networking',
    name: 'Networking Event',
    description: 'Abendveranstaltung mit Gästen, Speaker:innen und Austausch.',
    tasks: [
      item('Location anfragen und bestätigen', -28, { priority: 'high', required: true }),
      item('Speaker:innen oder Gäste einladen', -28, { priority: 'high' }),
      item('Luma-Event anlegen beziehungsweise prüfen', -21, { required: true }),
      item('LinkedIn- und Instagram-Ankündigung veröffentlichen', -14),
      item('Getränke und Snacks organisieren', -7),
      item('Mitglieder in der WhatsApp-Community informieren', -7),
      item('Reminder an Angemeldete verschicken', -2),
      item('Aufbau und Technik vorbereiten', 0),
      item('Event durchführen', 0, { required: true }),
      item('Fotos teilen und Follow-up versenden', 2),
    ],
  },
  {
    id: 'std-workshop',
    name: 'Workshop',
    description: 'Inhaltlicher Workshop mit Referent:in und begrenzter Teilnehmerzahl.',
    tasks: [
      item('Referent:in und Thema festlegen', -35, { priority: 'high', required: true }),
      item('Raum reservieren', -28, { required: true }),
      item('Ablauf und Materialien mit Referent:in abstimmen', -14),
      item('Luma-Event mit Teilnehmerlimit anlegen', -21, { required: true }),
      item('Ankündigung auf LinkedIn und Instagram', -14),
      item('Teilnehmerliste prüfen', -3),
      item('Reminder mit Vorbereitung verschicken', -2),
      item('Technik und Material vor Ort prüfen', 0),
      item('Workshop durchführen', 0, { required: true }),
      item('Feedback einholen und Unterlagen teilen', 3),
    ],
  },
  {
    id: 'std-company-visit',
    name: 'Company Visit',
    description: 'Besuch bei einem Unternehmen oder Startup mit einer Gruppe von Mitgliedern.',
    tasks: [
      item('Unternehmen kontaktieren', -42, { priority: 'high', required: true }),
      item('Termin vereinbaren', -35, { required: true }),
      item('Teilnehmerzahl klären', -30),
      item('Luma-Event anlegen beziehungsweise prüfen', -21, { required: true }),
      item('LinkedIn-Ankündigung veröffentlichen', -14),
      item('Mitglieder informieren', -14),
      item('Teilnehmerliste an das Unternehmen weitergeben', -5),
      item('Ablauf mit dem Unternehmen abstimmen', -5),
      item('Reminder verschicken', -2),
      item('Veranstaltung durchführen', 0, { required: true }),
      item('Follow-up versenden', 2),
      item('Dankesnachricht an das Unternehmen verschicken', 3),
    ],
  },
  {
    id: 'std-pitch',
    name: 'Pitch Event',
    description: 'Startups pitchen vor Publikum und Jury.',
    tasks: [
      item('Jury anfragen', -42, { priority: 'high', required: true }),
      item('Bewerbungsphase für Startups öffnen', -42, { required: true }),
      item('Location und Technik buchen', -35, { required: true }),
      item('Startups auswählen und benachrichtigen', -21, { priority: 'high' }),
      item('Luma-Event anlegen beziehungsweise prüfen', -21),
      item('Ablauf, Pitch-Zeiten und Bewertungsbogen festlegen', -14),
      item('Ankündigung mit den Startups veröffentlichen', -10),
      item('Pitch-Decks einsammeln', -3, { required: true }),
      item('Event durchführen', 0, { required: true }),
      item('Ergebnisse und Fotos teilen', 2),
    ],
  },
  {
    id: 'std-team-event',
    name: 'Internes Team-Event',
    description: 'Teamabend, Teamfahrt oder Klausur nur für Mitglieder.',
    tasks: [
      item('Termin mit dem Team abstimmen', -30, { required: true }),
      item('Ort und gegebenenfalls Unterkunft buchen', -21, { priority: 'high', required: true }),
      item('Anreise koordinieren', -10),
      item('Agenda festlegen', -7),
      item('Kosten und Beiträge klären', -7),
      item('Teilnehmer informieren', -5),
      item('Event durchführen', 0, { required: true }),
      item('Abrechnung abschließen', 7),
    ],
  },
]
