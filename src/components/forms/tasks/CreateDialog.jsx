/**
 * The dialog that creates a project. It has three shapes:
 * - an internal project: title and an optional deadline;
 * - an event, which is always a Luma event: the member pastes its link, public or private
 *   (/api/members/luma-import), and the dialog shows what Luma says. Without a Luma event it is a project;
 * - the planning of an event of the IGNITE calendar, which is about its tasks, so the template shows at once and comes
 *   preselected.
 * Everything else sits under "Mehr Optionen": description, team, leads, SharePoint folder, the template and, for an
 * imported event, the fields the import filled, which stay editable there. What Luma shows to guests alone (the
 * address until sign-up) is asked for right below the preview.
 * Projects start empty, from a standard template or from an earlier project; the preview lists the tasks to take over,
 * each with a checkbox, its relative deadline and, for earlier projects, whether it was done back then. Only titles,
 * descriptions, priorities and relative deadlines carry over (tasksFromTemplate on the server).
 * Props: request ({ kind, team, event?, due?, stay? } or null = closed; team and due are preselected, stay keeps the
 * calendar on screen instead of opening the new project), copy (workspace copy), locale, me, members, membersById,
 * templates, projects, entries (calendarEntries), planOf(entry) → its project or undefined, admin,
 * archive (none, loading, loaded or failed: most earlier projects are archived, so choosing one loads it through
 * onPast()), run, onCreated(id, stay), onUseEntry(entry).
 */
import React, { useEffect, useId, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { addDays, projectDay, SHAREPOINT_PATTERN, templateFromTasks, TEXT_MAX, TITLE_MAX } from '../../../lib/tasks'
import { fill, FormDialog, TOOL_BUTTON } from '../memberUi'
import { longDay, MemberPicker, shortDay, TeamSelect } from './taskUi'
import { LumaPreview, NO_IMPORT, requestLumaEvent, withImport } from './lumaImport'

const EMPTY = { title: '', description: '', due: '', time: '', endDue: '', endTime: '', place: '', coverUrl: '', luma: null, folderUrl: '', team: '', leads: [] }
const QUIET_LINK = 'border-0 bg-transparent p-0 text-accent underline'

function relative(offset, text) {
  if (offset === null) return text.noOffset
  if (offset === 0) return text.onTheDay
  return fill(offset < 0 ? text.relative : text.relativeAfter, { days: Math.abs(offset) })
}

export default function CreateDialog({
  request,
  copy,
  locale,
  me,
  members,
  membersById,
  templates,
  projects,
  entries,
  planOf,
  admin,
  archive,
  run,
  onPast,
  onCreated,
  onUseEntry,
}) {
  const text = copy.createDialog
  const dialog = useRef(null)
  const first = useRef(null)
  const id = useId()
  const [form, setForm] = useState(EMPTY)
  const [start, setStart] = useState('none')
  const [sourceId, setSourceId] = useState('')
  const [include, setInclude] = useState([])
  const [busy, setBusy] = useState(false)
  const [more, setMore] = useState(false)
  const [lumaLink, setLumaLink] = useState('')
  const [lumaImport, setLumaImport] = useState(NO_IMPORT)

  const past = projects
    .filter((project) => project.type !== 'task' && project.tasks.length)
    .sort((a, b) => projectDay(b).localeCompare(projectDay(a)))
  const sources = { template: templates, past }
  const choices = start === 'none' ? [] : sources[start]
  const source = choices.find((item) => item.id === sourceId)
  const preview =
    start === 'template' && source
      ? source.tasks
      : start === 'past' && source
        ? templateFromTasks(source.tasks, projectDay(source)).map((task, index) => ({ ...task, done: source.tasks[index].done }))
        : []
  const anchor = request?.event?.day || form.due
  const kind = request?.kind
  const ownEvent = kind === 'event' && !request?.event
  const imported = ownEvent && !!form.luma

  useEffect(() => {
    if (!request) return
    setForm({ ...EMPTY, title: request.event?.title ?? '', due: request.due ?? '', team: request.team, leads: [me] })
    setMore(false)
    setLumaLink('')
    setLumaImport(NO_IMPORT)
    const useTemplate = !!request.event && templates.length > 0
    setStart(useTemplate ? 'template' : 'none')
    setSourceId(useTemplate ? templates[0].id : '')
    if (!dialog.current.open) dialog.current.showModal()
    // showModal focuses the first control, the close button; the planning of a calendar event has nothing to type first.
    first.current?.focus()
  }, [request])
  // Each request starts with every task ticked, also when it picks the same source as the one before.
  useEffect(() => setInclude(preview.map((_, index) => index)), [request, start, sourceId])
  // The chosen source can go (an archived template) or arrive late (the archive with the earlier projects).
  const choiceIds = choices.map((item) => item.id).join()
  useEffect(() => {
    if (start !== 'none' && !source) setSourceId(choices[0]?.id ?? '')
  }, [start, choiceIds])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const choose = (next) => {
    setStart(next)
    setSourceId(next === 'none' ? '' : (sources[next][0]?.id ?? ''))
    if (next === 'past') onPast()
  }
  const importLuma = async () => {
    setLumaImport({ ...NO_IMPORT, status: 'loading' })
    const { event, state } = await requestLumaEvent(lumaLink, text.luma.errors)
    if (event) setForm((current) => withImport(current, event))
    setLumaImport(state)
  }
  const unlinkLuma = () => {
    setForm({ ...EMPTY, team: form.team, leads: form.leads, folderUrl: form.folderUrl })
    setLumaImport(NO_IMPORT)
  }
  const listedEntry = lumaImport.listed && entries.find((entry) => entry.id === lumaImport.listed.id)
  // The place field takes the meeting link of an online event too, so both hints land there.
  const placeHint = ['place', 'online']
    .filter((field) => lumaImport.hidden.includes(field))
    .map((field) => `${text.luma.hidden[field]} ${text.luma.manual}.`)
    .join(' ')

  const toggle = (index) => setInclude(include.includes(index) ? include.filter((item) => item !== index) : [...include, index])

  const submit = async (e) => {
    e.preventDefault()
    const { title, description, due, time, endDue, endTime, place, coverUrl, luma, folderUrl, team, leads } = form
    const body = {
      action: 'create',
      project: {
        title,
        description,
        type: kind,
        due: request.event ? '' : due,
        time: ownEvent ? time : '',
        place: ownEvent ? place : '',
        ...(ownEvent && { endDue, endTime, coverUrl, luma }),
        folderUrl: folderUrl.trim(),
        leads,
        team,
      },
    }
    if (request.event) body.eventId = request.event.id
    if (source) body.template = { kind: start === 'template' ? 'template' : 'project', id: source.id, include }
    setBusy(true)
    const data = await run(body)
    setBusy(false)
    if (data) {
      dialog.current.close()
      onCreated(data.id, !!request.stay)
    }
  }
  const archiveTemplate = async () => {
    if (!window.confirm(fill(text.confirmArchiveTemplate, { name: source.name }))) return
    await run({ action: 'archiveTemplate', templateId: source.id })
  }

  const lumaField = (
    <div className="field">
      <label htmlFor={`${id}-luma`} className="field-label">
        {text.luma.label}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          ref={first}
          id={`${id}-luma`}
          type="url"
          inputMode="url"
          className="input min-w-0 flex-1 basis-56"
          placeholder="https://luma.com/…"
          aria-describedby={`${id}-luma-hint ${id}-luma-status`}
          value={lumaLink}
          onChange={(e) => setLumaLink(e.target.value)}
          // Enter reads the link; the form has nothing to save before that.
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            if (lumaLink.trim()) importLuma()
          }}
        />
        <button type="button" className={`${TOOL_BUTTON} h-11`} disabled={!lumaLink.trim() || lumaImport.status === 'loading'} onClick={importLuma}>
          {lumaImport.status === 'loading' ? text.luma.importing : text.luma.import}
        </button>
      </div>
      <p id={`${id}-luma-hint`} className="field-hint text-sm">
        {text.luma.hint}
      </p>
    </div>
  )
  const lumaStatus = (
    <div id={`${id}-luma-status`} aria-live="polite" className="flex flex-col gap-2 text-sm empty:hidden">
      {lumaImport.status === 'failed' && <p className="text-danger">{lumaImport.error}</p>}
      {lumaImport.existing && (
        <p>
          {fill(text.luma.existing, { title: lumaImport.existing.title })}{' '}
          <button
            type="button"
            className={QUIET_LINK}
            onClick={() => {
              dialog.current.close()
              onCreated(lumaImport.existing.id, false)
            }}
          >
            {text.luma.openExisting}
          </button>
        </p>
      )}
      {listedEntry && (
        <p>
          {text.luma.listed}{' '}
          <button type="button" className={QUIET_LINK} onClick={() => onUseEntry(listedEntry)}>
            {planOf(listedEntry) ? text.openExisting : text.luma.usePlanning}
          </button>
        </p>
      )}
    </div>
  )
  const placeField = (
    <div className="field">
      <label htmlFor={`${id}-place`} className="field-label">
        {text.place}
      </label>
      <input
        id={`${id}-place`}
        className="input"
        maxLength={TITLE_MAX}
        placeholder={placeHint ? text.luma.manual : undefined}
        aria-describedby={placeHint ? `${id}-place-hint` : undefined}
        value={form.place}
        onChange={set('place')}
      />
      {placeHint && (
        <p id={`${id}-place-hint`} className="field-hint text-sm text-accent">
          {placeHint}
        </p>
      )}
    </div>
  )
  const titleField = (focus) => (
    <div className="field">
      <label htmlFor={`${id}-title`} className="field-label">
        {text.title}
      </label>
      <input ref={focus ? first : undefined} id={`${id}-title`} className="input" required maxLength={TITLE_MAX} value={form.title} onChange={set('title')} />
    </div>
  )
  const dueField = (
    <div className="field">
      <label htmlFor={`${id}-due`} className="field-label">
        {kind === 'event' ? text.eventDate : text.due}
      </label>
      <input id={`${id}-due`} type="date" className="input" required={ownEvent} value={form.due} onChange={set('due')} />
    </div>
  )
  // What the import filled stays editable, for the case that Luma is wrong or says too little.
  const importedFields = (
    <>
      {titleField(false)}
      {dueField}
      <div className="form-row">
        <div className="field">
          <label htmlFor={`${id}-time`} className="field-label">
            {text.time}
          </label>
          <input id={`${id}-time`} type="time" className="input" value={form.time} onChange={set('time')} />
        </div>
        <div className="field">
          <label htmlFor={`${id}-end-time`} className="field-label">
            {text.endTime}
          </label>
          <input id={`${id}-end-time`} type="time" className="input" value={form.endTime} onChange={set('endTime')} />
        </div>
      </div>
      {/* Only an event over several days brings an end day. */}
      {form.endDue && (
        <div className="field">
          <label htmlFor={`${id}-end-due`} className="field-label">
            {text.endDue}
          </label>
          <input id={`${id}-end-due`} type="date" className="input" min={form.due} value={form.endDue} onChange={set('endDue')} />
        </div>
      )}
      {!placeHint && placeField}
    </>
  )
  const templateChoice = request && (
    <fieldset className="fieldset">
      <legend className="field-label mb-2">{text.start}</legend>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {['none', 'template', 'past'].map((option) => (
          <label key={option} className="choice">
            <input type="radio" name={`${id}-start`} checked={start === option} onChange={() => choose(option)} />
            {text[`start${option[0].toUpperCase()}${option.slice(1)}`]}
          </label>
        ))}
      </div>

      {start !== 'none' && (
        <div className="mt-2 flex flex-col gap-3 rounded-lg border border-border bg-bg-subtle p-4">
          {start === 'past' && archive === 'loading' && (
            <p role="status" className="text-sm text-fg-muted">
              {text.pastLoading}
            </p>
          )}
          {start === 'past' && archive === 'failed' && (
            <p className="text-sm text-fg-muted">
              {copy.board.archiveFailed}{' '}
              <button type="button" className={QUIET_LINK} onClick={onPast}>
                {copy.board.retry}
              </button>
            </p>
          )}
          {choices.length ? (
            <>
              <div className="flex flex-wrap items-end gap-2">
                <div className="field min-w-0 flex-1">
                  <label htmlFor={`${id}-source`} className="field-label">
                    {start === 'template' ? text.template : text.pastProject}
                  </label>
                  <select id={`${id}-source`} className="input" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                    {choices.map((item) => (
                      <option key={item.id} value={item.id}>
                        {start === 'template' ? item.name : `${item.title}${projectDay(item) ? ` · ${shortDay(projectDay(item), locale)}` : ''}`}
                      </option>
                    ))}
                  </select>
                </div>
                {admin && start === 'template' && source && (
                  <button type="button" className={`${TOOL_BUTTON} h-11`} onClick={archiveTemplate}>
                    {text.archiveTemplate}
                  </button>
                )}
              </div>
              {start === 'template' && source?.description && <p className="text-sm text-fg-muted">{source.description}</p>}
              {start === 'past' && source && projectDay(source) && (
                <p className="text-sm text-fg-muted">{fill(text.originalDate, { date: longDay(projectDay(source), locale) })}</p>
              )}
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{fill(text.previewTasks, { count: `${include.length}/${preview.length}` })}</p>
                <span className="flex gap-3 text-sm">
                  <button type="button" className={QUIET_LINK} onClick={() => setInclude(preview.map((_, index) => index))}>
                    {text.selectAll}
                  </button>
                  <button type="button" className={QUIET_LINK} onClick={() => setInclude([])}>
                    {text.selectNone}
                  </button>
                </span>
              </div>
              <p className="text-xs text-fg-muted">{text.previewHint}</p>
              <ul role="list" className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                {preview.map((task, index) => (
                  <li key={index}>
                    <label className="choice rounded-md px-1 py-1 hover:bg-bg">
                      <input type="checkbox" checked={include.includes(index)} onChange={() => toggle(index)} />
                      <span className="min-w-0 flex-1">
                        <span className="block">{task.title}</span>
                        <span className="block text-xs text-fg-muted">
                          {relative(task.offsetDays, text)}
                          {anchor && task.offsetDays !== null && ` · ${shortDay(addDays(anchor, task.offsetDays), locale)}`}
                          {'done' in task && ` · ${task.done ? text.doneThen : text.openThen}`}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            archive !== 'loading' && <p className="text-sm text-fg-muted">{text.noPast}</p>
          )}
        </div>
      )}
    </fieldset>
  )

  const heading = request?.event ? fill(text.eventHeading, { title: request.event.title }) : kind ? text.headings[kind] : ''
  // An event exists only with its Luma event, so there is nothing to add before the import.
  const incomplete = request?.event ? false : ownEvent ? !imported || !form.title.trim() || !form.due : !form.title.trim()

  return (
    <FormDialog dialogRef={dialog} id={`${id}-heading`} heading={heading} closeLabel={copy.panel.close} onClose={() => setBusy(false)} onSubmit={submit}>
      {request && (
        <>
          {request.event && (
            <p className="text-sm text-fg-muted">
              {text.linkedEvent}: {longDay(request.event.day, locale)}
              {request.event.location && ` · ${request.event.location}`}
            </p>
          )}
          {kind === 'internal' && (
            <>
              {titleField(true)}
              {dueField}
            </>
          )}
          {ownEvent && !imported && lumaField}
          {ownEvent && lumaStatus}
          {imported && <LumaPreview form={form} text={text} timeText={copy.overview.time} locale={locale} onUnlink={unlinkLuma} />}
          {imported && placeHint && placeField}
          {request.event && templateChoice}

          {(!ownEvent || imported) && (
            <details className="group" open={more} onToggle={(e) => setMore(e.currentTarget.open)}>
              <summary className="flex cursor-pointer list-none items-center gap-1.5 border-0 border-t border-solid border-border pt-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                <ChevronRight aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-90" />
                {text.more}
                <span className="ml-auto text-xs font-normal text-fg-muted">{request.event ? text.moreHintPlanning : text.moreHint}</span>
              </summary>
              {/* The reset inherits box-sizing, and the browser's ::details-content box in between starts it over as
                  content-box, which made the fields wider than the dialog. */}
              <div className="mt-4 box-border flex flex-col gap-5">
                {imported && importedFields}
                <div className="field">
                  <label htmlFor={`${id}-description`} className="field-label">
                    {text.description}
                  </label>
                  <textarea
                    id={`${id}-description`}
                    className="input min-h-20"
                    maxLength={TEXT_MAX}
                    aria-describedby={`${id}-description-hint`}
                    value={form.description}
                    onChange={set('description')}
                  />
                  <p id={`${id}-description-hint`} className="field-hint text-sm">
                    {text.descriptionHint}
                  </p>
                </div>
                <div className="field">
                  <label htmlFor={`${id}-team`} className="field-label">
                    {text.team}
                  </label>
                  <TeamSelect
                    id={`${id}-team`}
                    className="input"
                    value={form.team}
                    onChange={set('team')}
                    teams={copy.teams}
                    empty={copy.teamTabs.none}
                    all={copy.teamTabs.all}
                  />
                </div>
                <div className="field">
                  <span className="field-label">{text.leads}</span>
                  <MemberPicker
                    members={members}
                    membersById={membersById}
                    selected={form.leads}
                    team={form.team}
                    onChange={(leads) => setForm({ ...form, leads })}
                    copy={copy.people}
                    me={me}
                    label={text.leads}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`${id}-folder`} className="field-label">
                    {text.folderUrl}
                  </label>
                  <input
                    id={`${id}-folder`}
                    type="url"
                    className="input"
                    inputMode="url"
                    pattern={SHAREPOINT_PATTERN}
                    placeholder="https://leuphanalg.sharepoint.com/…"
                    aria-describedby={`${id}-folder-hint`}
                    value={form.folderUrl}
                    onChange={set('folderUrl')}
                    // A refused address inside the closed options would leave the submit button without any effect.
                    onInvalid={() => setMore(true)}
                  />
                  <p id={`${id}-folder-hint`} className="field-hint text-sm">
                    {text.folderHint}
                  </p>
                </div>
                {!request.event && templateChoice}
              </div>
            </details>
          )}

          <div className="form-actions">
            <button type="submit" className="form-submit" disabled={busy || incomplete}>
              {ownEvent ? text.submitEvent : text.submit}
            </button>
            <button type="button" className="form-secondary" onClick={() => dialog.current.close()}>
              {text.cancel}
            </button>
          </div>
        </>
      )}
    </FormDialog>
  )
}
