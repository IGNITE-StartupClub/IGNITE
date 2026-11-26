/**
 * Organisations in the Netzwerk: the card of the overview, the window with the cooperation text and the people of the
 * organisation, and the form to add or change one. Partners from the former partner tab live here now, their offer
 * for IGNITE members is the cooperation text.
 * Exports: OrgCard, OrgBody, OrgForm, TagAdmin (the admins' dialog to rename, merge and delete tags).
 */
import React, { useId, useMemo, useState } from 'react'
import { Building2, ExternalLink, Plus } from 'lucide-react'
import { RELATIONS, TAG_CATEGORIES } from '../../../lib/network'
import { changedFields } from '../../../lib/liveUpdates'
import { DANGER_BUTTON, Field, fill, FormDialog, PRIMARY_BUTTON, TOOL_BUTTON } from '../memberUi'
import { Avatar, SECTION_HEADING, SOFT_BADGE, TagPicker } from './networkUi'

export function OrgCard({ org, count, copy, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(org.id)}
      className="flex h-full w-full flex-col gap-3 rounded-card border border-border bg-bg p-4 text-left transition-colors hover:border-border-strong hover:bg-bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <span className="flex items-start gap-3">
        <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border-strong bg-bg-subtle text-fg-muted">
          <Building2 className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium">{org.name}</span>
          {org.city && <span className="block truncate text-sm text-fg-muted">{org.city}</span>}
        </span>
      </span>
      {org.relations.length > 0 && (
        <span className="flex flex-wrap gap-1.5">
          {org.relations.map((relation) => (
            <span key={relation} className={SOFT_BADGE}>
              {copy.relations[relation]}
            </span>
          ))}
        </span>
      )}
      <span className="mt-auto text-xs text-fg-subtle">{count === 1 ? copy.org.onePerson : fill(copy.org.peopleCount, { count })}</span>
    </button>
  )
}

/** The window of an organisation: what it is, the cooperation, its people. */
export function OrgBody({ org, people, ctx, headingId, onEdit, onAddPerson }) {
  const { copy, lookups, run, busy, viewer } = ctx
  const o = copy.org
  const tags = org.tags.map((id) => lookups.tags[id]).filter(Boolean)
  return (
    <article>
      <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
        <div className="min-w-0">
          <h2 id={headingId} className="text-[24px] font-semibold leading-tight hyphens-none">
            {org.name}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {org.relations.map((relation) => (
              <span key={relation} className={SOFT_BADGE}>
                {copy.relations[relation]}
              </span>
            ))}
            {org.city && <span className="text-sm text-fg-muted">{org.city}</span>}
          </div>
        </div>
        {org.website && (
          <a href={org.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-accent-text">
            {o.website}
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
          </a>
        )}
      </div>

      {(org.partnership || org.partnerSince || org.partnershipUrl) && (
        <section className="mt-5 rounded-card border border-border bg-bg-subtle p-4">
          <h3 className={SECTION_HEADING}>{o.partnership}</h3>
          {org.partnerSince && <p className="mt-1 text-xs text-fg-muted">{fill(o.partnerSince, { year: org.partnerSince })}</p>}
          {org.partnership && <p className="mt-2 whitespace-pre-line text-sm">{org.partnership}</p>}
          {org.partnershipUrl && (
            <a href={org.partnershipUrl} target="_blank" rel="noopener noreferrer" className={`${PRIMARY_BUTTON} mt-3 no-underline`}>
              {o.partnershipLink}
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          )}
        </section>
      )}

      {org.about && (
        <section className="mt-5">
          <h3 className={SECTION_HEADING}>{o.about}</h3>
          <p className="mt-1.5 whitespace-pre-line text-sm">{org.about}</p>
        </section>
      )}

      {tags.length > 0 && (
        <ul className="m-0 mt-4 flex list-none flex-wrap gap-1.5 p-0">
          {tags.map((tag) => (
            <li key={tag.id} className={SOFT_BADGE}>
              {tag.label}
            </li>
          ))}
        </ul>
      )}

      <section className="mt-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className={SECTION_HEADING}>{o.people}</h3>
          {viewer.position !== 'alumni' && (
            <button type="button" className={TOOL_BUTTON} onClick={onAddPerson}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              {o.addPerson}
            </button>
          )}
        </div>
        {people.length ? (
          <ul className="m-0 mt-2 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
            {people.map((person) => (
              <li key={person.id}>
                <button
                  type="button"
                  onClick={() => ctx.onOpenPerson(person.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border p-2.5 text-left hover:bg-bg-subtle"
                >
                  <Avatar name={person.name} photo={person.photo} size={36} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{person.name}</span>
                    {person.headline && <span className="block truncate text-xs text-fg-muted">{person.headline}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-fg-muted">{o.noPeople}</p>
        )}
      </section>

      <footer className="mt-6 flex flex-wrap gap-2 border-0 border-t border-solid border-border pt-3">
        {org.mayEdit && (
          <button type="button" className={TOOL_BUTTON} onClick={onEdit}>
            {copy.profile.edit}
          </button>
        )}
        {org.mayDelete && (
          <button
            type="button"
            className={DANGER_BUTTON}
            disabled={busy}
            onClick={() => window.confirm(fill(o.confirmDelete, { name: org.name })) && run({ action: 'deleteOrg', id: org.id }, { closeOrg: true })}
          >
            {copy.profile.delete}
          </button>
        )}
      </footer>
    </article>
  )
}

const EMPTY_ORG = { name: '', relations: [], website: '', city: '', about: '', partnership: '', partnershipUrl: '', partnerSince: '', tags: [] }

export function OrgForm({ dialogRef, org, ctx, onClose, onSaved }) {
  const { copy, run, busy, tags } = ctx
  const f = copy.form
  const id = useId()
  const opened = useMemo(
    () => (org ? Object.fromEntries(Object.keys(EMPTY_ORG).map((key) => [key, key === 'partnerSince' ? (org.partnerSince ?? '') : org[key]])) : EMPTY_ORG),
    [org],
  )
  const [values, setValues] = useState(opened)
  const [error, setError] = useState('')
  const set = (key) => (e) => setValues({ ...values, [key]: e.target.value })
  const dirty = JSON.stringify(values) !== JSON.stringify(opened)
  const toPayload = (form) => ({ ...form, partnerSince: form.partnerSince === '' ? null : Number(form.partnerSince) })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const fields = org ? changedFields(toPayload(opened), toPayload(values)) : toPayload(values)
    if (!Object.keys(fields).length) return dialogRef.current.close()
    const data = await run({ action: 'saveOrg', id: org?.id, org: fields }, { onError: setError })
    if (!data) return
    dialogRef.current.close()
    onSaved(data.id ?? org?.id)
  }

  return (
    <FormDialog
      dialogRef={dialogRef}
      id={`${id}-heading`}
      heading={org ? f.orgHeading : f.orgAddHeading}
      closeLabel={copy.profile.close}
      onClose={onClose}
      onSubmit={handleSubmit}
      dirty={dirty}
      discard={copy.discard}
    >
      <div className="flex max-h-[min(70vh,44rem)] flex-col gap-4 overflow-y-auto pr-1">
        <Field id={`${id}-name`} label={f.orgName}>
          <input id={`${id}-name`} className="input" required maxLength={120} value={values.name} onChange={set('name')} />
        </Field>
        <div className="field">
          <span className="field-label">{f.relations}</span>
          <div className="flex flex-wrap gap-1.5">
            {RELATIONS.map((relation) => {
              const pressed = values.relations.includes(relation)
              return (
                <button
                  key={relation}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => setValues({ ...values, relations: pressed ? values.relations.filter((item) => item !== relation) : [...values.relations, relation] })}
                  className={`inline-flex h-8 items-center rounded-full border px-3 text-sm ${pressed ? 'border-fg bg-fg text-bg' : 'border-border-strong text-fg hover:bg-bg-subtle'}`}
                >
                  {copy.relations[relation]}
                </button>
              )
            })}
          </div>
        </div>
        <div className="form-row">
          <Field id={`${id}-website`} label={f.website}>
            <input id={`${id}-website`} className="input" maxLength={300} value={values.website} onChange={set('website')} />
          </Field>
          <Field id={`${id}-city`} label={f.city}>
            <input id={`${id}-city`} className="input" maxLength={80} value={values.city} onChange={set('city')} />
          </Field>
        </div>
        <Field id={`${id}-about`} label={f.orgAbout}>
          <textarea id={`${id}-about`} className="input min-h-[5rem]" rows={3} maxLength={1000} value={values.about} onChange={set('about')} />
        </Field>
        <div className="field">
          <span className="field-label">{copy.tagCategories.industries}</span>
          <TagPicker
            category="industries"
            categoryLabel={copy.tagCategories.industries}
            tags={tags}
            value={values.tags}
            onChange={(chosen) => setValues({ ...values, tags: chosen })}
            onCreate={async (label) => (await run({ action: 'tag', tag: { category: 'industries', label } }, { quiet: true }))?.id ?? null}
            copy={f.tagPicker}
          />
        </div>
        <fieldset className="fieldset gap-4 border-0 border-t border-solid border-border pt-4">
          <legend className={`${SECTION_HEADING} float-left mb-1 w-full`}>{copy.org.partnership}</legend>
          <Field id={`${id}-partnership`} label={f.partnership} hint={f.partnershipHint}>
            <textarea id={`${id}-partnership`} className="input min-h-[6rem]" rows={4} maxLength={2000} value={values.partnership} onChange={set('partnership')} />
          </Field>
          <div className="form-row">
            <Field id={`${id}-partnershipUrl`} label={f.partnershipUrl}>
              <input id={`${id}-partnershipUrl`} className="input" maxLength={300} value={values.partnershipUrl} onChange={set('partnershipUrl')} />
            </Field>
            <Field id={`${id}-partnerSince`} label={f.partnerSince}>
              <input id={`${id}-partnerSince`} type="number" min="2000" max="2100" className="input" value={values.partnerSince} onChange={set('partnerSince')} />
            </Field>
          </div>
        </fieldset>
      </div>
      {error && <p className="form-error">{copy.results[error] ?? copy.results.error}</p>}
      <div className="flex flex-wrap justify-end gap-2 border-0 border-t border-solid border-border pt-4">
        <button type="button" className={TOOL_BUTTON} onClick={() => dialogRef.current.close()}>
          {f.cancel}
        </button>
        <button type="submit" className={PRIMARY_BUTTON} disabled={busy}>
          {busy ? f.busy : org ? f.save : f.create}
        </button>
      </div>
    </FormDialog>
  )
}

/** Admins only: every tag of the pool with how often it is used, to rename, merge or delete. */
export function TagAdmin({ dialogRef, ctx, usage }) {
  const { copy, tags, run, busy } = ctx
  const t = copy.tagsAdmin
  const id = useId()
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-heading`}
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      className="w-[min(44rem,calc(100vw-2rem))] rounded-card border border-border bg-bg p-6 text-fg backdrop:bg-black/60"
    >
      <h2 id={`${id}-heading`} className="text-display-sm">
        {t.heading}
      </h2>
      <p className="mt-1 text-sm text-fg-muted">{t.text}</p>
      <div className="mt-4 flex max-h-[60vh] flex-col gap-5 overflow-y-auto">
        {TAG_CATEGORIES.map((category) => {
          const list = tags.filter((tag) => tag.category === category)
          return (
            <section key={category}>
              <h3 className={SECTION_HEADING}>{copy.tagCategories[category]}</h3>
              <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
                {list.map((tag) => (
                  <li key={tag.id} className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-1 hover:bg-bg-subtle">
                    <span className="min-w-0 flex-1 text-sm">
                      {tag.label} <span className="text-xs text-fg-muted">({usage[tag.id] ?? 0})</span>
                    </span>
                    <button
                      type="button"
                      className="rounded-md border-0 px-2 py-1 text-xs text-fg-muted hover:text-fg"
                      disabled={busy}
                      onClick={() => {
                        const label = window.prompt(t.promptRename, tag.label)
                        if (label && label.trim() !== tag.label) run({ action: 'renameTag', id: tag.id, label })
                      }}
                    >
                      {t.rename}
                    </button>
                    <select
                      aria-label={`${t.merge} ${tag.label}`}
                      value=""
                      disabled={busy || list.length < 2}
                      className="h-8 rounded-md border border-border-strong bg-bg-subtle px-1 text-xs"
                      onChange={(e) => {
                        const into = list.find((item) => item.id === e.target.value)
                        if (into && window.confirm(fill(t.confirmMerge, { label: tag.label, into: into.label }))) run({ action: 'mergeTag', id: tag.id, into: into.id })
                      }}
                    >
                      <option value="">{t.merge}</option>
                      {list
                        .filter((item) => item.id !== tag.id)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      className="rounded-md border-0 px-2 py-1 text-xs text-danger"
                      disabled={busy}
                      onClick={() => window.confirm(fill(t.confirmDelete, { label: tag.label })) && run({ action: 'deleteTag', id: tag.id })}
                    >
                      {t.delete}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
      <div className="mt-5 flex justify-end">
        <button type="button" className={PRIMARY_BUTTON} onClick={() => dialogRef.current.close()}>
          {t.close}
        </button>
      </div>
    </dialog>
  )
}
