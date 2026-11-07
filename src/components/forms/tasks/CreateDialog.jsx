/**
 * The dialog that creates a project: an internal project or an event, either an own one, which needs a date, or the
 * planning of a calendar event. An own event on a day that already has entries names them first, so nobody enters
 * twice what is in the calendar already. Projects start empty, from a standard template or from an earlier project; the
 * preview lists the tasks to take over, each with a checkbox, its relative deadline and, for earlier projects, whether
 * it was done back then. Only titles, descriptions, priorities and relative deadlines carry over (tasksFromTemplate on
 * the server).
 * Props: request ({ kind, team, event? } or null = closed; team is preselected), copy (workspace copy), locale, me,
 * members, membersById, templates, projects, entries (calendarEntries), planOf(entry) → its project or undefined, admin,
 * run, onCreated(id), onUseEntry(entry).
 */
import React, { useEffect, useId, useRef, useState } from 'react'
import { addDays, isEvent, projectDay, templateFromTasks, TEXT_MAX, TITLE_MAX } from '../../../lib/tasks'
import { fill, FormDialog, TOOL_BUTTON } from '../memberUi'
import { longDay, MemberPicker, shortDay, TeamSelect } from './taskUi'

const EMPTY = { title: '', description: '', due: '', time: '', place: '', team: '', leads: [] }

function relative(offset, text) {
  if (offset === null) return text.noOffset
  if (offset === 0) return text.onTheDay
  return fill(offset < 0 ? text.relative : text.relativeAfter, { days: Math.abs(offset) })
}

export default function CreateDialog({ request, copy, locale, me, members, membersById, templates, projects, entries, planOf, admin, run, onCreated, onUseEntry }) {
  const text = copy.createDialog
  const dialog = useRef(null)
  const id = useId()
  const [form, setForm] = useState(EMPTY)
  const [start, setStart] = useState('none')
  const [sourceId, setSourceId] = useState('')
  const [include, setInclude] = useState([])
  const [busy, setBusy] = useState(false)

  const past = projects
    .filter((project) => project.type !== 'task' && project.tasks.length)
    .sort((a, b) => projectDay(b).localeCompare(projectDay(a)))
  const sources = { template: templates, past }
  const source = start === 'none' ? null : sources[start].find((item) => item.id === sourceId)
  const preview =
    start === 'template' && source
      ? source.tasks
      : start === 'past' && source
        ? templateFromTasks(source.tasks, projectDay(source)).map((task, index) => ({ ...task, done: source.tasks[index].done }))
        : []
  const anchor = request?.event?.day || form.due
  const kind = request?.kind
  const ownEvent = kind === 'event' && !request?.event
  const sameDay = ownEvent && form.due ? entries.filter((entry) => isEvent(entry) && entry.day <= form.due && form.due <= entry.endDay) : []

  useEffect(() => {
    if (!request) return
    setForm({ ...EMPTY, title: request.event?.title ?? '', team: request.team, leads: [me] })
    const useTemplate = request.kind === 'event' && templates.length > 0
    setStart(useTemplate ? 'template' : 'none')
    setSourceId(useTemplate ? templates[0].id : '')
    if (!dialog.current.open) dialog.current.showModal()
  }, [request])
  useEffect(() => setInclude(preview.map((_, index) => index)), [start, sourceId])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const choose = (next) => {
    setStart(next)
    setSourceId(next === 'none' ? '' : (sources[next][0]?.id ?? ''))
  }
  const toggle = (index) => setInclude(include.includes(index) ? include.filter((item) => item !== index) : [...include, index])

  const submit = async (e) => {
    e.preventDefault()
    const { title, description, due, time, place, team, leads } = form
    const body = {
      action: 'create',
      project: { title, description, type: kind, due: request.event ? '' : due, time: ownEvent ? time : '', place: ownEvent ? place : '', leads, team },
    }
    if (request.event) body.eventId = request.event.id
    if (source) body.template = { kind: start === 'template' ? 'template' : 'project', id: source.id, include }
    setBusy(true)
    const data = await run(body)
    setBusy(false)
    if (data) {
      dialog.current.close()
      onCreated(data.id)
    }
  }
  const archiveTemplate = async () => {
    if (!window.confirm(fill(text.confirmArchiveTemplate, { name: source.name }))) return
    if (await run({ action: 'archiveTemplate', templateId: source.id })) choose('template')
  }

  const heading = request?.event ? fill(text.eventHeading, { title: request.event.title }) : kind ? text.headings[kind] : ''

  return (
    <FormDialog dialogRef={dialog} id={`${id}-heading`} heading={heading} closeLabel={copy.panel.close} onClose={() => setBusy(false)} onSubmit={submit}>
      {request && (
        <>
          {request.event ? (
            <p className="text-sm text-fg-muted">
              {text.linkedEvent}: {longDay(request.event.day, locale)}
              {request.event.location && ` · ${request.event.location}`}
            </p>
          ) : (
            <div className="field">
              <label htmlFor={`${id}-title`} className="field-label">
                {text.title}
              </label>
              <input id={`${id}-title`} className="input" required maxLength={TITLE_MAX} value={form.title} onChange={set('title')} />
            </div>
          )}
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
          <div className="form-row">
            <div className="field">
              <label htmlFor={`${id}-team`} className="field-label">
                {text.team}
              </label>
              <TeamSelect id={`${id}-team`} className="input" value={form.team} onChange={set('team')} teams={copy.teams} empty={copy.teamTabs.none} />
            </div>
            {!request.event && (
              <div className="field">
                <label htmlFor={`${id}-due`} className="field-label">
                  {kind === 'event' ? text.eventDate : text.due}
                </label>
                <input id={`${id}-due`} type="date" className="input" required={ownEvent} value={form.due} onChange={set('due')} />
              </div>
            )}
          </div>
          {ownEvent && (
            <div className="form-row">
              <div className="field">
                <label htmlFor={`${id}-time`} className="field-label">
                  {text.time}
                </label>
                <input id={`${id}-time`} type="time" className="input" value={form.time} onChange={set('time')} />
              </div>
              <div className="field">
                <label htmlFor={`${id}-place`} className="field-label">
                  {text.place}
                </label>
                <input id={`${id}-place`} className="input" maxLength={TITLE_MAX} value={form.place} onChange={set('place')} />
              </div>
            </div>
          )}
          {sameDay.length > 0 && (
            <div className="rounded-lg border border-border-strong bg-bg-subtle p-3 text-sm">
              <p>{text.sameDay}</p>
              <ul role="list" className="mt-2 flex flex-col gap-1.5">
                {sameDay.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate font-medium">{entry.title}</span>
                    <button
                      type="button"
                      className="shrink-0 border-0 bg-transparent p-0 text-accent underline"
                      onClick={() => {
                        if (planOf(entry)) dialog.current.close()
                        onUseEntry(entry)
                      }}
                    >
                      {planOf(entry) ? text.openExisting : text.useExisting}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
                {sources[start].length ? (
                  <>
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="field min-w-0 flex-1">
                        <label htmlFor={`${id}-source`} className="field-label">
                          {start === 'template' ? text.template : text.pastProject}
                        </label>
                        <select id={`${id}-source`} className="input" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                          {sources[start].map((item) => (
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
                        <button type="button" className="border-0 bg-transparent p-0 text-accent underline" onClick={() => setInclude(preview.map((_, index) => index))}>
                          {text.selectAll}
                        </button>
                        <button type="button" className="border-0 bg-transparent p-0 text-accent underline" onClick={() => setInclude([])}>
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
                  <p className="text-sm text-fg-muted">{text.noPast}</p>
                )}
              </div>
            )}
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="form-submit" disabled={busy || (!request.event && !form.title.trim()) || (ownEvent && !form.due)}>
              {text.submit}
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
