/**
 * The search field of the member header (MemberSearch.jsx, /api/members/search). The endpoint builds one index of what
 * the member may see and the island filters it while typing, so a search costs one function call per opening instead
 * of one per keystroke. The first character decides the mode: `+` captures a task, `@` looks only for people.
 * Without database access, so node --test can load it.
 */
import { dayLabel, eventDate } from './memberHome.ts'
import { addDays, TITLE_MAX, type TeamChoice } from './tasks.ts'

type Locale = 'de' | 'en'

export const SEARCH_KINDS = ['task', 'project', 'event', 'guide', 'member', 'alumni', 'contact'] as const
export type SearchKind = (typeof SEARCH_KINDS)[number]
const PEOPLE_KINDS: SearchKind[] = ['member', 'alumni', 'contact']

export interface SearchItem {
  kind: SearchKind
  id: string
  title: string
  meta: string
  url: string
  /** A finished task or a past event, listed after the rest. */
  done?: boolean
  photo?: string
  team?: string
}

export interface SearchMember {
  id: string
  name: string
  team: string
}

export interface SearchTeam {
  id: string
  name: string
}

export type SearchMode = 'empty' | 'search' | 'people' | 'task'

export function searchMode(text: string): SearchMode {
  const start = text.trimStart()
  if (!start) return 'empty'
  if (start.startsWith('+')) return 'task'
  return start.startsWith('@') ? 'people' : 'search'
}

const normalize = (text: string): string => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

const GROUP_LIMIT = 4
const PEOPLE_LIMIT = 8

/** Lower is better; null when a word of the query is missing. */
function rank(item: SearchItem, words: string[]): number | null {
  const title = normalize(item.title)
  const all = `${title} ${normalize(item.meta)}`
  if (!words.every((word) => all.includes(word))) return null
  const query = words.join(' ')
  const score = title.startsWith(query)
    ? 0
    : title.split(/\s+/).some((part) => part.startsWith(words[0]))
      ? 1
      : title.includes(words[0])
        ? 2
        : 3
  return score + (item.done ? 10 : 0)
}

/** The hits per kind in the order of SEARCH_KINDS, best first. A text starting with @ looks only at people. */
export function searchGroups(items: SearchItem[], text: string): { kind: SearchKind; items: SearchItem[] }[] {
  const people = searchMode(text) === 'people'
  const words = normalize(text.trim().replace(/^@/, '')).split(/\s+/).filter(Boolean)
  const hits = items
    .filter((item) => !people || PEOPLE_KINDS.includes(item.kind))
    .map((item) => ({ item, score: rank(item, words) }))
    .filter((hit): hit is { item: SearchItem; score: number } => hit.score !== null)
    .sort((a, b) => a.score - b.score)
    .map(({ item }) => item)
  return SEARCH_KINDS.map((kind) => ({
    kind,
    items: hits.filter((item) => item.kind === kind).slice(0, people ? PEOPLE_LIMIT : GROUP_LIMIT),
  })).filter((group) => group.items.length)
}

const WEEKDAYS: Record<string, number> = {
  so: 0,
  sonntag: 0,
  sun: 0,
  sunday: 0,
  mo: 1,
  montag: 1,
  mon: 1,
  monday: 1,
  di: 2,
  dienstag: 2,
  tue: 2,
  tuesday: 2,
  mi: 3,
  mittwoch: 3,
  wed: 3,
  wednesday: 3,
  do: 4,
  donnerstag: 4,
  thu: 4,
  thursday: 4,
  fr: 5,
  freitag: 5,
  fri: 5,
  friday: 5,
  sa: 6,
  samstag: 6,
  sat: 6,
  saturday: 6,
}
const RELATIVE_DAYS: Record<string, number> = { heute: 0, today: 0, morgen: 1, tomorrow: 1, übermorgen: 2 }
const MONTHS: Record<string, number> = {
  jan: 1,
  januar: 1,
  january: 1,
  feb: 2,
  februar: 2,
  february: 2,
  mär: 3,
  märz: 3,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  mai: 5,
  may: 5,
  jun: 6,
  juni: 6,
  june: 6,
  jul: 7,
  juli: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  okt: 10,
  oktober: 10,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dez: 12,
  dezember: 12,
  dec: 12,
  december: 12,
}
const NUMERIC_DATE = /^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}|\d{2})?)?$/
const NAMED_DATE = /^(\d{1,2})\.?\s+(\p{L}+)\.?(?:\s+(\d{4}))?$/u

/**
 * YYYY-MM-DD for "mi", "morgen", "17.11", "17.11.26" or "17. November 2026", '' for anything else. A weekday is its
 * next day after today, a date without a year the next time it comes round.
 */
export function dueFrom(word: string, today: string): string {
  const value = word.toLowerCase()
  if (value in RELATIVE_DAYS) return addDays(today, RELATIVE_DAYS[value])
  if (value in WEEKDAYS) {
    const weekday = new Date(`${today}T00:00:00Z`).getUTCDay()
    return addDays(today, ((WEEKDAYS[value] - weekday + 6) % 7) + 1)
  }
  const numeric = value.match(NUMERIC_DATE)
  const date = numeric ?? value.match(NAMED_DATE)
  if (!date) return ''
  const [, day, monthWord, yearWord] = date
  const month = numeric ? monthWord : String(MONTHS[monthWord] ?? '')
  if (!month) return ''
  const year = yearWord?.length === 2 ? `20${yearWord}` : yearWord
  const on = (y: string) => `${y}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  const thisYear = today.slice(0, 4)
  const result = year ? on(year) : on(thisYear) < today ? on(String(Number(thisYear) + 1)) : on(thisYear)
  const real = new Date(`${result}T00:00:00Z`)
  return !Number.isNaN(real.getTime()) && real.toISOString().slice(0, 10) === result ? result : ''
}

/** "Mi, 17. Nov." with the year added when it is not this one, so a typed date can be checked before saving. */
export const dueLabel = (due: string, today: string, locale: Locale): string =>
  due.slice(0, 4) === today.slice(0, 4) ? dayLabel(due, locale) : `${dayLabel(due, locale)} ${due.slice(0, 4)}`

// A named date spans several words. Its year needs four digits, so "bis 17. Mai 20 Flyer drucken" keeps the 20.
// "bis 10.05 Uhr" is a time, not the 10 May.
const DUE_WORD = /(?:^|\s)(?:bis|by)\s+(\d{1,2}\.?\s+\p{L}+\.?(?:\s+\d{4})?|\S+)(?=\s|$)(?!\s+uhr\b)/giu
// At the start of a word, so a mail address stays text, and with a letter first, so "#2" does too.
const PERSON = /(?:^|\s)@(\p{L}\S*)/gu
const TEAM = /(?:^|\s)#(\p{L}\S*)/gu
const LONE_MARKER = /(?:^|\s)[@#](?=\s|$)/g

const tokenWords = (token: string) => normalize(token).replace(/-/g, ' ')

/** Every member a @token could mean: the exact name alone if there is one, otherwise all names with such a word. */
function matchPeople(token: string, members: SearchMember[]): SearchMember[] {
  const wanted = tokenWords(token)
  const exact = members.filter(({ name }) => normalize(name) === wanted)
  if (exact.length) return exact
  return members.filter(({ name }) => {
    const full = normalize(name)
    return full.startsWith(wanted) || full.split(/\s+/).some((word) => word.startsWith(wanted))
  })
}

const teamWords = (name: string) =>
  normalize(name)
    .split(/[^\p{L}]+/u)
    .filter(Boolean)

function matchTeam(token: string, teams: SearchTeam[]): SearchTeam | null {
  const wanted = normalize(token)
  const found = teams.filter(({ name }) => {
    const words = teamWords(name)
    return words.some((word) => word.startsWith(wanted)) || words.map((word) => word[0]).join('') === wanted
  })
  return found.length === 1 ? found[0] : null
}

export interface CaptureProblem {
  kind: 'unknownPerson' | 'ambiguousPerson' | 'unknownTeam' | 'tooLong'
  token: string
}

export interface CapturedTask {
  title: string
  due: string
  assignees: SearchMember[]
  team: TeamChoice
  problems: CaptureProblem[]
}

interface CaptureContext {
  members: SearchMember[]
  teams: SearchTeam[]
  me: string
  today: string
}

/**
 * Reads "+ Flyer drucken bis Mi @Lena #Marketing". Without a person the task is the member's own, without a team it
 * joins the team of its first person. An unclear @ or # is a problem to show, never a guess.
 */
export function captureTask(text: string, { members, teams, me, today }: CaptureContext): CapturedTask {
  const problems: CaptureProblem[] = []
  const line = text.trimStart().replace(/^\+/, '')

  let due = ''
  const withoutDue = line.replace(DUE_WORD, (match, word) => {
    const day = dueFrom(word, today)
    if (!day || due) return match
    due = day
    return ''
  })

  const assignees: SearchMember[] = []
  const withoutPeople = withoutDue.replace(PERSON, (_, token) => {
    const found = matchPeople(token, members)
    if (found.length === 1) {
      if (!assignees.includes(found[0])) assignees.push(found[0])
    } else {
      problems.push({ kind: found.length ? 'ambiguousPerson' : 'unknownPerson', token })
    }
    return ''
  })

  let named = ''
  const withoutTeam = withoutPeople.replace(TEAM, (_, token) => {
    const found = matchTeam(token, teams)
    if (found) named = found.id
    else problems.push({ kind: 'unknownTeam', token })
    return ''
  })

  const title = withoutTeam.replace(LONE_MARKER, '').replace(/\s+/g, ' ').trim()
  if (title.length > TITLE_MAX) problems.push({ kind: 'tooLong', token: '' })
  const people = assignees.length ? assignees : members.filter(({ id }) => id === me)
  return { title, due, assignees: people, team: (named || people[0]?.team || '') as TeamChoice, problems }
}

export interface OpenToken {
  marker: '@' | '#'
  word: string
}

/** The @ or # word the cursor stands in at the end of `text`, null without one. */
export function openToken(text: string): OpenToken | null {
  const match = text.match(/(?:^|\s)([@#])(\S*)$/)
  return match ? { marker: match[1] as OpenToken['marker'], word: match[2] } : null
}

const SUGGESTION_LIMIT = 5

/** The word without spaces that resolves to exactly this name. */
/** The id of a member's entry on the team tab of the Netzwerk. */
export const personAnchor = (id: string): string => `person-${id}`

export const personHandle = (name: string): string => `@${name.trim().replace(/\s+/g, '-')}`

/** What may complete the token. A word that already names its one match needs no completion. */
export function suggestions(token: OpenToken | null, members: SearchMember[], teams: SearchTeam[]) {
  if (!token) return []
  const found = token.marker === '#' ? teamSuggestions(token, teams) : personSuggestions(token, members)
  const typed = normalize(`${token.marker}${token.word}`)
  return found.length === 1 && normalize(found[0].handle) === typed ? [] : found
}

function teamSuggestions({ word }: OpenToken, teams: SearchTeam[]) {
  const wanted = normalize(word)
  return teams
    .filter(({ name }) => teamWords(name).some((part) => part.startsWith(wanted)))
    .map(({ id, name }) => ({ id, label: name, handle: `#${name.split(/\s+/)[0]}` }))
    .slice(0, SUGGESTION_LIMIT)
}

function personSuggestions({ word }: OpenToken, members: SearchMember[]) {
  const list = word ? matchPeople(word, members) : members
  return [...list]
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
    .slice(0, SUGGESTION_LIMIT)
    .map(({ id, name }) => ({ id, label: name, handle: personHandle(name) }))
}

/** The word the list completes: the one at the end of `text`, else a person that stays unclear further back. */
export function tokenToComplete(
  text: string,
  problems: CaptureProblem[],
  members: SearchMember[],
  teams: SearchTeam[],
): OpenToken | null {
  const open = openToken(text)
  if (suggestions(open, members, teams).length) return open
  const unclear = problems.find(({ kind }) => kind === 'ambiguousPerson')
  return unclear ? { marker: '@', word: unclear.token } : open
}

/** `text` with the token replaced, ready for the next word. */
export function completeToken(text: string, token: OpenToken, handle: string): string {
  const parts = text.split(/(\s+)/)
  parts[parts.lastIndexOf(`${token.marker}${token.word}`)] = handle
  return `${parts.join('').trimEnd()} `
}

interface IndexProject {
  id: string
  title: string
  type: string
  archived: boolean
  event: { id: string } | null
  tasks: { id: string; title: string; done: boolean; due: string; assignees: string[] }[]
}

interface IndexSources {
  projects: IndexProject[]
  privateTasks: { id: string; title: string; done: boolean; due: string }[]
  members: (SearchMember & { photo: string })[]
  contacts: { id: string; name: string; organization: string; role: string }[]
  alumni: { id: string; name: string; now: string; city: string }[]
  events: { id: string; title: string; startAt: Date; endAt: Date; location: string | null }[]
  guides: { id: string; title: string; description: string }[]
}

interface IndexContext {
  locale: Locale
  paths: { tasks: string; crm: string; alumni: string; guide: string; team: string }
  teamNames: Record<string, string>
  privateLabel: string
  now?: number
}

const line = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' · ')

/**
 * Everything the member may see, cut down to what the result list shows. Only named fields leave here, so no email
 * address reaches the browser, which also keeps the alumni rule on hidden addresses out of this code.
 */
export function buildSearchIndex(
  sources: IndexSources,
  { locale, paths, teamNames, privateLabel, now = Date.now() }: IndexContext,
): SearchItem[] {
  const names = new Map(sources.members.map(({ id, name }) => [id, name]))
  const due = (day: string) => (day ? dayLabel(day, locale) : '')
  const projects = sources.projects.filter((project) => !project.archived)
  const planning = new Map(projects.filter(({ event }) => event).map((project) => [project.event!.id, project.id]))
  const projectUrl = (id: string) => `${paths.tasks}#${encodeURIComponent(id)}`

  return [
    ...projects.flatMap((project): SearchItem[] => {
      const single = project.type === 'task'
      const tasks = project.tasks.map(
        (task): SearchItem => ({
          kind: 'task',
          id: task.id,
          title: task.title,
          meta: line(
            single ? '' : project.title,
            due(task.due),
            task.assignees
              .map((id) => names.get(id))
              .filter(Boolean)
              .join(', '),
          ),
          url: projectUrl(project.id),
          done: task.done,
        }),
      )
      return single
        ? tasks
        : [{ kind: 'project', id: project.id, title: project.title, meta: '', url: projectUrl(project.id) }, ...tasks]
    }),
    ...sources.privateTasks.map(
      (task): SearchItem => ({
        kind: 'task',
        id: task.id,
        title: task.title,
        meta: line(privateLabel, due(task.due)),
        url: `${paths.tasks}?ansicht=meine`,
        done: task.done,
      }),
    ),
    ...sources.events.map((event): SearchItem => {
      const project = planning.get(event.id)
      return {
        kind: 'event',
        id: event.id,
        title: event.title,
        meta: line(eventDate(event.startAt, locale).weekdayDay, event.location),
        url: project ? projectUrl(project) : `${paths.tasks}?ansicht=events`,
        done: event.endAt.getTime() < now,
      }
    }),
    ...sources.guides.map(
      ({ id, title, description }): SearchItem => ({
        kind: 'guide',
        id,
        title,
        meta: description,
        url: `${paths.guide}/${id}`,
      }),
    ),
    ...sources.members.map(
      ({ id, name, team, photo }): SearchItem => ({
        kind: 'member',
        id,
        title: name,
        meta: teamNames[team] ?? '',
        // A member has no profile page yet, so the entry on the team tab stands in for one.
        url: `${paths.team}#${personAnchor(id)}`,
        photo,
        team,
      }),
    ),
    ...sources.alumni.map(
      ({ id, name, now: position, city }): SearchItem => ({
        kind: 'alumni',
        id,
        title: name,
        meta: line(position, city),
        url: `${paths.alumni}#${encodeURIComponent(id)}`,
      }),
    ),
    ...sources.contacts.map(
      ({ id, name, organization, role }): SearchItem => ({
        kind: 'contact',
        id,
        title: name,
        meta: line(organization, role),
        url: `${paths.crm}#${encodeURIComponent(id)}`,
      }),
    ),
  ]
}
