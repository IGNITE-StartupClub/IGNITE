/**
 * The CRM of the members area (React island): a contact list with search and filter chips (types as in CRM_FLAGS,
 * plus "due" for next steps that are due), a detail view per contact with its history, next step and contact data,
 * and a dialog to add or edit a contact. Posts { action, id?, contact?, entry?, entryId? } to /api/members/crm and
 * shows the contact list the API returns after each action.
 * The open contact is the URL hash (#<id>), and each opened contact is a history entry, so the browser's back button
 * returns to the list.
 * Props: copy (memberArea.crm.board), initialContacts (contactSummary objects), locale ('de' | 'en'), today
 * (YYYY-MM-DD in Berlin, so server and browser agree on what is due).
 * Styles: ./forms.css plus Tailwind utilities.
 */
import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { CRM_FLAGS, ENTRY_TYPES, filterContacts, formatDay, isDue } from '../../lib/contacts'
import {
  BADGE,
  Chip,
  DANGER_BUTTON,
  Field,
  fill,
  FormDialog,
  Initials,
  PRIMARY_BUTTON,
  SearchField,
  TOOL_BUTTON,
} from './memberUi'
import './forms.css'

const ERROR_CODES = ['invalid', 'unknown', 'forbidden', 'error']
const EMPTY_CONTACT = {
  name: '',
  organization: '',
  role: '',
  flags: [],
  email: '',
  phone: '',
  linkedin: '',
  owner: '',
  source: '',
  nextStep: '',
  nextDue: '',
}
const CARD = 'rounded-card border border-border bg-bg p-5'
const HEAD = 'whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-fg-muted'

const subtitle = (contact) => [contact.role, contact.organization].filter(Boolean).join(' · ')

function Flags({ contact, copy }) {
  return contact.flags.map((flag) => (
    <span key={flag} className={`${BADGE} border-border-strong text-fg-muted`}>
      {copy.flags[flag]}
    </span>
  ))
}

/** The next step with its due date; overdue dates in red. */
function NextStep({ contact, copy, locale, today }) {
  if (!contact.nextStep) return <span className="text-fg-muted">–</span>
  const due = isDue(contact, today) && contact.nextDue < today
  return (
    <>
      <span className="text-fg">{contact.nextStep}</span>
      {contact.nextDue && (
        <span className={`block text-xs ${due ? 'font-medium text-danger' : 'text-fg-muted'}`}>
          {fill(copy.dueOn, { date: formatDay(contact.nextDue, locale) })}
          {due && ` · ${copy.overdue}`}
        </span>
      )}
    </>
  )
}

export default function CrmBoard({ copy, initialContacts, locale, today }) {
  const [contacts, setContacts] = useState(initialContacts)
  const [query, setQuery] = useState('')
  const [flags, setFlags] = useState([])
  const [dueOnly, setDueOnly] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(EMPTY_CONTACT)
  const [editingId, setEditingId] = useState(null) // null while adding
  const [dialogOpen, setDialogOpen] = useState(false)
  const [entry, setEntry] = useState({ type: 'note', date: today, text: '' })
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // result code from the API
  const dialog = useRef(null)
  const root = useRef(null)

  useEffect(() => {
    const read = () => setSelectedId(decodeURIComponent(window.location.hash.slice(1)) || null)
    read()
    window.addEventListener('popstate', read)
    return () => window.removeEventListener('popstate', read)
  }, [])

  useEffect(() => {
    setResult(null)
    if (selectedId) root.current.scrollIntoView({ block: 'start' })
  }, [selectedId])

  // Astro's router takes over clicks on hash links without a hashchange event, so the island pushes the entry itself.
  const open = (id) => {
    window.history.pushState(null, '', id ? `#${encodeURIComponent(id)}` : window.location.pathname)
    setSelectedId(id)
  }
  const linkTo = (id) => ({
    href: `#${id ? encodeURIComponent(id) : ''}`,
    onClick: (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
      e.preventDefault()
      open(id)
    },
  })

  const run = async (body) => {
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/members/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.contacts) setContacts(data.contacts)
      if (res.status >= 500) console.error(data.message)
      setResult(data.code in copy.results ? data.code : 'error')
      return res.ok ? data : null
    } catch (err) {
      console.error(err)
      setResult('error')
      return null
    } finally {
      setBusy(false)
    }
  }

  const openDialog = (contact) => {
    setResult(null)
    setEditingId(contact?.id ?? null)
    setForm(contact ? Object.fromEntries(Object.keys(EMPTY_CONTACT).map((key) => [key, contact[key]])) : EMPTY_CONTACT)
    setDialogOpen(true)
    dialog.current.showModal()
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const data = await run({ action: 'save', id: editingId, contact: form })
    if (!data) return
    dialog.current.close()
    if (!editingId) open(data.id)
  }

  const handleEntry = async (e) => {
    e.preventDefault()
    if (await run({ action: 'entry', id: selectedId, entry })) setEntry({ type: 'note', date: today, text: '' })
  }

  const handleDelete = async (contact) => {
    if (!window.confirm(fill(copy.confirmDelete, { name: contact.name }))) return
    if (await run({ action: 'delete', id: contact.id })) open(null)
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const toggle = (list, value) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value])

  const visible = filterContacts(contacts, query, flags, dueOnly, today)
  const selected = selectedId && contacts.find((contact) => contact.id === selectedId)
  const resultMessage = result && (
    <p className={ERROR_CODES.includes(result) ? 'form-error' : 'form-success'}>{copy.results[result]}</p>
  )
  const lastEntry = (contact) => contact.entries[0]

  const list = (
    <section aria-labelledby="crm-heading" className="flex flex-col gap-4">
      <h2 id="crm-heading" className="text-display-sm">
        {copy.listHeading} ({contacts.length})
      </h2>
      <div className="overflow-hidden rounded-card border border-border bg-bg">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <SearchField label={copy.search} value={query} onChange={setQuery} />
          <button type="button" className={`${PRIMARY_BUTTON} sm:ml-auto`} onClick={() => openDialog(null)}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            {copy.add}
          </button>
        </div>
        <div role="group" aria-label={copy.filterLabel} className="flex flex-wrap gap-2 border-b border-border p-4">
          <Chip
            pressed={!flags.length && !dueOnly}
            onClick={() => {
              setFlags([])
              setDueOnly(false)
            }}
          >
            {copy.all} <span className="opacity-70">{contacts.length}</span>
          </Chip>
          {CRM_FLAGS.map((flag) => (
            <Chip key={flag} pressed={flags.includes(flag)} onClick={() => setFlags(toggle(flags, flag))}>
              {copy.flags[flag]}{' '}
              <span className="opacity-70">{contacts.filter((contact) => contact.flags.includes(flag)).length}</span>
            </Chip>
          ))}
          <Chip pressed={dueOnly} onClick={() => setDueOnly(!dueOnly)}>
            {copy.due} <span className="opacity-70">{contacts.filter((contact) => isDue(contact, today)).length}</span>
          </Chip>
        </div>

        <div aria-live="polite">
          {!dialogOpen && result && <div className="border-b border-border px-4 py-3">{resultMessage}</div>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] table-auto text-left text-sm">
            <thead className="bg-bg-subtle">
              <tr>
                {['person', 'flags', 'owner', 'last', 'next'].map((column) => (
                  <th key={column} scope="col" className={HEAD}>
                    {copy.columns[column]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((contact) => {
                const last = lastEntry(contact)
                return (
                  <tr key={contact.id} className="relative border-t border-border transition-colors hover:bg-bg-subtle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Initials name={contact.name} />
                        <div className="min-w-0">
                          {/* The link stretches over the whole row, so the row is one click target. */}
                          <a
                            {...linkTo(contact.id)}
                            className="font-medium text-fg after:absolute after:inset-0 after:content-['']"
                          >
                            {contact.name}
                          </a>
                          {subtitle(contact) && <p className="text-fg-muted">{subtitle(contact)}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Flags contact={contact} copy={copy} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-fg-muted">{contact.owner || '–'}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {last ? (
                        <>
                          <span className="text-fg">{formatDay(last.date, locale)}</span>
                          <span className="block text-xs text-fg-muted">{copy.entryTypes[last.type]}</span>
                        </>
                      ) : (
                        <span className="text-fg-muted">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <NextStep contact={contact} copy={copy} locale={locale} today={today} />
                    </td>
                  </tr>
                )
              })}
              {visible.length === 0 && (
                <tr className="border-t border-border">
                  <td colSpan={5} className="px-4 py-10 text-center text-fg-muted">
                    {contacts.length ? copy.empty : copy.emptyAll}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-4 py-3 text-sm text-fg-muted">
          {fill(copy.count, { shown: visible.length, total: contacts.length })}
        </p>
      </div>
    </section>
  )

  const detail = selected && (
    <article aria-labelledby="contact-heading" className="flex flex-col gap-6">
      <a {...linkTo(null)} className="inline-flex items-center gap-2 self-start text-sm text-fg-muted hover:text-fg">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {copy.backToList}
      </a>
      <div className="flex flex-wrap items-start gap-4">
        <Initials name={selected.name} large />
        <div className="min-w-0 flex-1">
          <h2 id="contact-heading" className="text-display-sm">
            {selected.name}
          </h2>
          {subtitle(selected) && <p className="text-fg-muted">{subtitle(selected)}</p>}
          <div className="mt-2 flex flex-wrap gap-1">
            <Flags contact={selected} copy={copy} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={TOOL_BUTTON} onClick={() => openDialog(selected)}>
            <Pencil aria-hidden="true" className="h-4 w-4" />
            {copy.edit}
          </button>
          {selected.mayDelete && (
            <button type="button" className={DANGER_BUTTON} onClick={() => handleDelete(selected)} disabled={busy}>
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              {copy.delete}
            </button>
          )}
        </div>
      </div>

      <div aria-live="polite">{!dialogOpen && resultMessage}</div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="history-heading" className={`${CARD} flex flex-col gap-5`}>
          <h3 id="history-heading" className="text-xl">
            {copy.history}
          </h3>
          <form onSubmit={handleEntry} className="form gap-3 rounded-lg border border-border bg-bg-subtle p-4">
            <p className="field-label">{copy.entry.heading}</p>
            <div className="form-row">
              <div className="field">
                <label htmlFor="entry-type" className="field-label">
                  {copy.entry.type}
                </label>
                <select
                  id="entry-type"
                  className="input"
                  value={entry.type}
                  onChange={(e) => setEntry({ ...entry, type: e.target.value })}
                >
                  {ENTRY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {copy.entryTypes[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="entry-date" className="field-label">
                  {copy.entry.date}
                </label>
                <input
                  id="entry-date"
                  type="date"
                  className="input"
                  required
                  value={entry.date}
                  onChange={(e) => setEntry({ ...entry, date: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="entry-text" className="field-label">
                {copy.entry.text}
              </label>
              <textarea
                id="entry-text"
                className="input"
                required
                maxLength={2000}
                placeholder={copy.entry.placeholder}
                value={entry.text}
                onChange={(e) => setEntry({ ...entry, text: e.target.value })}
              />
            </div>
            <button type="submit" className={`${PRIMARY_BUTTON} self-start`} disabled={busy}>
              {copy.entry.submit}
            </button>
          </form>
          {selected.entries.length ? (
            <ol className="flex flex-col">
              {selected.entries.map((item) => (
                <li key={item.id} className="border-l-2 border-border py-3 pl-4">
                  <p className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                    <span
                      className={`${BADGE} ${item.type === 'done' ? 'border-success text-success' : 'border-border-strong'}`}
                    >
                      {copy.entryTypes[item.type]}
                    </span>
                    {formatDay(item.date, locale)} · {fill(copy.entryBy, { by: item.by })}
                    {item.mayDelete && (
                      <button
                        type="button"
                        className="ml-auto rounded-md border-0 p-1 text-fg-muted hover:text-danger"
                        aria-label={copy.removeEntry}
                        disabled={busy}
                        onClick={() =>
                          window.confirm(copy.confirmRemoveEntry) &&
                          run({ action: 'removeEntry', id: selected.id, entryId: item.id })
                        }
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </button>
                    )}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-fg">{item.text}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-fg-muted">{copy.noHistory}</p>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <section aria-labelledby="next-heading" className={`${CARD} flex flex-col gap-3`}>
            <h3 id="next-heading" className="text-xs font-medium uppercase tracking-wider text-fg-muted">
              {copy.nextStep}
            </h3>
            {selected.nextStep ? (
              <>
                <p>
                  <NextStep contact={selected} copy={copy} locale={locale} today={today} />
                </p>
                {selected.owner && <p className="text-sm text-fg-muted">{selected.owner}</p>}
                <button
                  type="button"
                  className={`${TOOL_BUTTON} self-start`}
                  disabled={busy}
                  onClick={() => run({ action: 'done', id: selected.id })}
                >
                  <Check aria-hidden="true" className="h-4 w-4" />
                  {copy.markDone}
                </button>
              </>
            ) : (
              <p className="text-sm text-fg-muted">{copy.noNextStep}</p>
            )}
          </section>
          <section aria-labelledby="details-heading" className={CARD}>
            <h3 id="details-heading" className="mb-3 text-xs font-medium uppercase tracking-wider text-fg-muted">
              {copy.details}
            </h3>
            <dl className="flex flex-col gap-3 text-sm">
              {[
                ['email', selected.email && <a href={`mailto:${selected.email}`}>{selected.email}</a>],
                [
                  'phone',
                  selected.phone && <a href={`tel:${selected.phone.replace(/[^\d+]/g, '')}`}>{selected.phone}</a>,
                ],
                [
                  'linkedin',
                  selected.linkedin && (
                    <a
                      href={selected.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1"
                    >
                      {selected.linkedin.replace(/^https:\/\/(www\.)?/, '')}
                      <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                    </a>
                  ),
                ],
                ['owner', selected.owner],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt className="text-fg-muted">{copy.form[key]}</dt>
                  <dd className="break-words text-fg [&_a]:underline [&_a]:underline-offset-2">{value || '–'}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section aria-labelledby="source-heading" className={CARD}>
            <h3 id="source-heading" className="mb-2 text-xs font-medium uppercase tracking-wider text-fg-muted">
              {copy.source}
            </h3>
            <p className="whitespace-pre-line text-sm">{selected.source}</p>
            <p className="mt-3 text-xs text-fg-muted">{fill(copy.createdBy, { by: selected.createdBy })}</p>
          </section>
        </aside>
      </div>
    </article>
  )

  return (
    <div ref={root} className="scroll-mt-32">
      {detail || list}

      <FormDialog
        dialogRef={dialog}
        id="contact-form-heading"
        heading={editingId ? copy.form.editHeading : copy.form.addHeading}
        closeLabel={copy.close}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSave}
      >
        <div className="form-row">
          <Field id="contact-name" label={copy.form.name}>
            <input
              id="contact-name"
              className="input"
              required
              maxLength={100}
              value={form.name}
              onChange={set('name')}
            />
          </Field>
          <Field id="contact-organization" label={copy.form.organization}>
            <input
              id="contact-organization"
              className="input"
              maxLength={120}
              value={form.organization}
              onChange={set('organization')}
            />
          </Field>
        </div>
        <div className="form-row">
          <Field id="contact-role" label={copy.form.role}>
            <input id="contact-role" className="input" maxLength={120} value={form.role} onChange={set('role')} />
          </Field>
          <Field id="contact-owner" label={copy.form.owner}>
            <input id="contact-owner" className="input" maxLength={100} value={form.owner} onChange={set('owner')} />
          </Field>
        </div>
        <fieldset className="fieldset gap-2">
          <legend className="field-label mb-2">{copy.form.flags}</legend>
          <div className="flex flex-wrap gap-2">
            {CRM_FLAGS.map((flag) => (
              <Chip
                key={flag}
                pressed={form.flags.includes(flag)}
                onClick={() => setForm({ ...form, flags: toggle(form.flags, flag) })}
              >
                {copy.flags[flag]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <div className="form-row">
          <Field id="contact-email" label={copy.form.email}>
            <input id="contact-email" type="email" className="input" value={form.email} onChange={set('email')} />
          </Field>
          <Field id="contact-phone" label={copy.form.phone}>
            <input
              id="contact-phone"
              type="tel"
              className="input"
              maxLength={40}
              value={form.phone}
              onChange={set('phone')}
            />
          </Field>
        </div>
        <Field id="contact-linkedin" label={copy.form.linkedin}>
          <input
            id="contact-linkedin"
            className="input"
            maxLength={300}
            placeholder={copy.form.linkedinPlaceholder}
            value={form.linkedin}
            onChange={set('linkedin')}
          />
        </Field>
        <div className="form-row">
          <Field id="contact-next" label={copy.form.nextStep}>
            <input
              id="contact-next"
              className="input"
              maxLength={300}
              value={form.nextStep}
              onChange={set('nextStep')}
            />
          </Field>
          <Field id="contact-due" label={copy.form.nextDue}>
            <input id="contact-due" type="date" className="input" value={form.nextDue} onChange={set('nextDue')} />
          </Field>
        </div>
        <Field id="contact-source" label={copy.form.source} hint={copy.form.sourceHint}>
          <textarea
            id="contact-source"
            className="input min-h-24"
            required
            maxLength={500}
            aria-describedby="contact-source-hint"
            value={form.source}
            onChange={set('source')}
          />
        </Field>
        <div aria-live="polite">{dialogOpen && resultMessage}</div>
        <button type="submit" className="form-submit" disabled={busy}>
          {busy ? copy.form.busy : copy.form.save}
        </button>
      </FormDialog>
    </div>
  )
}
