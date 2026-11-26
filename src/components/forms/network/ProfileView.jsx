/**
 * The content of a profile window in the Netzwerk (opened by NetworkDirectory as a hover preview or pinned): left the
 * photo, name, marks and the facts (IGNITE, studies, tags), right the personal profile, contact and, for contacts and
 * alumni added by hand, where they come from, who looks after them, the next step and the logged history. Fields the
 * viewer may not see arrive empty with their level in `locked` and show a hint whom to ask instead.
 * "Zuletzt aktualisiert am" sits small at the bottom right.
 * Props: person (personSummary), ctx ({ copy, lookups, viewer, locale, today, pinned, busy, run, onOpenPerson,
 * onOpenOrg }).
 */
import React, { useState } from 'react'
import { Check, ExternalLink, Instagram, Linkedin, Mail, Phone, Trash2 } from 'lucide-react'
import { formatDay } from '../../../lib/contacts'
import { dateLabel, ENTRY_TYPES, isDue, monthLabel, QUESTIONS, TAG_CATEGORIES } from '../../../lib/network'
import { DANGER_BUTTON, fill, PRIMARY_BUTTON, TOOL_BUTTON } from '../memberUi'
import { Avatar, SECTION_HEADING, SOFT_BADGE, STRONG_BADGE } from './networkUi'

const LEVEL_ORDER = ['leads', 'board', 'hidden']

/** A label and its value, left out when the value is empty. */
function Fact({ label, children }) {
  if (children === '' || children === null || children === undefined || children === false) return null
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-x-3 py-1 text-sm">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="m-0 min-w-0 break-words">{children}</dd>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className={SECTION_HEADING}>{title}</h3>
      <div className="mt-1.5">{children}</div>
    </section>
  )
}

const hasContent = (...values) => values.some((value) => (Array.isArray(value) ? value.length : !!value))

/** Name of a person id as the network knows it, or "ehemaliges Mitglied" for someone who left. */
export const nameOf = (lookups, personId, copy) => lookups.people[personId]?.name ?? copy.profile.formerMember

function TagList({ person, ctx }) {
  const { copy, lookups } = ctx
  const groups = TAG_CATEGORIES.map((category) => [category, (person.tags ?? []).filter((id) => lookups.tags[id]?.category === category)]).filter(
    ([, ids]) => ids.length,
  )
  if (!groups.length) return null
  return (
    <Section title={copy.profile.tags}>
      {groups.map(([category, ids]) => (
        <div key={category} className="mt-2 first:mt-0">
          <p className="text-xs text-fg-muted">{copy.tagCategories[category]}</p>
          <ul className="m-0 mt-1 flex list-none flex-wrap gap-1.5 p-0">
            {ids.map((id) => (
              <li key={id} className={SOFT_BADGE}>
                {lookups.tags[id].label}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Section>
  )
}

/** The contact links, and one hint for those the viewer may not see. */
function Contact({ person, ctx }) {
  const { copy } = ctx
  const links = [
    person.email && { key: 'email', href: `mailto:${person.email}`, icon: Mail, text: person.email },
    person.phone && { key: 'phone', href: `tel:${person.phone.replace(/[^\d+]/g, '')}`, icon: Phone, text: person.phone },
    person.linkedin && { key: 'linkedin', href: person.linkedin, icon: Linkedin, text: copy.profile.linkedin, external: true },
    person.instagram && { key: 'instagram', href: person.instagram, icon: Instagram, text: copy.profile.instagram, external: true },
    person.website && { key: 'website', href: person.website, icon: ExternalLink, text: person.website.replace(/^https:\/\/(www\.)?|\/$/g, ''), external: true },
  ].filter(Boolean)
  const lockedLevels = ['email', 'phone', 'linkedin', 'instagram', 'website'].map((field) => person.locked?.[field]).filter(Boolean)
  const strictest = LEVEL_ORDER.filter((level) => lockedLevels.includes(level)).pop()
  if (!links.length && !strictest) return null
  return (
    <Section title={copy.profile.contact}>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {links.map(({ key, href, icon: Icon, text, external }) => (
          <li key={key}>
            <a
              href={href}
              className="inline-flex max-w-full items-center gap-2 text-sm text-accent-text underline-offset-2 hover:underline"
              {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
            >
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span className="truncate">{text}</span>
            </a>
          </li>
        ))}
      </ul>
      {strictest && <p className="mt-2 rounded-lg bg-bg-subtle px-3 py-2 text-sm text-fg-muted">{copy.locked[strictest]}</p>}
    </Section>
  )
}

/** Who added the person and through whom the contact came about; the one who brought them in opens on click. */
function Origin({ person, ctx }) {
  const { copy, lookups, locale } = ctx
  const p = copy.profile
  const created = !person.account && fill(p.createdBy, { name: nameOf(lookups, `m-${person.createdBy}`, copy), date: dateLabel(person.createdAt) })
  const introducer = person.introducedBy ? lookups.people[person.introducedBy] : null
  const [before, after = ''] = p.introduced.split('{name}')
  if (!created && !person.introducedBy && !person.introducedOn && !person.source) return null
  return (
    <Section title={p.origin}>
      {created && <p className="text-sm">{created}</p>}
      {(person.introducedBy || person.introducedOn) && (
        <p className="text-sm">
          {person.introducedBy && (
            <>
              {before}
              {introducer ? (
                <button type="button" className="border-0 p-0 text-sm text-accent-text underline-offset-2 hover:underline" onClick={() => ctx.onOpenPerson(introducer.id)}>
                  {introducer.name}
                </button>
              ) : (
                p.formerMember
              )}
              {after}{' '}
            </>
          )}
          {person.introducedOn && fill(p.introducedOn, { date: formatDay(person.introducedOn, locale) })}
        </p>
      )}
      {person.source && (
        <dl className="m-0 mt-1">
          <Fact label={p.source}>{person.source}</Fact>
        </dl>
      )}
    </Section>
  )
}

/** Next step, history and the form to log a contact; only pinned, only for active members. */
function Exchange({ person, ctx }) {
  const { copy, lookups, locale, today, run, busy } = ctx
  const [entry, setEntry] = useState({ type: 'note', date: today, text: '' })
  const p = copy.profile
  const due = isDue(person, today) && person.nextDue < today
  return (
    <>
      <Section title={p.nextStep}>
        {person.nextStep ? (
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm">
              {person.nextStep}
              {person.nextDue && (
                <span className={`block text-xs ${due ? 'font-medium text-danger' : 'text-fg-muted'}`}>
                  {fill(p.dueOn, { date: formatDay(person.nextDue, locale) })}
                  {due && ` · ${p.overdue}`}
                </span>
              )}
            </p>
            <button type="button" className={TOOL_BUTTON} disabled={busy} onClick={() => run({ action: 'done', id: person.id })}>
              <Check aria-hidden="true" className="h-4 w-4" />
              {p.markDone}
            </button>
          </div>
        ) : (
          <p className="text-sm text-fg-muted">{p.noNextStep}</p>
        )}
        {person.owners?.length > 0 && (
          <dl className="m-0 mt-2">
            <Fact label={p.owners}>{person.owners.map((id) => nameOf(lookups, `m-${id}`, copy)).join(', ')}</Fact>
          </dl>
        )}
      </Section>
      <Section title={p.history}>
        <form
          className="flex flex-col gap-2 rounded-lg border border-border p-3"
          onSubmit={async (e) => {
            e.preventDefault()
            if (await run({ action: 'entry', id: person.id, entry })) setEntry({ type: 'note', date: today, text: '' })
          }}
        >
          <p className="text-sm font-medium">{p.entry.heading}</p>
          <div className="flex flex-wrap gap-2">
            <select aria-label={p.entry.type} value={entry.type} onChange={(e) => setEntry({ ...entry, type: e.target.value })} className="h-10 rounded-lg border border-border-strong bg-bg-subtle px-2 text-sm">
              {ENTRY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {p.entryTypes[type]}
                </option>
              ))}
            </select>
            <input type="date" aria-label={p.entry.date} required value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })} className="h-10 rounded-lg border border-border-strong bg-bg-subtle px-2 text-sm" />
          </div>
          <textarea
            aria-label={p.entry.text}
            required
            maxLength={2000}
            rows={2}
            placeholder={p.entry.placeholder}
            value={entry.text}
            onChange={(e) => setEntry({ ...entry, text: e.target.value })}
            className="input min-h-[4.5rem] text-sm"
          />
          <button type="submit" className={`${PRIMARY_BUTTON} self-start`} disabled={busy}>
            {p.entry.submit}
          </button>
        </form>
        {person.entries?.length ? (
          <ol className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
            {person.entries.map((item) => (
              <li key={item.id} className="border-0 border-l-2 border-solid border-border pl-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-fg-muted">
                    <span className="font-medium text-fg">{p.entryTypes[item.type]}</span> · {formatDay(item.date, locale)} ·{' '}
                    {fill(p.entryBy, { by: nameOf(lookups, `m-${item.by}`, copy) })}
                  </p>
                  {item.mayDelete && (
                    <button
                      type="button"
                      aria-label={p.removeEntry}
                      className="rounded-md border-0 p-1 text-fg-muted hover:text-danger"
                      onClick={() => window.confirm(p.confirmRemoveEntry) && run({ action: 'removeEntry', id: person.id, entryId: item.id })}
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-line">{item.text}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-fg-muted">{p.noHistory}</p>
        )}
      </Section>
    </>
  )
}

const years = (from, to) => (from || to ? [from, to].filter(Boolean).join('–') : '')

export default function ProfileView({ person, ctx, headingId, actions }) {
  const { copy, lookups, viewer } = ctx
  const p = copy.profile
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ')
  const org = person.organizationId && lookups.orgs[person.organizationId]
  const team = person.team && lookups.teams[person.team]
  const isMember = person.kind === 'member'
  const isAlumni = person.kind === 'alumni'
  const isExternal = person.kind === 'external'
  const answers = QUESTIONS.filter((question) => person.answers?.[question])
  const crm = ctx.pinned && viewer.position !== 'alumni' && !person.account && 'entries' in person

  const orgLink = org ? (
    <button type="button" className="border-0 p-0 text-left text-sm text-accent-text underline-offset-2 hover:underline" onClick={() => ctx.onOpenOrg(org.id)}>
      {org.name}
    </button>
  ) : null

  return (
    <article className="flex flex-col">
      <div className="grid gap-x-8 gap-y-5 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* Left: who, and the facts. */}
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <Avatar name={name} photo={person.photo} size={88} />
            <div className="min-w-0 pt-1">
              <h2 id={headingId} className="text-[24px] font-semibold leading-tight hyphens-none">
                {name}
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {person.self && <span className={STRONG_BADGE}>{p.self}</span>}
                {isMember && (person.position === 'board' || person.position === 'teamlead') && (
                  <span className={STRONG_BADGE}>{copy.positions[person.position]}</span>
                )}
                {!isMember && <span className={SOFT_BADGE}>{copy.kinds[person.kind]}</span>}
                {(person.relations ?? []).map((relation) => (
                  <span key={relation} className={SOFT_BADGE}>
                    {copy.relations[relation]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5">
            {isMember && (
              <Section title={p.ignite}>
                <dl className="m-0">
                  <Fact label={p.team}>{person.position === 'board' ? copy.positions.board : team?.name}</Fact>
                  <Fact label={p.division}>{team?.division ? copy.divisions[team.division] : ''}</Fact>
                  <Fact label={p.position}>{copy.positions[person.position]}</Fact>
                  <Fact label={p.memberSince}>{monthLabel(person.memberSince)}</Fact>
                </dl>
              </Section>
            )}
            {(isAlumni || isExternal) && hasContent(person.headline, org, person.igniteFrom, person.igniteTo, person.igniteRole, person.engagement) && (
              <Section title={isAlumni ? p.ignite : p.organization}>
                <dl className="m-0">
                  <Fact label={p.headline}>{person.headline}</Fact>
                  <Fact label={p.organization}>{orgLink}</Fact>
                  {isAlumni && <Fact label={p.igniteTime}>{years(person.igniteFrom, person.igniteTo)}</Fact>}
                  {isAlumni && <Fact label={p.igniteRole}>{person.igniteRole}</Fact>}
                  {isAlumni && <Fact label={p.engagement}>{person.engagement}</Fact>}
                </dl>
              </Section>
            )}
            {hasContent(person.major, person.minor, person.semester) && (
              <Section title={p.study}>
                <dl className="m-0">
                  <Fact label={p.major}>{person.major}</Fact>
                  <Fact label={p.minor}>{person.minor}</Fact>
                  <Fact label={p.semester}>{person.semester ? fill(copy.semester, { n: person.semester }) : ''}</Fact>
                </dl>
              </Section>
            )}
            <TagList person={person} ctx={ctx} />
          </div>
        </div>

        {/* Right: the personal side, contact and the exchange with IGNITE. */}
        <div className="min-w-0">
          {answers.length > 0 && (
            <Section title={p.personal}>
              <dl className="m-0 flex flex-col gap-2.5">
                {answers.map((question) => (
                  <div key={question}>
                    <dt className="text-xs text-fg-muted">{copy.questions[question]}</dt>
                    <dd className="m-0 mt-0.5 whitespace-pre-line text-sm">{person.answers[question]}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}
          {person.about && (
            <Section title={isExternal ? p.note : p.about}>
              <p className="whitespace-pre-line text-sm">{person.about}</p>
            </Section>
          )}
          {person.career?.length > 0 && (
            <Section title={p.career}>
              <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-sm">
                {person.career.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </Section>
          )}
          {person.openFor?.length > 0 && (
            <Section title={p.openFor}>
              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {person.openFor.map((item) => (
                  <li key={item} className={SOFT_BADGE}>
                    {copy.openFor[item]}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {person.seeking && (
            <Section title={p.seeking}>
              <p className="whitespace-pre-line text-sm">{person.seeking}</p>
            </Section>
          )}
          {person.city && (
            <Section title={p.city}>
              <p className="text-sm">{person.city}</p>
            </Section>
          )}
          <Contact person={person} ctx={ctx} />
          <Origin person={person} ctx={ctx} />
          {crm && <Exchange person={person} ctx={ctx} />}
        </div>
      </div>

      <footer className="mt-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-0 border-t border-solid border-border pt-3">
        <div className="flex flex-wrap gap-2">{actions}</div>
        <div className="ml-auto flex flex-col items-end gap-0.5 text-right text-xs text-fg-subtle">
          {person.consent && <span>{fill(p.isPublic, { date: dateLabel(person.consent.at) })}</span>}
          <span>{fill(p.updated, { date: dateLabel(person.changedAt) })}</span>
        </div>
      </footer>
    </article>
  )
}

/** The buttons under a pinned profile. */
export function ProfileActions({ person, ctx, onEdit }) {
  const { copy, run, busy } = ctx
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ')
  return (
    <>
      {person.mayEdit && (
        <button type="button" className={TOOL_BUTTON} onClick={onEdit}>
          {copy.profile.edit}
        </button>
      )}
      {person.mayDelete && (
        <button
          type="button"
          className={DANGER_BUTTON}
          disabled={busy}
          onClick={() => window.confirm(fill(copy.profile.confirmDelete, { name })) && run({ action: 'delete', id: person.id }, { closeProfile: true })}
        >
          {copy.profile.delete}
        </button>
      )}
    </>
  )
}
