/**
 * "Meine Aufgaben": every task assigned to the member, each in exactly one group (overdue, this week, later, no
 * deadline, done; done starts collapsed), checkable in place, with filters and sorting. Below, the projects the member
 * leads, because leading a project does not make its tasks theirs.
 * Props: projects, copy (workspace copy), locale, today, me, membersById, query (search of the workspace), status
 * (all | open | done | overdue | week, also set by the figures), onStatus(status), run, onOpen(projectId).
 */
import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { myTasks, MY_SORTS, PRIORITIES, progress, sortMyTasks, TASK_GROUPS } from '../../../lib/tasks'
import { BADGE, fill } from '../memberUi'
import { LABEL, ProgressBar, SELECT, shortDay, STATUS_TONE, SURFACE, TaskCheck, TYPE_TEXT } from './taskUi'

const STATUS_MATCH = {
  all: () => true,
  open: (task) => !task.done,
  done: (task) => task.done,
  overdue: (task) => task.group === 'overdue',
  week: (task) => task.group === 'week',
}

function MyTaskRow({ task, copy, locale, me, membersById, onToggle, onOpen }) {
  const others = task.assignees.filter((id) => id !== me).map((id) => membersById.get(id)?.name).filter(Boolean)
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <TaskCheck checked={task.done} onChange={onToggle} label={fill(copy.panel.markDone, { title: task.title })} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${task.done ? 'text-fg-muted line-through' : ''}`}>{task.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted">
          <button type="button" className="border-0 bg-transparent p-0 text-accent underline underline-offset-2" onClick={() => onOpen(task.projectId)}>
            {task.projectTitle}
          </button>
          {others.length > 0 && <span>{fill(copy.mine.with, { names: others.join(', ') })}</span>}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
        {task.due && (
          <span className={task.group === 'overdue' ? 'font-medium text-danger' : 'text-fg-muted'}>
            {fill(copy.panel.dueOn, { date: shortDay(task.due, locale) })}
          </span>
        )}
        {task.priority !== 'normal' && (
          <span className={`${BADGE} py-0 ${task.priority === 'high' ? 'border-danger text-danger' : 'border-border-strong text-fg-muted'}`}>
            {copy.priorities[task.priority]}
          </span>
        )}
      </div>
    </li>
  )
}

export default function MyTasks({ projects, copy, locale, today, me, membersById, query, status, onStatus, run, onOpen }) {
  const text = copy.mine
  const [priority, setPriority] = useState('')
  const [projectId, setProjectId] = useState('')
  const [sort, setSort] = useState('due')
  const [showDone, setShowDone] = useState(false)

  const all = myTasks(projects, me, today)
  const search = query.trim().toLowerCase()
  const visible = sortMyTasks(
    all.filter(
      (task) =>
        STATUS_MATCH[status](task) &&
        (!priority || task.priority === priority) &&
        (!projectId || task.projectId === projectId) &&
        (!search || task.title.toLowerCase().includes(search) || task.projectTitle.toLowerCase().includes(search)),
    ),
    sort,
  )
  const myProjectOptions = [...new Map(all.map((task) => [task.projectId, task.projectTitle])).entries()]
  const led = projects.filter((project) => !project.archived && project.leads.includes(me))

  const toggle = (task, done) =>
    run({ action: 'updateTask', id: task.projectId, taskId: task.id, patch: { done } }, (list) =>
      list.map((project) =>
        project.id === task.projectId
          ? { ...project, tasks: project.tasks.map((item) => (item.id === task.id ? { ...item, done } : item)) }
          : project,
      ),
    )
  const row = (task) => (
    <MyTaskRow
      key={task.id}
      task={task}
      copy={copy}
      locale={locale}
      me={me}
      membersById={membersById}
      onToggle={(done) => toggle(task, done)}
      onOpen={onOpen}
    />
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <label>
          <span className={LABEL}>{text.statusLabel}</span>
          <select className={SELECT} value={status} onChange={(e) => onStatus(e.target.value)}>
            {Object.keys(STATUS_MATCH).map((key) => (
              <option key={key} value={key}>
                {text.statuses[key]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={LABEL}>{text.priorityLabel}</span>
          <select className={SELECT} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">{text.anyPriority}</option>
            {PRIORITIES.map((key) => (
              <option key={key} value={key}>
                {copy.priorities[key]}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 max-w-full">
          <span className={LABEL}>{text.projectLabel}</span>
          <select className={`${SELECT} max-w-full`} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">{text.anyProject}</option>
            {myProjectOptions.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:ml-auto">
          <span className={LABEL}>{text.sortLabel}</span>
          <select className={SELECT} value={sort} onChange={(e) => setSort(e.target.value)}>
            {MY_SORTS.map((key) => (
              <option key={key} value={key}>
                {text.sorts[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!all.length ? (
        <p className={`${SURFACE} p-6 text-sm text-fg-muted`}>{text.empty}</p>
      ) : !visible.length ? (
        <p className={`${SURFACE} p-6 text-sm text-fg-muted`}>{text.noResults}</p>
      ) : (
        TASK_GROUPS.map((group) => {
          const tasks = visible.filter((task) => task.group === group)
          if (!tasks.length) return null
          const collapsible = group === 'done' && status !== 'done'
          const expanded = !collapsible || showDone
          return (
            <section key={group} aria-labelledby={`mine-${group}`} className={`${SURFACE} overflow-hidden`}>
              <h3 id={`mine-${group}`} className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-semibold">
                <span className={group === 'overdue' ? 'text-danger' : ''}>{text.groups[group]}</span>
                <span className="rounded-full bg-bg-subtle px-2 text-xs font-medium tabular-nums text-fg-muted">{tasks.length}</span>
                {collapsible && (
                  <button
                    type="button"
                    className="ml-auto inline-flex items-center gap-1 border-0 bg-transparent p-0 text-xs font-normal text-fg-muted hover:text-fg"
                    aria-expanded={expanded}
                    aria-controls={`mine-${group}-list`}
                    onClick={() => setShowDone(!showDone)}
                  >
                    {expanded ? text.hideDone : fill(text.showDone, { count: tasks.length })}
                    <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </h3>
              <ul id={`mine-${group}-list`} role="list" hidden={!expanded} className="divide-y divide-border">
                {tasks.map(row)}
              </ul>
            </section>
          )
        })
      )}

      <section aria-labelledby="mine-projects">
        <h3 id="mine-projects" className="text-lg font-semibold">
          {text.myProjects}
        </h3>
        <p className="mt-1 text-sm text-fg-muted">{text.myProjectsHint}</p>
        {led.length ? (
          <ul role="list" className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {led.map((project) => {
              const done = progress(project.tasks)
              return (
                <li key={project.id}>
                  <button
                    type="button"
                    className={`${SURFACE} block w-full p-4 text-left transition-colors hover:border-border-strong`}
                    onClick={() => onOpen(project.id)}
                  >
                    <span className="flex items-center justify-between gap-2 text-[0.6875rem] font-semibold uppercase tracking-wider">
                      <span className={TYPE_TEXT[project.type]}>{copy.types[project.type]}</span>
                      <span className="inline-flex items-center gap-1.5 font-medium normal-case tracking-normal text-fg-muted">
                        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUS_TONE[project.status]}`} />
                        {copy.statuses[project.status]}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm font-semibold">{project.title}</span>
                    <span className="mt-3 flex items-center gap-2">
                      {done.total ? (
                        <>
                          <ProgressBar percent={done.percent} tone={STATUS_TONE[project.status]} label={copy.board.progress} />
                          <span className="shrink-0 text-xs tabular-nums text-fg-muted">
                            {done.done}/{done.total}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-fg-subtle">{copy.board.noTasks}</span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-fg-muted">{text.noProjects}</p>
        )}
      </section>
    </div>
  )
}
