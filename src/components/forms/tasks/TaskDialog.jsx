/**
 * The dialog of a single task (a card of type 'task' with one task, isSingleTask): who does it, status, deadline, team,
 * priority, repeat and description in one form, plus turning it into a project, its log and deleting it. Projects open
 * in ProjectPanel instead. Saving sends only what changed since the dialog opened, without an optimistic change, so a
 * refusal keeps what was typed; a change from elsewhere fills the fields nobody touched here. Closing with unsaved
 * changes asks first (DiscardDialog), "Abbrechen" does not. The card's team is the task's team: a new team goes to the
 * card, and a task with a team of its own then follows it again.
 * Props: project (the card, or null = closed), copy (workspace copy), locale, me, members, membersById, run, onClose.
 */
import React, { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Trash2, X } from 'lucide-react'
import { changedFields } from '../../../lib/liveUpdates'
import {
  applyMemberChange,
  isClosed,
  memberChange,
  PRIORITIES,
  REPEATS,
  TASK_STATUSES,
  taskStatus,
  taskTeam,
  TEXT_MAX,
  TITLE_MAX,
} from '../../../lib/tasks'
import ActivityLog from './ActivityLog'
import { DANGER_BUTTON, DiscardDialog, fill, PRIMARY_BUTTON, TOOL_BUTTON, useDiscardGuard } from '../memberUi'
import { Avatar, ICON_BUTTON, INPUT, LABEL, MemberPicker, SELECT, shortName, TaskCheck, TeamSelect, teamName } from './taskUi'

/** The values the form starts from: the team is the one the task shows, its own or its card's. */
const fieldsOf = (project) => {
  const task = project.tasks[0]
  return {
    title: task.title,
    description: task.description,
    due: task.due,
    status: taskStatus(task),
    team: taskTeam(task, project),
    priority: task.priority,
    repeat: task.repeat ?? '',
    assignees: task.assignees,
  }
}

/**
 * What the form changed since `start`. The server trims what it stores, so a trailing space is no change, and people
 * count as one change of the list: taking someone out and back in changes nothing.
 */
function changesOf(start, form) {
  const { assignees: before, ...startFields } = start
  const { assignees: after, ...formFields } = form
  const fields = changedFields(startFields, { ...formFields, title: formFields.title.trim(), description: formFields.description.trim() })
  const people = memberChange(before, after)
  const peopleChanged = people.add.length > 0 || people.remove.length > 0
  return { fields, people, keys: [...Object.keys(fields), ...(peopleChanged ? ['assignees'] : [])] }
}

/**
 * The form after the stored values moved from `previous` to `next`: fields the member touched keep what they typed,
 * the others take the new values. People merge both ways, so someone added elsewhere is not taken out by saving here.
 */
function merged(previous, form, next) {
  const { assignees, ...touched } = changedFields(previous, form)
  return { ...next, ...touched, assignees: applyMemberChange(next.assignees, memberChange(previous.assignees, form.assignees)) }
}

/** The four places of a task, side by side; the row wraps where the dialog is narrow. */
function StatusChoice({ labelId, labels, value, onChange }) {
  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-0.5 rounded-lg border border-border-strong bg-bg-subtle p-0.5">
      {TASK_STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          aria-pressed={value === status}
          onClick={() => onChange(status)}
          className={`h-9 flex-1 whitespace-nowrap rounded-md border-0 px-2.5 py-0 text-xs ${
            value === status ? 'bg-fg font-medium text-bg' : 'bg-transparent text-fg-muted hover:bg-bg hover:text-fg'
          }`}
        >
          {labels[status]}
        </button>
      ))}
    </div>
  )
}

export default function TaskDialog({ project, copy, locale, me, members, membersById, run, onClose }) {
  const text = copy.taskDialog
  const dialog = useRef(null)
  const closeButton = useRef(null)
  const id = useId()
  const [busy, setBusy] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  // Derived while rendering, so the form is there in the render that opens the dialog. `values` are the stored ones as
  // a string: when they change, the fields the member did not touch take them over.
  const projectId = project?.id ?? null
  const values = project ? JSON.stringify(fieldsOf(project)) : null
  const [draft, setDraft] = useState({ projectId: null, values: null, start: null, form: null })
  if (draft.projectId !== projectId || draft.values !== values) {
    const next = project ? fieldsOf(project) : null
    const form = draft.projectId === projectId && next ? merged(draft.start, draft.form, next) : next
    setDraft({ projectId, values, start: next, form })
  }
  const { start, form } = draft
  const changes = form ? changesOf(start, form) : { keys: [] }
  const guard = useDiscardGuard(dialog, changes.keys.length > 0)

  useEffect(() => {
    const element = dialog.current
    if (projectId && !element.open) {
      element.showModal()
      // showModal focuses the first control, the check; a look at the task starts at the top instead.
      closeButton.current.focus()
    }
    if (!projectId && element.open) element.close()
    setLogOpen(false)
  }, [projectId])

  const task = project?.tasks[0]
  const set = (key, value) => setDraft((current) => ({ ...current, form: { ...current.form, [key]: value } }))
  const change = (key) => (e) => set(key, e.target.value)

  // One request per kind of change: the team belongs to the card, and MongoDB adds to a list and pulls from it only in
  // separate updates. Each step waits for the one before, and the first refusal stops the rest.
  const saveChanges = async () => {
    const { fields, people } = changesOf(start, form)
    const { team, ...taskFields } = fields
    const taskStep = (patch) => ({ action: 'updateTask', id: project.id, taskId: task.id, patch })
    const steps = []
    if (team !== undefined) steps.push({ action: 'update', id: project.id, patch: { team } })
    const patch = {
      ...taskFields,
      ...(team !== undefined && task.team && { team: '' }),
      ...(people.add.length > 0 && { assignees: { add: people.add, remove: [] } }),
    }
    if (Object.keys(patch).length) steps.push(taskStep(patch))
    if (people.remove.length) steps.push(taskStep({ assignees: { add: [], remove: people.remove } }))
    for (const step of steps) if (!(await run(step))) return false
    return true
  }
  const save = async (e) => {
    e.preventDefault()
    if (!changes.keys.length) return dialog.current.close()
    setBusy(true)
    const saved = await saveChanges()
    setBusy(false)
    if (saved) dialog.current.close()
  }
  // Saved first, so nothing typed is lost. The answer makes the card a project, which TaskWorkspace opens in the panel.
  const promote = async () => {
    setBusy(true)
    if (await saveChanges()) await run({ action: 'promote', id: project.id })
    setBusy(false)
  }
  // The card goes with its only task, which closes the dialog; the toast offers the undo.
  const remove = () => run({ action: 'removeTask', id: project.id, taskId: task.id }, (list) => list.filter((item) => item.id !== project.id))
  const restore = () =>
    run({ action: 'archive', id: project.id, archived: false }, (list) => list.map((item) => (item.id === project.id ? { ...item, archived: false } : item)))

  const savedTeam = project && taskTeam(task, project)
  const fieldNames = {
    title: copy.panel.title,
    description: copy.panel.description,
    due: copy.panel.due,
    status: copy.panel.status,
    team: copy.panel.team,
    priority: copy.panel.priority,
    repeat: copy.panel.repeat,
    assignees: text.who,
  }
  // Someone who left the club stays on the task until they are taken out, so they get a name to do that with.
  const person = (memberId) => membersById.get(memberId) ?? { id: memberId, name: copy.activity.someone, photo: null }

  return (
    <>
      <dialog
        ref={dialog}
        aria-label={task?.title}
        onClose={onClose}
        onCancel={guard.onCancel}
        // A click on the backdrop lands on the dialog element itself.
        onClick={(e) => e.target === e.currentTarget && guard.requestClose()}
        className="w-[min(40rem,calc(100vw-2rem))] rounded-card border border-border bg-bg p-0 text-fg backdrop:bg-black/60"
      >
        {project && form && (
          <form key={project.id} onSubmit={save} className="flex flex-col gap-4 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-fg-muted">
                {copy.types.task}
                {savedTeam && ` · ${teamName(copy, savedTeam)}`}
              </p>
              <button ref={closeButton} type="button" className={`${ICON_BUTTON} h-10 w-10`} aria-label={copy.panel.close} onClick={guard.requestClose}>
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <div className="-mt-2 flex items-center gap-2">
              <TaskCheck
                checked={form.status === 'done'}
                onChange={(done) => set('status', done ? 'done' : 'backlog')}
                label={fill(copy.panel.markDone, { title: form.title })}
              />
              <label htmlFor={`${id}-title`} className="sr-only">
                {copy.panel.title}
              </label>
              <input
                id={`${id}-title`}
                required
                maxLength={TITLE_MAX}
                value={form.title}
                onChange={change('title')}
                className={`h-11 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-lg font-semibold hover:border-border-strong sm:text-xl focus-visible:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                  isClosed(form.status) ? 'text-fg-muted line-through' : 'text-fg'
                }`}
              />
            </div>

            {project.archived && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-bg-subtle p-3 text-sm text-fg-muted">
                <p className="min-w-0 flex-1">{text.archivedNote}</p>
                {project.mayArchive && (
                  <button type="button" className={`${TOOL_BUTTON} h-9`} onClick={restore}>
                    {copy.panel.restore}
                  </button>
                )}
              </div>
            )}

            <div>
              <p id={`${id}-who`} className={LABEL}>
                {text.who}
              </p>
              <ul role="list" aria-labelledby={`${id}-who`} className="flex flex-wrap items-center gap-1.5">
                {form.assignees.map(person).map((member) => (
                  <li key={member.id} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-bg-subtle pl-1.5 pr-0.5 text-sm">
                    <Avatar member={member} decorative />
                    {shortName(member.name)}
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent p-0 text-fg-muted hover:text-fg"
                      aria-label={fill(text.removePerson, { name: member.name })}
                      onClick={() => set('assignees', form.assignees.filter((item) => item !== member.id))}
                    >
                      <X aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
                <li>
                  <MemberPicker
                    members={members}
                    membersById={membersById}
                    selected={form.assignees}
                    team={form.team}
                    onChange={(next) => set('assignees', next)}
                    copy={copy.people}
                    me={me}
                    label={text.who}
                    addLabel={text.addPerson}
                  />
                </li>
              </ul>
            </div>

            <div>
              <p id={`${id}-status`} className={LABEL}>
                {copy.panel.status}
              </p>
              <StatusChoice labelId={`${id}-status`} labels={copy.taskStatuses} value={form.status} onChange={(status) => set('status', status)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${id}-due`} className={LABEL}>
                  {copy.panel.due}
                </label>
                <input id={`${id}-due`} type="date" className={INPUT} value={form.due} onChange={change('due')} />
              </div>
              <div>
                <label htmlFor={`${id}-team`} className={LABEL}>
                  {copy.panel.team}
                </label>
                <TeamSelect
                  id={`${id}-team`}
                  className={`${SELECT} h-10 w-full`}
                  value={form.team}
                  onChange={change('team')}
                  teams={copy.teams}
                  empty={copy.teamTabs.none}
                  all={copy.teamTabs.all}
                />
              </div>
              <div>
                <label htmlFor={`${id}-priority`} className={LABEL}>
                  {copy.panel.priority}
                </label>
                <select id={`${id}-priority`} className={`${SELECT} h-10 w-full`} value={form.priority} onChange={change('priority')}>
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {copy.priorities[priority]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`${id}-repeat`} className={LABEL}>
                  {copy.panel.repeat}
                </label>
                <select
                  id={`${id}-repeat`}
                  className={`${SELECT} h-10 w-full`}
                  value={form.repeat}
                  onChange={change('repeat')}
                  aria-describedby={form.repeat ? `${id}-repeat-hint` : undefined}
                >
                  {REPEATS.map((repeat) => (
                    <option key={repeat} value={repeat}>
                      {copy.repeats[repeat]}
                    </option>
                  ))}
                </select>
                {form.repeat && (
                  <p id={`${id}-repeat-hint`} className="mt-1 text-xs text-fg-muted">
                    {copy.panel.repeatHint}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor={`${id}-description`} className={LABEL}>
                {copy.panel.description}
              </label>
              <textarea
                id={`${id}-description`}
                className={`${INPUT} h-auto min-h-24 py-2`}
                maxLength={TEXT_MAX}
                value={form.description}
                onChange={change('description')}
              />
            </div>

            {!project.archived && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-bg-subtle p-3">
                <p className="min-w-0 flex-[1_1_16rem] text-sm text-fg-muted">{text.promoteHint}</p>
                <button type="button" className={`${TOOL_BUTTON} h-9`} disabled={busy || !form.title.trim()} onClick={promote}>
                  {text.promote}
                </button>
              </div>
            )}

            <details className="group border-0 border-t border-solid border-border pt-3" onToggle={(e) => setLogOpen(e.currentTarget.open)}>
              <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-fg-muted">
                <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
                {copy.panel.tabs.activity}
              </summary>
              {logOpen && (
                <div className="mt-3">
                  <ActivityLog project={project} copy={copy} locale={locale} membersById={membersById} />
                </div>
              )}
            </details>

            <div className="flex flex-wrap items-center gap-2 border-0 border-t border-solid border-border pt-4">
              {task.mayRemove && (
                <button type="button" className={DANGER_BUTTON} onClick={remove} aria-label={text.remove}>
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                  <span aria-hidden="true" className="max-sm:hidden">
                    {text.remove}
                  </span>
                </button>
              )}
              {/* Its own row on phones, where it would squeeze between the buttons. */}
              {changes.keys.length > 0 && (
                <p className="min-w-0 text-caption text-fg-muted max-sm:order-first max-sm:basis-full sm:flex-1 sm:text-right">
                  {fill(text.changed, { fields: changes.keys.map((key) => fieldNames[key]).join(', ') })}
                </p>
              )}
              <button type="button" className={`${TOOL_BUTTON} ml-auto`} onClick={() => dialog.current.close()}>
                {copy.panel.cancel}
              </button>
              <button type="submit" className={PRIMARY_BUTTON} disabled={busy || !form.title.trim()}>
                {copy.panel.save}
              </button>
            </div>
          </form>
        )}
      </dialog>
      <DiscardDialog dialogRef={guard.confirm} copy={copy.discard} onDiscard={guard.discard} />
    </>
  )
}
