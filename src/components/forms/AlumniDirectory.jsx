/**
 * The alumni network of the members area (React island): search, filter chips in three groups (help, industry,
 * status; one match per group, every group must match), a card per alumni profile and a dialog to add or edit a
 * profile, which requires the person's consent. Posts { action, id?, alumni? } to /api/members/alumni and shows the
 * list the API returns after each action.
 * Props: copy (memberArea.alumni.directory), initialAlumni (alumniSummary objects).
 * Styles: ./forms.css plus Tailwind utilities.
 */
import React, { useRef, useState } from 'react'
import { ExternalLink, Mail, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { ALUMNI_HELP, ALUMNI_INDUSTRIES, ALUMNI_STATUS, filterAlumni } from '../../lib/contacts'
import { BADGE, Chip, Field, fill, FormDialog, Initials, PRIMARY_BUTTON, SearchField } from './memberUi'
import './forms.css'

const ERROR_CODES = ['invalid', 'unknown', 'forbidden', 'error']
const NO_FILTERS = { help: [], industry: [], status: [] }
const EMPTY_PROFILE = {
  name: '',
  now: '',
  igniteFrom: '',
  igniteTo: '',
  city: '',
  industry: '',
  status: '',
  help: [],
  about: '',
  linkedin: '',
  email: '',
  open: true,
  consent: false,
}
const GROUPS = [
  ['help', ALUMNI_HELP, 'help'],
  ['industry', ALUMNI_INDUSTRIES, 'industries'],
  ['status', ALUMNI_STATUS, 'statuses'],
]
const LINK = 'inline-flex items-center gap-1.5 text-sm font-medium text-fg underline-offset-4 hover:underline'

const years = ({ igniteFrom, igniteTo }) =>
  igniteFrom && igniteTo && igniteFrom !== igniteTo ? `${igniteFrom}–${igniteTo}` : String(igniteFrom || igniteTo || '')

export default function AlumniDirectory({ copy, initialAlumni }) {
  const [alumni, setAlumni] = useState(initialAlumni)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(NO_FILTERS)
  const [form, setForm] = useState(EMPTY_PROFILE)
  const [editingId, setEditingId] = useState(null) // null while adding
  const [dialogOpen, setDialogOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // result code from the API
  const dialog = useRef(null)

  const run = async (body) => {
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/members/alumni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.alumni) setAlumni(data.alumni)
      if (res.status >= 500) console.error(data.message)
      setResult(data.code in copy.results ? data.code : 'error')
      return res.ok
    } catch (err) {
      console.error(err)
      setResult('error')
      return false
    } finally {
      setBusy(false)
    }
  }

  const openDialog = (person) => {
    setResult(null)
    setEditingId(person?.id ?? null)
    setForm(
      person
        ? {
            ...Object.fromEntries(Object.keys(EMPTY_PROFILE).map((key) => [key, person[key] ?? ''])),
            igniteFrom: person.igniteFrom ?? '',
            igniteTo: person.igniteTo ?? '',
            open: person.open,
            // The profile exists, so the consent was recorded when it was added.
            consent: true,
          }
        : EMPTY_PROFILE,
    )
    setDialogOpen(true)
    dialog.current.showModal()
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (await run({ action: 'save', id: editingId, alumni: form })) dialog.current.close()
  }

  const handleDelete = (person) => {
    if (window.confirm(fill(copy.confirmDelete, { name: person.name }))) run({ action: 'delete', id: person.id })
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const toggle = (list, value) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value])

  const visible = filterAlumni(alumni, query, filters)
  const filtering = query.trim() || Object.values(filters).some((list) => list.length)
  const resultMessage = result && (
    <p className={ERROR_CODES.includes(result) ? 'form-error' : 'form-success'}>{copy.results[result]}</p>
  )

  return (
    <section aria-labelledby="alumni-heading" className="flex flex-col gap-4">
      <h2 id="alumni-heading" className="sr-only">
        {copy.heading}
      </h2>
      <div className="flex flex-col gap-5 rounded-card border border-border bg-bg p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <SearchField label={copy.search} value={query} onChange={setQuery} />
          <button type="button" className={`${PRIMARY_BUTTON} sm:ml-auto`} onClick={() => openDialog(null)}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            {copy.add}
          </button>
        </div>
        {GROUPS.map(([group, values, labels]) => (
          <div key={group} role="group" aria-labelledby={`alumni-group-${group}`} className="flex flex-col gap-2">
            <p id={`alumni-group-${group}`} className="text-xs font-medium uppercase tracking-wider text-fg-muted">
              {copy.groups[group]}
            </p>
            <div className="flex flex-wrap gap-2">
              {values.map((value) => (
                <Chip
                  key={value}
                  pressed={filters[group].includes(value)}
                  onClick={() => setFilters({ ...filters, [group]: toggle(filters[group], value) })}
                >
                  {copy[labels][value]}
                </Chip>
              ))}
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-fg-muted">
          <p aria-live="polite">{fill(copy.count, { shown: visible.length, total: alumni.length })}</p>
          {filtering && (
            <button
              type="button"
              className="border-0 p-0 text-sm font-medium text-fg underline underline-offset-4"
              onClick={() => {
                setQuery('')
                setFilters(NO_FILTERS)
              }}
            >
              {copy.reset}
            </button>
          )}
        </div>
      </div>

      <div aria-live="polite">{!dialogOpen && resultMessage}</div>

      {visible.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((person) => (
            <li key={person.id} className="flex flex-col gap-4 rounded-card border border-border bg-bg p-5">
              <div className="flex items-start gap-3">
                <Initials name={person.name} />
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-medium leading-tight">{person.name}</h3>
                  {person.now && <p className="text-sm text-fg-muted">{person.now}</p>}
                </div>
              </div>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
                {years(person) && <span>{fill(copy.years, { years: years(person) })}</span>}
                {person.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                    {person.city}
                  </span>
                )}
                {person.industry && <span>{copy.industries[person.industry]}</span>}
                {person.status && <span>{copy.statuses[person.status]}</span>}
              </p>
              {person.help.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-fg-muted">{copy.helpsWith}</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {person.help.map((help) => (
                      <li key={help} className={`${BADGE} border-border-strong text-fg`}>
                        {copy.help[help]}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {person.about && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium">{copy.more}</summary>
                  <p className="mt-2 whitespace-pre-line text-fg-muted">{person.about}</p>
                </details>
              )}
              <p className="mt-auto flex items-center gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${person.open ? 'bg-success' : 'bg-border-strong'}`}
                />
                <span className={person.open ? 'text-fg' : 'text-fg-muted'}>
                  {person.open ? copy.open : copy.closed}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4">
                {/* The API only stores https LinkedIn URLs (parseAlumni); the check keeps any other scheme out of href. */}
                {person.linkedin.startsWith('https://') && (
                  <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className={LINK}>
                    <ExternalLink aria-hidden="true" className="h-4 w-4" />
                    {copy.linkedin}
                  </a>
                )}
                {person.open && person.email && (
                  <a href={`mailto:${person.email}`} className={LINK}>
                    <Mail aria-hidden="true" className="h-4 w-4" />
                    {copy.mail}
                  </a>
                )}
                <span className="ml-auto flex gap-1">
                  <button
                    type="button"
                    className="rounded-md border-0 p-2 text-fg-muted hover:bg-bg-subtle hover:text-fg"
                    aria-label={`${copy.edit}: ${person.name}`}
                    onClick={() => openDialog(person)}
                  >
                    <Pencil aria-hidden="true" className="h-4 w-4" />
                  </button>
                  {person.mayDelete && (
                    <button
                      type="button"
                      className="rounded-md border-0 p-2 text-fg-muted hover:bg-bg-subtle hover:text-danger"
                      aria-label={`${copy.delete}: ${person.name}`}
                      disabled={busy}
                      onClick={() => handleDelete(person)}
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  )}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-card border border-border bg-bg px-4 py-10 text-center text-fg-muted">
          {alumni.length ? copy.empty : copy.emptyAll}
        </p>
      )}

      <p className="text-sm text-fg-muted">{copy.note}</p>

      <FormDialog
        dialogRef={dialog}
        id="alumni-form-heading"
        heading={editingId ? copy.form.editHeading : copy.form.addHeading}
        closeLabel={copy.close}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSave}
      >
        <div className="form-row">
          <Field id="alumni-name" label={copy.form.name}>
            <input
              id="alumni-name"
              className="input"
              required
              maxLength={100}
              value={form.name}
              onChange={set('name')}
            />
          </Field>
          <Field id="alumni-now" label={copy.form.now}>
            <input
              id="alumni-now"
              className="input"
              maxLength={120}
              placeholder={copy.form.nowPlaceholder}
              value={form.now}
              onChange={set('now')}
            />
          </Field>
        </div>
        <div className="form-row">
          <div className="form-row">
            <Field id="alumni-from" label={copy.form.from}>
              <input
                id="alumni-from"
                type="number"
                min="2000"
                max="2100"
                className="input"
                value={form.igniteFrom}
                onChange={set('igniteFrom')}
              />
            </Field>
            <Field id="alumni-to" label={copy.form.to}>
              <input
                id="alumni-to"
                type="number"
                min="2000"
                max="2100"
                className="input"
                value={form.igniteTo}
                onChange={set('igniteTo')}
              />
            </Field>
          </div>
          <Field id="alumni-city" label={copy.form.city}>
            <input id="alumni-city" className="input" maxLength={80} value={form.city} onChange={set('city')} />
          </Field>
        </div>
        <div className="form-row">
          <Field id="alumni-industry" label={copy.form.industry}>
            <select id="alumni-industry" className="input" value={form.industry} onChange={set('industry')}>
              <option value="">{copy.form.none}</option>
              {ALUMNI_INDUSTRIES.map((value) => (
                <option key={value} value={value}>
                  {copy.industries[value]}
                </option>
              ))}
            </select>
          </Field>
          <Field id="alumni-status" label={copy.form.status}>
            <select id="alumni-status" className="input" value={form.status} onChange={set('status')}>
              <option value="">{copy.form.none}</option>
              {ALUMNI_STATUS.map((value) => (
                <option key={value} value={value}>
                  {copy.statuses[value]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <fieldset className="fieldset gap-2">
          <legend className="field-label mb-2">{copy.form.help}</legend>
          <div className="flex flex-wrap gap-2">
            {ALUMNI_HELP.map((help) => (
              <Chip
                key={help}
                pressed={form.help.includes(help)}
                onClick={() => setForm({ ...form, help: toggle(form.help, help) })}
              >
                {copy.help[help]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <Field id="alumni-about" label={copy.form.about}>
          <textarea
            id="alumni-about"
            className="input min-h-24"
            maxLength={600}
            value={form.about}
            onChange={set('about')}
          />
        </Field>
        <div className="form-row">
          <Field id="alumni-linkedin" label={copy.form.linkedin}>
            <input
              id="alumni-linkedin"
              className="input"
              maxLength={300}
              placeholder={copy.form.linkedinPlaceholder}
              value={form.linkedin}
              onChange={set('linkedin')}
            />
          </Field>
          <Field id="alumni-email" label={copy.form.email} hint={copy.form.emailHint}>
            <input
              id="alumni-email"
              type="email"
              className="input"
              aria-describedby="alumni-email-hint"
              value={form.email}
              onChange={set('email')}
            />
          </Field>
        </div>
        <label className="choice">
          <input type="checkbox" checked={form.open} onChange={(e) => setForm({ ...form, open: e.target.checked })} />
          {copy.form.open}
        </label>
        <label className="choice">
          <input
            type="checkbox"
            required
            checked={form.consent}
            onChange={(e) => setForm({ ...form, consent: e.target.checked })}
          />
          {copy.form.consent}
        </label>
        <div aria-live="polite">{dialogOpen && resultMessage}</div>
        <button type="submit" className="form-submit" disabled={busy}>
          {busy ? copy.form.busy : copy.form.save}
        </button>
      </FormDialog>
    </section>
  )
}
