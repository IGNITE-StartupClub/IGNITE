/**
 * The tasks of the selected filter as one calm list, the alternative to the board: in groups by deadline, with done and
 * dropped tasks folded away. Tasks are checked off and assigned in place; the title opens them, and a right click or the
 * "…" at the end of a row open the same menu as on the board. The field on top adds a task (TaskCapture); "Aufgabe" in
 * the page head focuses it (addSignal).
 * Props: tasks (scopedTasks and scopedPrivateTasks), filter (MINE, a team id or another filter), team (team on screen for
 * new tasks, '' for none), knownTeam (the team rows leave unnamed), searching, copy (workspace copy), locale, today, me,
 * members, membersById, addSignal, captureId, onAdd(captured, isPrivate, status), onPatch(task, fields), onOpen(task),
 * onMenu(task, x, y).
 */
import React, { useEffect } from 'react'
import { ChevronDown, Repeat } from 'lucide-react'
import { dueLabel } from '../../../lib/memberSearch'
import { ALL_TEAMS, MINE, sortTasks, TASK_GROUPS } from '../../../lib/tasks'
import { fill } from '../memberUi'
import { MenuButton, TaskPeople } from './TaskBoard'
import TaskCapture from './TaskCapture'
import { PrivateBadge, TaskCheck, teamName } from './taskUi'

const FOLDED = ['done', 'dropped']

function TaskRow({ task, filter, knownTeam, today, copy, locale, me, members, membersById, onPatch, onOpen, onMenu }) {
  const team = task.team ? task.team !== knownTeam && teamName(copy, task.team) : filter === ALL_TEAMS && copy.teamTabs.none
  const context = [task.projectType !== 'task' && task.projectTitle, team].filter(Boolean).join(' · ')
  return (
    <li
      data-task-item={task.id}
      onContextMenu={(e) => {
        if (e.target.closest('[popover]')) return
        e.preventDefault()
        onMenu(task, e.clientX, e.clientY)
      }}
      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-bg-subtle"
    >
      <TaskCheck checked={task.done} onChange={(done) => onPatch({ done })} label={fill(copy.panel.markDone, { title: task.title })} />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          data-control="open"
          className={`block max-w-full border-0 bg-transparent p-0 text-left text-sm font-medium ${task.done ? 'text-fg-muted line-through' : 'text-fg'}`}
          onClick={() => onOpen(task)}
        >
          {task.title}
        </button>
        {task.private ? <PrivateBadge label={copy.private.badge} /> : context && <p className="mt-0.5 text-xs text-fg-muted">{context}</p>}
      </div>
      {task.priority === 'high' && !task.done && <span className="shrink-0 text-xs font-medium text-danger">{copy.priorities.high}</span>}
      {task.repeat && (
        <span className="inline-flex shrink-0 text-fg-muted" title={copy.repeats[task.repeat]}>
          <Repeat aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="sr-only">{copy.repeats[task.repeat]}</span>
        </span>
      )}
      {task.due && (
        <span className={`shrink-0 text-xs tabular-nums ${task.group === 'overdue' ? 'font-medium text-danger' : 'text-fg-muted'}`}>
          {dueLabel(task.due, today, locale)}
        </span>
      )}
      <TaskPeople task={task} copy={copy} me={me} members={members} membersById={membersById} onPatch={onPatch} />
      <MenuButton task={task} copy={copy} onMenu={onMenu} />
    </li>
  )
}

export default function TaskList({
  tasks,
  filter,
  team,
  knownTeam,
  searching,
  copy,
  locale,
  today,
  me,
  members,
  membersById,
  addSignal,
  captureId,
  onAdd,
  onPatch,
  onOpen,
  onMenu,
}) {
  const text = copy.list
  const sorted = sortTasks(tasks)
  const open = sorted.filter((task) => !task.done)

  useEffect(() => {
    if (addSignal) document.getElementById(captureId)?.focus()
  }, [addSignal])

  const row = (task) => (
    <TaskRow
      key={task.id}
      task={task}
      filter={filter}
      knownTeam={knownTeam}
      today={today}
      copy={copy}
      locale={locale}
      me={me}
      members={members}
      membersById={membersById}
      onPatch={(fields) => onPatch(task, fields)}
      onOpen={onOpen}
      onMenu={onMenu}
    />
  )

  return (
    <div data-focus-scope className="flex flex-col gap-7">
      <div className="rounded-lg border border-border bg-bg-subtle p-3">
        <TaskCapture
          copy={copy}
          members={members}
          me={me}
          today={today}
          locale={locale}
          team={team}
          inputId={captureId}
          onAdd={(captured, isPrivate) => onAdd(captured, isPrivate, 'backlog')}
        />
      </div>

      {!open.length && <p className="py-6 text-center text-sm text-fg-muted">{searching ? text.noResults : filter === MINE ? text.emptyMine : text.empty}</p>}

      {TASK_GROUPS.filter((group) => !FOLDED.includes(group)).map((group) => {
        const list = open.filter((task) => task.group === group)
        if (!list.length) return null
        return (
          <section key={group} id={`tasks-${group}`} aria-labelledby={`tasks-${group}-heading`} className="scroll-mt-28">
            <h2
              id={`tasks-${group}-heading`}
              className={`mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider ${group === 'overdue' ? 'text-danger' : 'text-fg-muted'}`}
            >
              {text.groups[group]}
              <span className="tabular-nums">{list.length}</span>
            </h2>
            <ul role="list" className="flex flex-col">
              {list.map(row)}
            </ul>
          </section>
        )
      })}

      {FOLDED.map((group) => {
        const list = sorted.filter((task) => task.group === group)
        if (!list.length) return null
        return (
          <details key={group} className="group">
            <summary className="flex w-fit cursor-pointer list-none items-center gap-2 text-xs font-medium uppercase tracking-wider text-fg-muted hover:text-fg">
              {text.groups[group]}
              <span className="tabular-nums">{list.length}</span>
              <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="box-border">
              {group === 'dropped' && <p className="mt-2 text-caption text-fg-muted">{copy.taskBoard.droppedHint}</p>}
              <ul role="list" className="mt-1 flex flex-col">
                {list.map(row)}
              </ul>
            </div>
          </details>
        )
      })}
    </div>
  )
}
