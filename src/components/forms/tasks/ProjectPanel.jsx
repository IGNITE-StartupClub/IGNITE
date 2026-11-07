/**
 * The detail view of one project: a modal panel on the right from md on, full screen on phones. The header carries
 * type, status, date, team, leads, progress and the public event link; the tabs show the tasks (quick add, check off,
 * assign, edit, order), the project details and the activity log the server writes. A task
 * follows the team of its project unless its editor gives it another one.
 * Every change goes through `run` (TaskWorkspace), which applies it optimistically and rolls it back on failure.
 * Props: project (summary or null = closed), copy (workspace copy), locale, today, me, members, membersById, run,
 * onClose(), onStatus(project, status) (the board's move, which asks before "done").
 */
import React, { useEffect, useId, useRef, useState } from 'react'
import { CalendarDays, ChevronDown, ExternalLink, MoreHorizontal, Plus, X } from 'lucide-react'
import {
  applyMemberChange,
  isOverdue,
  memberChange,
  patchedTask,
  PRIORITIES,
  PROJECT_STATUSES,
  progress,
  projectDay,
  projectStatus,
  TASK_STATUSES,
  TEXT_MAX,
  TITLE_MAX,
} from '../../../lib/tasks'
import { changedFields } from '../../../lib/liveUpdates'
import { BADGE, fill, FormDialog, Menu, MENU_ITEM, PRIMARY_BUTTON, TOOL_BUTTON } from '../memberUi'
import {
  Avatar,
  AvatarStack,
  berlinTime,
  dateTime,
  ICON_BUTTON,
  INPUT,
  LABEL,
  longDay,
  MemberPicker,
  ProgressBar,
  SELECT,
  shortDay,
  STATUS_TONE,
  TaskCheck,
  TeamSelect,
  TYPE_TEXT,
} from './taskUi'

const PRIORITY_RANK = { high: 0, normal: 1, low: 2 }
const SORTS = {
  manual: () => 0,
  due: (a, b) => (a.due || '9999').localeCompare(b.due || '9999'),
  priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
}
const TEXTAREA = `${INPUT} h-auto min-h-20 py-2`

function TaskEditor({ task, projectTeam, copy, onSave, onCancel }) {
  // Kept from the moment the editor opened: only what the member changes since then is saved.
  const [start] = useState(() => ({
    title: task.title,
    description: task.description,
    due: task.due,
    priority: task.priority,
    required: task.required,
    team: task.team,
    status: task.status,
  }))
  const [form, setForm] = useState(start)
  const id = useId()
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  return (
    <form
      className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-bg-subtle p-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(changedFields(start, form))
      }}
    >
      <div>
        <label htmlFor={`${id}-title`} className={LABEL}>
          {copy.taskTitle}
        </label>
        <input id={`${id}-title`} className={INPUT} required maxLength={TITLE_MAX} value={form.title} onChange={set('title')} />
      </div>
      <div>
        <label htmlFor={`${id}-description`} className={LABEL}>
          {copy.description}
        </label>
        <textarea id={`${id}-description`} className={TEXTAREA} maxLength={TEXT_MAX} value={form.description} onChange={set('description')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-due`} className={LABEL}>
            {copy.due}
          </label>
          <input id={`${id}-due`} type="date" className={INPUT} value={form.due} onChange={set('due')} />
        </div>
        <div>
          <label htmlFor={`${id}-priority`} className={LABEL}>
            {copy.priority}
          </label>
          <select id={`${id}-priority`} className={`${SELECT} h-10 w-full`} value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {copy.priorities[priority]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-status`} className={LABEL}>
            {copy.status}
          </label>
          <select id={`${id}-status`} className={`${SELECT} h-10 w-full`} value={form.status} onChange={set('status')}>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {copy.taskStatuses[status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-team`} className={LABEL}>
            {copy.team}
          </label>
          <TeamSelect
            id={`${id}-team`}
            className={`${SELECT} h-10 w-full`}
            value={form.team}
            onChange={set('team')}
            teams={copy.teams}
            empty={projectTeam ? `${copy.followsProject} (${copy.teams[projectTeam]})` : copy.followsProject}
          />
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]" checked={form.required} onChange={set('required')} />
        <span>
          {copy.required}
          <span className="block text-xs text-fg-muted">{copy.requiredHint}</span>
        </span>
      </label>
      <div className="flex gap-2">
        <button type="submit" className={`${PRIMARY_BUTTON} h-9`}>
          {copy.save}
        </button>
        <button type="button" className={`${TOOL_BUTTON} h-9`} onClick={onCancel}>
          {copy.cancel}
        </button>
      </div>
    </form>
  )
}

function TaskRow({ task, projectTeam, copy, locale, today, me, members, membersById, onPatch, onRemove, onMove, canMove }) {
  const [editing, setEditing] = useState(false)
  const overdue = isOverdue(task, today)
  const panel = { ...copy.panel, priorities: copy.priorities, teams: copy.teams, taskStatuses: copy.taskStatuses }
  const otherTeam = task.team && task.team !== projectTeam
  return (
    <li className="rounded-lg px-2 py-2 hover:bg-bg-subtle">
      <div className="flex items-start gap-3">
        <TaskCheck checked={task.done} onChange={(done) => onPatch({ done })} label={fill(copy.panel.markDone, { title: task.title })} />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className={`block border-0 bg-transparent p-0 text-left text-sm font-medium ${task.done ? 'text-fg-muted line-through' : 'text-fg'}`}
            onClick={() => setEditing(!editing)}
            aria-expanded={editing}
          >
            {task.title}
          </button>
          {task.description && !editing && <p className="mt-0.5 line-clamp-2 text-xs text-fg-muted">{task.description}</p>}
          {(task.due || task.priority !== 'normal' || task.required || otherTeam) && (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              {task.due && (
                <span className={overdue ? 'font-medium text-danger' : 'text-fg-muted'}>
                  {fill(copy.panel.dueOn, { date: shortDay(task.due, locale) })}
                </span>
              )}
              {task.priority !== 'normal' && (
                <span className={`${BADGE} py-0 ${task.priority === 'high' ? 'border-danger text-danger' : 'border-border-strong text-fg-muted'}`}>
                  {copy.priorities[task.priority]}
                </span>
              )}
              {task.required && <span className={`${BADGE} border-border-strong py-0 text-fg-muted`}>{copy.panel.required}</span>}
              {otherTeam && <span className={`${BADGE} border-border-strong py-0 text-fg-muted`}>{copy.teams[task.team]}</span>}
            </p>
          )}
        </div>
        <MemberPicker
          compact
          members={members}
          membersById={membersById}
          selected={task.assignees}
          team={task.team || projectTeam}
          onChange={(assignees) => onPatch({ assignees: memberChange(task.assignees, assignees) })}
          copy={copy.people}
          me={me}
          label={copy.createDialog.assignees}
        />
        <Menu
          label={<MoreHorizontal aria-hidden="true" className="h-4 w-4" />}
          ariaLabel={fill(copy.panel.taskMenu, { title: task.title })}
          className={ICON_BUTTON}
        >
          {(close) => (
            <>
              <button
                type="button"
                className={MENU_ITEM}
                onClick={() => {
                  close()
                  setEditing(true)
                }}
              >
                {copy.panel.edit}
              </button>
              {canMove && (
                <>
                  <button
                    type="button"
                    className={MENU_ITEM}
                    onClick={() => {
                      close()
                      onMove(-1)
                    }}
                  >
                    {copy.panel.moveUp}
                  </button>
                  <button
                    type="button"
                    className={MENU_ITEM}
                    onClick={() => {
                      close()
                      onMove(1)
                    }}
                  >
                    {copy.panel.moveDown}
                  </button>
                </>
              )}
              {task.mayRemove && (
                <button
                  type="button"
                  className={`${MENU_ITEM} text-danger`}
                  onClick={() => {
                    close()
                    onRemove()
                  }}
                >
                  {copy.panel.deleteTask}
                </button>
              )}
            </>
          )}
        </Menu>
      </div>
      {editing && (
        <TaskEditor
          task={task}
          projectTeam={projectTeam}
          copy={panel}
          onCancel={() => setEditing(false)}
          onSave={(fields) => {
            setEditing(false)
            if (Object.keys(fields).length) onPatch(fields)
          }}
        />
      )}
    </li>
  )
}

function TasksTab({ project, copy, locale, today, me, members, membersById, run, change }) {
  const [draft, setDraft] = useState('')
  const [sort, setSort] = useState('manual')
  const sorted = [...project.tasks].sort(SORTS[sort])
  const open = sorted.filter((task) => !task.done)
  const done = sorted.filter((task) => task.done)

  const add = async (e) => {
    e.preventDefault()
    const title = draft.trim()
    if (!title) return
    setDraft('')
    const saved = await run({
      action: 'addTask',
      id: project.id,
      task: { title, description: '', due: '', priority: 'normal', required: false, assignees: [] },
    })
    if (!saved) setDraft(title)
  }
  const patch = (task, fields) =>
    run(
      { action: 'updateTask', id: project.id, taskId: task.id, patch: fields },
      change((current) => ({
        ...current,
        tasks: current.tasks.map((item) => (item.id === task.id ? patchedTask(item, fields) : item)),
      })),
    )
  const remove = (task) =>
    run(
      { action: 'removeTask', id: project.id, taskId: task.id },
      change((current) => ({ ...current, tasks: current.tasks.filter((item) => item.id !== task.id) })),
    )
  // Swaps the task with its neighbour in the visible list (open tasks among open ones).
  const move = (list, task, step) => {
    const index = list.indexOf(task)
    const neighbour = list[index + step]
    if (!neighbour) return
    const ids = project.tasks.map((item) => item.id)
    const [a, b] = [ids.indexOf(task.id), ids.indexOf(neighbour.id)]
    ;[ids[a], ids[b]] = [ids[b], ids[a]]
    run(
      { action: 'reorder', id: project.id, order: ids },
      change((current) => ({ ...current, tasks: ids.map((id) => current.tasks.find((item) => item.id === id)).filter(Boolean) })),
    )
  }
  const row = (list) => (task) => (
    <TaskRow
      key={task.id}
      task={task}
      projectTeam={project.team}
      copy={copy}
      locale={locale}
      today={today}
      me={me}
      members={members}
      membersById={membersById}
      onPatch={(fields) => patch(task, fields)}
      onRemove={() => remove(task)}
      onMove={(step) => move(list, task, step)}
      canMove={sort === 'manual' && list.length > 1}
    />
  )

  return (
    <div>
      <form onSubmit={add} className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{copy.panel.addTaskLabel}</span>
          <input
            className={INPUT}
            value={draft}
            maxLength={TITLE_MAX}
            placeholder={copy.panel.addTask}
            onChange={(e) => setDraft(e.target.value)}
            disabled={project.archived}
          />
        </label>
        <button type="submit" className={`${PRIMARY_BUTTON} shrink-0`} disabled={project.archived || !draft.trim()}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">{copy.panel.add}</span>
        </button>
      </form>
      {project.tasks.length > 1 && (
        <label className="mt-3 flex items-center justify-end gap-2 text-xs text-fg-muted">
          {copy.panel.sort.label}
          <select className={`${SELECT} h-8 text-xs`} value={sort} onChange={(e) => setSort(e.target.value)}>
            {Object.keys(SORTS).map((key) => (
              <option key={key} value={key}>
                {copy.panel.sort[key]}
              </option>
            ))}
          </select>
        </label>
      )}
      {project.tasks.length ? (
        <ul role="list" className="-mx-2 mt-2 flex flex-col">
          {open.map(row(open))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-fg-muted">{copy.panel.emptyTasks}</p>
      )}
      {done.length > 0 && (
        <details className="group mt-4 border-t border-border pt-3">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-fg-muted">
            <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
            {fill(copy.panel.doneSection, { count: done.length })}
          </summary>
          <ul role="list" className="-mx-2 mt-2 flex flex-col">
            {done.map(row(done))}
          </ul>
        </details>
      )}
    </div>
  )
}

function DetailsTab({ project, copy, locale, run, change }) {
  const id = useId()
  const ownEvent = project.type === 'event' && !project.event
  const fields = () => ({ title: project.title, description: project.description, due: project.due, time: project.time, place: project.place })
  const [form, setForm] = useState(fields)
  const start = useRef(form)
  // A change from elsewhere fills the fields nobody touched here; what the member is typing stays.
  useEffect(() => {
    const next = fields()
    const previous = start.current
    start.current = next
    setForm((current) => ({ ...next, ...changedFields(previous, current) }))
  }, [project.title, project.description, project.due, project.time, project.place])
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const patch = changedFields(fields(), form)
  const changed = Object.keys(patch).length > 0

  const save = (e) => {
    e.preventDefault()
    run({ action: 'update', id: project.id, patch }, change((current) => ({ ...current, ...patch })))
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={save} className="flex flex-col gap-3">
        <div>
          <label htmlFor={`${id}-title`} className={LABEL}>
            {copy.panel.title}
          </label>
          <input id={`${id}-title`} className={INPUT} required maxLength={TITLE_MAX} value={form.title} onChange={set('title')} />
        </div>
        <div>
          <label htmlFor={`${id}-description`} className={LABEL}>
            {copy.panel.description}
          </label>
          <textarea id={`${id}-description`} className={`${TEXTAREA} min-h-28`} maxLength={TEXT_MAX} value={form.description} onChange={set('description')} />
        </div>
        {!project.event && (
          <div className="max-w-56">
            <label htmlFor={`${id}-due`} className={LABEL}>
              {project.type === 'event' ? copy.panel.eventDate : copy.panel.due}
            </label>
            <input id={`${id}-due`} type="date" className={INPUT} required={ownEvent} value={form.due} onChange={set('due')} />
          </div>
        )}
        {ownEvent && (
          <div className="flex flex-wrap gap-3">
            <div className="w-36">
              <label htmlFor={`${id}-time`} className={LABEL}>
                {copy.panel.time}
              </label>
              <input id={`${id}-time`} type="time" className={INPUT} value={form.time} onChange={set('time')} />
            </div>
            <div className="min-w-48 flex-1">
              <label htmlFor={`${id}-place`} className={LABEL}>
                {copy.panel.place}
              </label>
              <input id={`${id}-place`} className={INPUT} maxLength={TITLE_MAX} value={form.place} onChange={set('place')} />
            </div>
          </div>
        )}
        {changed && (
          <div className="flex gap-2">
            <button type="submit" className={`${PRIMARY_BUTTON} h-9`}>
              {copy.panel.save}
            </button>
            <button type="button" className={`${TOOL_BUTTON} h-9`} onClick={() => setForm(fields())}>
              {copy.panel.cancel}
            </button>
          </div>
        )}
      </form>

      {project.event && (
        <div className="rounded-lg border border-border bg-bg-subtle p-4 text-sm">
          <p className="font-medium">{project.event.title}</p>
          <p className="mt-1 text-fg-muted">
            {longDay(project.eventDay, locale)} · {berlinTime(project.event.startAt, locale)}
            {project.event.location && ` · ${project.event.location}`}
          </p>
          {project.event.url && (
            <a href={project.event.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-accent underline">
              {copy.panel.publicEvent}
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          )}
          {/* Only own events have a date to go back to. */}
          {project.due && (
            <div className="mt-3 border-0 border-t border-solid border-border pt-3">
              <button type="button" className={`${TOOL_BUTTON} h-9`} onClick={() => run({ action: 'unlinkEvent', id: project.id })}>
                {copy.panel.unlink}
              </button>
              <p className="mt-1.5 text-caption text-fg-muted">{copy.panel.unlinkHint}</p>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-fg-muted">
        {fill(copy.panel.created, { date: dateTime(project.createdAt, locale) })}
        {project.completedAt && ` · ${fill(copy.panel.completed, { date: dateTime(project.completedAt, locale) })}`}
      </p>
    </div>
  )
}

function ActivityTab({ project, copy, locale, membersById }) {
  const [entries, setEntries] = useState(null) // null while the first answer is on its way
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let current = true
    fetch(`/api/members/tasks?activity=${encodeURIComponent(project.id)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Activity failed with ${res.status}`))))
      .then((data) => {
        if (!current) return
        setEntries(data.activity)
        setFailed(false)
      })
      .catch((err) => {
        console.error(err)
        if (current) setFailed(true)
      })
    return () => {
      current = false
    }
  }, [project.id, project.updatedAt])
  const name = (memberId) => (memberId === 'system' ? copy.activity.system : (membersById.get(memberId)?.name ?? copy.activity.someone))
  if (failed) return <p className="text-sm text-fg-muted">{copy.results.error}</p>
  if (!entries) return <p className="text-sm text-fg-muted">{copy.panel.loadingActivity}</p>
  if (!entries.length) return <p className="text-sm text-fg-muted">{copy.panel.noActivity}</p>
  return (
    <ol className="flex flex-col gap-4">
      {entries.map((entry, index) => {
        const actor = membersById.get(entry.actor)
        const detail = entry.action === 'status' ? (copy.statuses[projectStatus(entry.detail)] ?? entry.detail) : entry.detail
        return (
          <li key={`${entry.at}-${index}`} className="flex gap-3 text-sm">
            {actor ? (
              <Avatar member={actor} size="md" decorative />
            ) : (
              <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded-full bg-bg-subtle" />
            )}
            <div>
              <p>{fill(copy.activity[entry.action] ?? '', { actor: name(entry.actor), detail, member: name(entry.member) })}</p>
              <p className="text-xs text-fg-muted">{dateTime(entry.at, locale)}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function ProjectPanel({ project, copy, locale, today, me, members, membersById, run, onClose, onStatus }) {
  const dialog = useRef(null)
  const closeButton = useRef(null)
  const templateDialog = useRef(null)
  const id = useId()
  const [tab, setTab] = useState('tasks')
  const [templateName, setTemplateName] = useState('')
  const [templateSaved, setTemplateSaved] = useState(false)
  const projectId = project?.id

  useEffect(() => {
    const element = dialog.current
    if (projectId && !element.open) {
      element.showModal()
      // showModal focuses the first control, the status select; React's autoFocus sets no attribute it could find.
      closeButton.current.focus()
    }
    if (!projectId && element.open) element.close()
    setTab('tasks')
  }, [projectId])

  // Applies fn to this project in the project list: the optimistic version of a change.
  const change = (fn) => (projects) => projects.map((item) => (item.id === projectId ? fn(item) : item))
  const done = project && progress(project.tasks)
  const day = project && projectDay(project)

  const setTeam = (team) => run({ action: 'update', id: project.id, patch: { team } }, change((current) => ({ ...current, team })))
  const setLeads = (next) => {
    const leads = memberChange(project.leads, next)
    run(
      { action: 'update', id: project.id, patch: { leads } },
      change((current) => ({ ...current, leads: applyMemberChange(current.leads, leads) })),
    )
  }
  const archive = () =>
    run({ action: 'archive', id: project.id, archived: !project.archived }, change((current) => ({ ...current, archived: !current.archived })))
  const remove = async () => {
    if (!window.confirm(fill(copy.panel.confirmDelete, { title: project.title }))) return
    if (await run({ action: 'delete', id: project.id })) onClose()
  }
  const saveTemplate = async (e) => {
    e.preventDefault()
    if (await run({ action: 'saveTemplate', id: project.id, name: templateName.trim() })) {
      setTemplateSaved(true)
      templateDialog.current.close()
    }
  }

  return (
    <>
      <dialog
        ref={dialog}
        aria-labelledby={`${id}-title`}
        onClose={onClose}
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="fixed inset-0 m-0 ml-auto h-dvh max-h-none w-full max-w-none border-0 bg-bg p-0 text-fg backdrop:bg-black/50 md:w-[36rem] md:border-l md:border-solid md:border-border"
      >
        {project && (
          <div className="flex h-full flex-col">
            <header className="border-b border-border p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <span className={`text-2xs font-semibold uppercase tracking-wider ${TYPE_TEXT[project.type]}`}>
                  {copy.types[project.type]}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  {/* A single task has its own status on the board; a project status beside it would only compete. */}
                  {project.type !== 'task' && (
                    <>
                      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUS_TONE[project.status]}`} />
                      <select
                        aria-label={copy.panel.status}
                        className={`${SELECT} h-8 text-xs`}
                        value={project.status}
                        disabled={project.archived}
                        onChange={(e) => onStatus(project, e.target.value)}
                      >
                        {PROJECT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {copy.statuses[status]}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </span>
                <Menu label={<MoreHorizontal aria-hidden="true" className="h-4 w-4" />} ariaLabel={copy.panel.projectMenu} className={ICON_BUTTON}>
                  {(close) => (
                    <>
                      {project.tasks.length > 0 && (
                        <button
                          type="button"
                          className={MENU_ITEM}
                          onClick={() => {
                            close()
                            setTemplateName(project.title)
                            setTemplateSaved(false)
                            templateDialog.current.showModal()
                          }}
                        >
                          {copy.panel.saveTemplate}
                        </button>
                      )}
                      {project.mayArchive && (
                        <button
                          type="button"
                          className={MENU_ITEM}
                          onClick={() => {
                            close()
                            archive()
                          }}
                        >
                          {project.archived ? copy.panel.restore : copy.panel.archive}
                        </button>
                      )}
                      {project.mayDelete && (
                        <button
                          type="button"
                          className={`${MENU_ITEM} text-danger`}
                          onClick={() => {
                            close()
                            remove()
                          }}
                        >
                          {copy.panel.delete}
                        </button>
                      )}
                    </>
                  )}
                </Menu>
                <button ref={closeButton} type="button" className={ICON_BUTTON} aria-label={copy.panel.close} onClick={() => dialog.current.close()}>
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
              <h2 id={`${id}-title`} className="mt-2 text-xl font-semibold leading-snug">
                {project.title}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                {day && (
                  <span className="inline-flex items-center gap-1.5 text-fg-muted">
                    <CalendarDays aria-hidden="true" className="h-4 w-4" />
                    {longDay(day, locale)}
                    {project.event ? ` · ${berlinTime(project.event.startAt, locale)}` : project.time && ` · ${project.time}`}
                  </span>
                )}
                <label className="inline-flex items-center gap-2">
                  <span className="text-fg-muted">{copy.panel.team}</span>
                  <TeamSelect
                    className={`${SELECT} h-8 text-xs`}
                    value={project.team}
                    disabled={project.archived}
                    onChange={(e) => setTeam(e.target.value)}
                    teams={copy.teams}
                    empty={copy.teamTabs.none}
                  />
                </label>
                <span className="inline-flex items-center gap-2">
                  <span className="text-fg-muted">{copy.panel.leads}</span>
                  {/* Leads may archive, so only those who already may archive choose them (checked on the server too). */}
                  {project.mayArchive ? (
                    <MemberPicker
                      members={members}
                      membersById={membersById}
                      selected={project.leads}
                      team={project.team}
                      onChange={setLeads}
                      copy={copy.people}
                      me={me}
                      label={copy.panel.leads}
                    />
                  ) : project.leads.length ? (
                    <AvatarStack ids={project.leads} membersById={membersById} copy={copy.people} max={4} />
                  ) : (
                    <span>{copy.people.nobody}</span>
                  )}
                </span>
                {project.event?.url && (
                  <a href={project.event.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent underline">
                    {copy.panel.publicEvent}
                    <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <ProgressBar percent={done.percent} tone={STATUS_TONE[project.status]} label={copy.board.progress} />
                <span className="shrink-0 text-xs text-fg-muted">{done.total ? fill(copy.panel.progress, done) : copy.panel.noProgress}</span>
              </div>
              {project.event?.missing && <p className="mt-3 rounded-lg bg-bg-subtle p-3 text-sm text-fg-muted">{copy.panel.eventMissing}</p>}
              {project.archived && <p className="mt-3 rounded-lg bg-bg-subtle p-3 text-sm text-fg-muted">{copy.panel.archivedNote}</p>}
              {templateSaved && (
                <p role="status" className="mt-3 text-sm text-success">
                  {copy.panel.templateSaved}
                </p>
              )}
            </header>

            <div role="tablist" aria-label={project.title} className="flex gap-1 border-b border-border px-4 sm:px-5">
              {['tasks', 'details', 'activity'].map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${key}`}
                  aria-selected={tab === key}
                  aria-controls={`${id}-panel`}
                  onClick={() => setTab(key)}
                  className={`-mb-px rounded-none border-0 border-b-2 border-solid bg-transparent px-3 py-2.5 text-sm font-medium ${
                    tab === key ? 'border-fg text-fg' : 'border-transparent text-fg-muted hover:text-fg'
                  }`}
                >
                  {copy.panel.tabs[key]}
                  {key === 'tasks' && done.total > 0 && <span className="ml-1.5 text-xs text-fg-muted">{done.total - done.done}</span>}
                </button>
              ))}
            </div>

            <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${tab}`} className="flex-1 overflow-y-auto p-4 sm:p-5">
              {tab === 'tasks' && (
                <TasksTab
                  project={project}
                  copy={copy}
                  locale={locale}
                  today={today}
                  me={me}
                  members={members}
                  membersById={membersById}
                  run={run}
                  change={change}
                />
              )}
              {tab === 'details' && <DetailsTab key={project.id} project={project} copy={copy} locale={locale} run={run} change={change} />}
              {tab === 'activity' && <ActivityTab project={project} copy={copy} locale={locale} membersById={membersById} />}
            </div>
          </div>
        )}
      </dialog>

      <FormDialog
        dialogRef={templateDialog}
        id={`${id}-template`}
        heading={copy.panel.saveTemplate}
        closeLabel={copy.panel.close}
        onClose={() => setTemplateName('')}
        onSubmit={saveTemplate}
      >
        <div className="field">
          <label htmlFor={`${id}-template-name`} className="field-label">
            {copy.panel.templateName}
          </label>
          <input
            id={`${id}-template-name`}
            className="input"
            required
            maxLength={TITLE_MAX}
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </div>
        <button type="submit" className="form-submit">
          {copy.panel.save}
        </button>
      </FormDialog>
    </>
  )
}
