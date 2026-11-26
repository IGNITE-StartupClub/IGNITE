/**
 * The form of a person in the Netzwerk, in a modal dialog (FormDialog): a member's own profile (concept slide 4: IGNITE,
 * studies, tag dropdowns, the "Freundebuch" questions, contact), an alumnus (slide 11: base profile, contact, optional
 * further information, each with its visibility) or an external contact (organisation, relationship, contact data with
 * a visibility per field, where we know them from, who looks after them, the next step). Every kind can name through
 * whom the contact came about and record consent to the public website. Saving sends only the changed fields.
 * Fields the editor may not see come empty and stay locked, the server ignores them anyway.
 * Props: dialogRef, person (personSummary or null when adding), kind ('member' | 'alumni' | 'external' or null when
 * adding), ctx (see NetworkDirectory), initialOrg (organisation id when adding from an organisation), onClose, onSaved(id).
 */
import React, { useId, useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { levelsFor, OPEN_FOR, QUESTIONS, RELATIONS, VISIBILITY_FIELDS } from '../../../lib/network'
import { changedFields } from '../../../lib/liveUpdates'
import { Field, fill, FormDialog, PRIMARY_BUTTON, TOOL_BUTTON } from '../memberUi'
import PhotoCropper from '../PhotoCropper.jsx'
import { LevelSelect, PersonPicker, SECTION_HEADING, TagPicker } from './networkUi'

const EMPTY = {
  firstName: '',
  lastName: '',
  headline: '',
  organizationId: '',
  city: '',
  tags: [],
  team: '',
  memberSince: '',
  major: '',
  minor: '',
  semester: '',
  answers: {},
  email: '',
  phone: '',
  linkedin: '',
  instagram: '',
  website: '',
  igniteFrom: '',
  igniteTo: '',
  igniteRole: '',
  engagement: '',
  about: '',
  career: [],
  openFor: [],
  seeking: '',
  relations: [],
  source: '',
  introducedBy: '',
  introducedOn: '',
  owners: [],
  nextStep: '',
  nextDue: '',
  vis: {},
}

/** The fields a kind's form shows, in the order of FIELDS_OF in network.ts. */
const FORM_FIELDS = {
  member: ['firstName', 'lastName', 'team', 'memberSince', 'major', 'minor', 'semester', 'tags', 'answers', 'instagram', 'linkedin', 'email', 'phone', 'introducedBy', 'introducedOn', 'vis'],
  alumni: ['firstName', 'lastName', 'headline', 'organizationId', 'igniteFrom', 'igniteTo', 'igniteRole', 'engagement', 'city', 'linkedin', 'email', 'phone', 'about', 'tags', 'major', 'career', 'openFor', 'seeking', 'answers', 'introducedBy', 'introducedOn', 'vis'],
  external: ['firstName', 'lastName', 'headline', 'organizationId', 'relations', 'tags', 'email', 'phone', 'linkedin', 'website', 'city', 'about', 'source', 'introducedBy', 'introducedOn', 'owners', 'nextStep', 'nextDue', 'vis'],
}

const pick = (object, keys) => Object.fromEntries(keys.map((key) => [key, object[key]]))

/** The form values of a person: numbers as strings for the inputs, everything present. */
function formOf(person, kind) {
  const values = { ...EMPTY, ...(person ?? {}) }
  for (const key of ['semester', 'igniteFrom', 'igniteTo']) values[key] = values[key] == null ? '' : String(values[key])
  values.answers = { ...(person?.answers ?? {}) }
  values.vis = { ...(person?.vis ?? {}) }
  return pick(values, FORM_FIELDS[kind])
}

/** What goes to the server: empty numbers as null, the answers whole. */
function payload(values) {
  const result = { ...values }
  for (const key of ['semester', 'igniteFrom', 'igniteTo']) if (key in result) result[key] = result[key] === '' ? null : Number(result[key])
  return result
}

const toggle = (list, value) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value])

function Group({ title, hint, children }) {
  return (
    <fieldset className="fieldset gap-4 border-0 border-t border-solid border-border pt-5 first-of-type:border-t-0 first-of-type:pt-0">
      <legend className={`${SECTION_HEADING} float-left mb-1 w-full`}>{title}</legend>
      {hint && <p className="form-note -mt-2">{hint}</p>}
      {children}
    </fieldset>
  )
}

export default function PersonForm({ dialogRef, person, kind: givenKind, ctx, initialOrg = '', onClose, onSaved }) {
  const { copy, lookups, viewer, run, busy, tags, people, orgs, teams } = ctx
  const f = copy.form
  const id = useId()
  const adding = !person
  const [newKind, setNewKind] = useState('external')
  const kind = person?.kind ?? givenKind ?? newKind
  const opened = useMemo(() => formOf(person ?? (adding ? { organizationId: initialOrg } : null), kind), [person, kind, adding, initialOrg])
  const [values, setValues] = useState(opened)
  const [listed, setListed] = useState(false)
  const [consent, setConsent] = useState(!!person?.consent)
  const [consentNote, setConsentNote] = useState(person?.consent?.note ?? '')
  const [newOrg, setNewOrg] = useState(null) // name while adding an organisation inline
  const [error, setError] = useState('')
  const [photo, setPhoto] = useState(person?.photo ?? '')

  // A new kind while adding starts the form over with that kind's fields.
  const [shownKind, setShownKind] = useState(kind)
  if (shownKind !== kind) {
    setShownKind(kind)
    setValues(formOf(adding ? { organizationId: initialOrg } : person, kind))
  }

  const own = person?.self
  const locked = person?.locked ?? {}
  const isLocked = (field) => !!locked[field]
  const set = (key) => (e) => setValues({ ...values, [key]: e.target.value })
  const setValue = (key, value) => setValues({ ...values, [key]: value })
  const showVis = kind !== 'member'
  const vis = (field) => values.vis?.[field] ?? 'members'
  const setVis = (field, level) => setValues({ ...values, vis: { ...values.vis, [field]: level } })
  const fieldLabel = (field) => f[field] ?? f.publicFieldNames[field] ?? field

  const consentChanged = consent !== !!person?.consent || (consent && consentNote !== (person?.consent?.note ?? ''))
  const dirty = JSON.stringify(values) !== JSON.stringify(opened) || consentChanged || (adding && listed)

  /** One input with its visibility select beside it, for alumni and contacts. */
  const withVis = (field, input) => (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">{input}</div>
      {showVis && VISIBILITY_FIELDS.includes(field) && (
        <LevelSelect
          label={fill(f.visibilityOf, { field: fieldLabel(field) })}
          value={vis(field)}
          levels={levelsFor(field)}
          onChange={(level) => setVis(field, level)}
          copy={copy}
          disabled={isLocked(field)}
        />
      )}
    </div>
  )

  const text = (field, { type = 'text', placeholder, maxLength = 120, required = false, label } = {}) => (
    <Field id={`${id}-${field}`} label={label ?? f[field]} hint={isLocked(field) ? copy.locked[locked[field]] : undefined}>
      {withVis(
        field,
        <input
          id={`${id}-${field}`}
          type={type}
          className="input"
          value={values[field]}
          onChange={set(field)}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          disabled={isLocked(field)}
        />,
      )}
    </Field>
  )

  const area = (field, { label, maxLength = 1000, rows = 3 } = {}) => (
    <Field id={`${id}-${field}`} label={label ?? f[field]} hint={isLocked(field) ? copy.locked[locked[field]] : undefined}>
      {withVis(
        field,
        <textarea id={`${id}-${field}`} className="input min-h-[5rem]" rows={rows} maxLength={maxLength} value={values[field]} onChange={set(field)} disabled={isLocked(field)} />,
      )}
    </Field>
  )

  const createTag = async (category, label) => {
    const data = await run({ action: 'tag', tag: { category, label } }, { quiet: true })
    return data?.id ?? null
  }

  const tagPicker = (category, label) => (
    <div className="field">
      <span className="field-label">{label ?? copy.tagCategories[category]}</span>
      <TagPicker
        category={category}
        categoryLabel={label ?? copy.tagCategories[category]}
        tags={tags}
        value={values.tags.filter((tagId) => lookups.tags[tagId]?.category === category)}
        onChange={(chosen) => setValue('tags', [...values.tags.filter((tagId) => lookups.tags[tagId]?.category !== category), ...chosen])}
        onCreate={(labelText) => createTag(category, labelText)}
        copy={f.tagPicker}
      />
    </div>
  )

  const pickerPeople = people.filter((item) => item.id !== person?.id).map((item) => ({ id: item.id, name: item.name, line: item.line }))
  const activeMembers = people.filter((item) => item.kind === 'member' && item.account).map((item) => ({ id: item.memberId, name: item.name, line: item.line }))

  const addOrg = async () => {
    const data = await run({ action: 'saveOrg', org: { name: newOrg.trim() } }, { quiet: true })
    if (data?.id) {
      setValue('organizationId', data.id)
      setNewOrg(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const sent = payload(values)
    if (adding) {
      const fields = Object.fromEntries(
        Object.entries(sent).filter(([, value]) => value !== '' && value !== null && !(Array.isArray(value) && !value.length) && !(typeof value === 'object' && !Array.isArray(value) && !Object.keys(value).length)),
      )
      if (consent) fields.consent = { note: consentNote }
      const data = await run({ action: 'create', person: { kind, ...(kind === 'alumni' && { listed }), ...fields } }, { quiet: true, onError: setError })
      if (!data) return
      dialogRef.current.close()
      onSaved(data.id)
      return
    }
    const changes = changedFields(payload(opened), sent)
    if (consentChanged) changes.consent = consent ? { note: consentNote } : null
    if (!Object.keys(changes).length) return dialogRef.current.close()
    const data = await run({ action: 'save', id: person.id, person: changes }, { onError: setError })
    if (!data) return
    dialogRef.current.close()
    onSaved(person.id)
  }

  const heading = adding ? f.addHeading : own ? f.ownHeading : f.editHeading
  const name = [values.firstName, values.lastName].filter(Boolean).join(' ')

  return (
    <FormDialog
      dialogRef={dialogRef}
      id={`${id}-heading`}
      heading={heading}
      closeLabel={copy.profile.close}
      onClose={onClose}
      onSubmit={handleSubmit}
      dirty={dirty}
      discard={copy.discard}
      wide
    >
      <div className="flex max-h-[min(70vh,48rem)] flex-col gap-5 overflow-y-auto pr-1">
        {adding && (
          <Group title={f.kind}>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={f.kind}>
              {['external', 'alumni'].map((option) => (
                <label key={option} className="choice">
                  <input type="radio" name={`${id}-kind`} checked={kind === option} onChange={() => setNewKind(option)} />
                  {f.kinds[option]}
                </label>
              ))}
            </div>
          </Group>
        )}

        <Group title={f.sections.basics}>
          <div className="form-row">
            {text('firstName', { required: true, maxLength: 60 })}
            {text('lastName', { maxLength: 60 })}
          </div>
          {own && (
            <PhotoCropper
              copy={{ ...ctx.photoCopy, label: f.photo }}
              optional={ctx.optional}
              photo={photo}
              onChange={(path) => {
                setPhoto(path)
                ctx.onPhoto(path)
              }}
            />
          )}
        </Group>

        {kind === 'member' && (
          <>
            <Group title={f.sections.ignite}>
              <div className="form-row">
                <Field id={`${id}-team`} label={f.team} hint={person?.position === 'board' ? f.boardTeam : undefined}>
                  <select id={`${id}-team`} className="input" value={values.team} onChange={set('team')} disabled={person?.position === 'board'}>
                    <option value="">{f.noTeam}</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id={`${id}-memberSince`} label={f.memberSince}>
                  <input id={`${id}-memberSince`} type="month" className="input" value={values.memberSince} onChange={set('memberSince')} min="2015-01" max="2100-12" />
                </Field>
              </div>
              <p className="form-note">
                {f.position}: {copy.positions[person?.position ?? 'member']}. {f.positionHint}
              </p>
            </Group>
            <Group title={f.sections.study}>
              <div className="form-row">
                {text('major', { maxLength: 100 })}
                {text('minor', { maxLength: 100 })}
              </div>
              <Field id={`${id}-semester`} label={f.semester} hint={f.semesterHint}>
                <input id={`${id}-semester`} type="number" min="1" max="30" className="input max-w-[8rem]" value={values.semester} onChange={set('semester')} aria-describedby={`${id}-semester-hint`} />
              </Field>
            </Group>
            <Group title={f.sections.tags}>
              {tagPicker('interests')}
              {tagPicker('skills')}
              {tagPicker('hobbies')}
            </Group>
          </>
        )}

        {kind === 'alumni' && (
          <Group title={f.sections.base}>
            {text('headline', { placeholder: f.headlinePlaceholder })}
            {orgSelect()}
            <div className="field">
              <span className="field-label">{copy.profile.igniteTime}</span>
              {withVis(
                'ignite',
                <div className="flex items-center gap-2">
                  <input type="number" min="2000" max="2100" aria-label={f.igniteFrom} placeholder={f.igniteFrom} className="input" value={values.igniteFrom} onChange={set('igniteFrom')} disabled={isLocked('ignite')} />
                  <span aria-hidden="true">–</span>
                  <input type="number" min="2000" max="2100" aria-label={f.igniteTo} placeholder={f.igniteTo} className="input" value={values.igniteTo} onChange={set('igniteTo')} disabled={isLocked('ignite')} />
                </div>,
              )}
            </div>
            {text('igniteRole')}
            {area('engagement', { maxLength: 300, rows: 2 })}
          </Group>
        )}

        {kind === 'external' && (
          <Group title={f.sections.relation}>
            {text('headline', { placeholder: f.headlinePlaceholder })}
            {orgSelect()}
            <div className="field">
              <span className="field-label">{f.relations}</span>
              <div className="flex flex-wrap gap-1.5">
                {RELATIONS.map((relation) => (
                  <ToggleChip key={relation} pressed={values.relations.includes(relation)} onClick={() => setValue('relations', toggle(values.relations, relation))}>
                    {copy.relations[relation]}
                  </ToggleChip>
                ))}
              </div>
            </div>
            {tagPicker('industries')}
            {tagPicker('interests')}
          </Group>
        )}

        <Group title={f.sections.contact} hint={kind === 'member' ? f.contactNote : undefined}>
          <div className={showVis ? 'flex flex-col gap-4' : 'form-row'}>
            {kind === 'member' && text('instagram', { placeholder: f.instagramPlaceholder, maxLength: 300 })}
            {text('linkedin', { placeholder: f.linkedinPlaceholder, maxLength: 300 })}
            {text('email', { type: 'email', maxLength: 254 })}
            {text('phone', { type: 'tel', maxLength: 40 })}
            {kind === 'external' && text('website', { maxLength: 300 })}
            {kind !== 'member' && text('city', { maxLength: 80 })}
          </div>
        </Group>

        {kind === 'alumni' && (
          <Group title={f.sections.extra}>
            {area('about')}
            {tagPicker('interests', copy.tagCategories.interests)}
            {text('major', { maxLength: 100 })}
            <div className="field">
              <span className="field-label">{f.career}</span>
              {withVis(
                'career',
                <div className="flex flex-col gap-2">
                  {values.career.map((step, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        className="input"
                        value={step}
                        maxLength={160}
                        placeholder={f.careerPlaceholder}
                        aria-label={`${f.career} ${index + 1}`}
                        disabled={isLocked('career')}
                        onChange={(e) => setValue('career', values.career.map((item, i) => (i === index ? e.target.value : item)))}
                      />
                      <button type="button" aria-label={f.removeLine} className={TOOL_BUTTON} onClick={() => setValue('career', values.career.filter((_, i) => i !== index))}>
                        <X aria-hidden="true" className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {values.career.length < 10 && !isLocked('career') && (
                    <button type="button" className={`${TOOL_BUTTON} self-start`} onClick={() => setValue('career', [...values.career, ''])}>
                      <Plus aria-hidden="true" className="h-4 w-4" />
                      {f.addLine}
                    </button>
                  )}
                </div>,
              )}
            </div>
            {tagPicker('hobbies')}
            <div className="field">
              <span className="field-label">{f.openFor}</span>
              {withVis(
                'openFor',
                <div className="flex flex-wrap gap-1.5">
                  {OPEN_FOR.map((item) => (
                    <ToggleChip key={item} pressed={values.openFor.includes(item)} onClick={() => setValue('openFor', toggle(values.openFor, item))}>
                      {copy.openFor[item]}
                    </ToggleChip>
                  ))}
                </div>,
              )}
            </div>
            {area('seeking', { maxLength: 300, rows: 2 })}
          </Group>
        )}

        {(kind === 'member' || kind === 'alumni') && (
          <Group title={kind === 'member' ? f.sections.personal : f.sections.memberPast} hint={f.sections.personalHint}>
            {QUESTIONS.map((question) => (
              <Field key={question} id={`${id}-q-${question}`} label={copy.questions[question]}>
                <input
                  id={`${id}-q-${question}`}
                  className="input"
                  maxLength={300}
                  value={values.answers[question] ?? ''}
                  onChange={(e) => setValue('answers', { ...values.answers, [question]: e.target.value })}
                />
              </Field>
            ))}
          </Group>
        )}

        {kind === 'external' && (
          <Group title={f.sections.origin}>
            <Field id={`${id}-source`} label={f.source} hint={f.sourceHint}>
              <textarea id={`${id}-source`} className="input min-h-[4.5rem]" rows={2} maxLength={500} required value={values.source} onChange={set('source')} aria-describedby={`${id}-source-hint`} />
            </Field>
            {area('about', { label: f.note })}
          </Group>
        )}

        <Group title={kind === 'external' ? f.introducedBy : f.sections.origin}>
          <div className="form-row">
            <Field id={`${id}-introducedBy`} label={f.introducedBy}>
              <PersonPicker
                id={`${id}-introducedBy`}
                people={pickerPeople}
                value={values.introducedBy}
                onChange={(value) => setValue('introducedBy', value)}
                copy={{ ...f.personPicker, remove: f.tagPicker.remove }}
              />
            </Field>
            <Field id={`${id}-introducedOn`} label={f.introducedOn}>
              <input id={`${id}-introducedOn`} type="date" className="input" value={values.introducedOn} onChange={set('introducedOn')} />
            </Field>
          </div>
          {kind === 'external' && viewer.position !== 'alumni' && (
            <>
              <Field id={`${id}-owners`} label={f.owners}>
                <PersonPicker
                  id={`${id}-owners`}
                  multiple
                  people={activeMembers}
                  value={values.owners}
                  onChange={(value) => setValue('owners', value)}
                  copy={{ ...f.personPicker, remove: f.tagPicker.remove }}
                />
              </Field>
              <div className="form-row">
                <Field id={`${id}-nextStep`} label={f.nextStep}>
                  <input id={`${id}-nextStep`} className="input" maxLength={300} value={values.nextStep} onChange={set('nextStep')} />
                </Field>
                <Field id={`${id}-nextDue`} label={f.nextDue}>
                  <input id={`${id}-nextDue`} type="date" className="input" value={values.nextDue} onChange={set('nextDue')} />
                </Field>
              </div>
            </>
          )}
        </Group>

        {(adding || person.mayConsent || person.consent) && (
          <Group title={f.sections.public} hint={f.publicHint}>
            <label className={`choice ${!adding && !person.mayConsent && !(viewer.role === 'admin' && consent) ? 'choice-disabled' : ''}`}>
              <input
                type="checkbox"
                checked={consent}
                disabled={!adding && !person.mayConsent && !(viewer.role === 'admin' && consent)}
                onChange={(e) => setConsent(e.target.checked)}
              />
              {own ? f.consentOwn : f.consent}
            </label>
            {consent && !own && (adding || person.mayConsent) && (
              <Field id={`${id}-consentNote`} label={f.consentNote}>
                <input id={`${id}-consentNote`} className="input" maxLength={300} value={consentNote} placeholder={f.consentNotePlaceholder} onChange={(e) => setConsentNote(e.target.value)} />
              </Field>
            )}
            {kind === 'member' && (
              <label className="choice">
                <input
                  type="checkbox"
                  checked={vis('photo') === 'public'}
                  onChange={(e) => setVis('photo', e.target.checked ? 'public' : 'members')}
                />
                {f.publicFields}: {f.publicFieldNames.photo}
              </label>
            )}
          </Group>
        )}

        {adding && kind === 'alumni' && (
          <label className="choice">
            <input type="checkbox" checked={listed} required onChange={(e) => setListed(e.target.checked)} />
            {f.listed}
          </label>
        )}
      </div>

      {error && <p className="form-error">{copy.results[error] ?? copy.results.error}</p>}
      <div className="flex flex-wrap justify-end gap-2 border-0 border-t border-solid border-border pt-4">
        <button type="button" className={TOOL_BUTTON} onClick={() => dialogRef.current.close()}>
          {f.cancel}
        </button>
        <button type="submit" className={PRIMARY_BUTTON} disabled={busy || (adding && !name)}>
          {busy ? f.busy : adding ? f.create : f.save}
        </button>
      </div>
    </FormDialog>
  )

  function orgSelect() {
    return (
      <Field id={`${id}-organizationId`} label={f.organization} hint={isLocked('organizationId') ? copy.locked[locked.organizationId] : undefined}>
        {withVis(
          'organizationId',
          newOrg === null ? (
            <select
              id={`${id}-organizationId`}
              className="input"
              value={values.organizationId}
              disabled={isLocked('organizationId')}
              onChange={(e) => (e.target.value === '__new' ? setNewOrg('') : setValue('organizationId', e.target.value))}
            >
              <option value="">{f.noOrganization}</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
              {viewer.position !== 'alumni' && <option value="__new">{f.newOrganization}</option>}
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                id={`${id}-organizationId`}
                className="input"
                autoFocus
                maxLength={120}
                placeholder={f.orgName}
                value={newOrg}
                onChange={(e) => setNewOrg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (newOrg.trim()) addOrg()
                  }
                }}
              />
              <button type="button" className={TOOL_BUTTON} disabled={!newOrg.trim() || busy} onClick={addOrg}>
                {f.create}
              </button>
              <button type="button" aria-label={f.cancel} className={TOOL_BUTTON} onClick={() => setNewOrg(null)}>
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          ),
        )}
      </Field>
    )
  }
}

function ToggleChip({ pressed, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex h-8 items-center rounded-full border px-3 text-sm transition-colors ${
        pressed ? 'border-fg bg-fg text-bg' : 'border-border-strong text-fg hover:bg-bg-subtle'
      }`}
    >
      {children}
    </button>
  )
}
