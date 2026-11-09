/**
 * The tasks of the selected filter as one calm list, the alternative to the board: in groups by deadline, with done
 * tasks folded away. Tasks are checked off and assigned in place; the title opens them, and a right click or the dots at
 * the end of a row open the same menu as on the board. The field on top creates a single task right away, for the team
 * or only for the member.
 * Props: tasks (scopedTasks and scopedPrivateTasks), filter (MINE, a team id or ALL_TEAMS), newTeam (team of new tasks,
 * '' for none), searching, copy (workspace copy), locale, me, members, membersById, onAdd(title, isPrivate),
 * onPatch(task, fields), onOpen(task), onMenu(task, x, y).
 */
import React, { useState } from 'react'
import { ChevronDown, MoreVertical, Plus, Repeat } from 'lucide-react'
import { ALL_TEAMS, memberChange, MINE, sortTasks, TASK_GROUPS, TITLE_MAX } from '../../../lib/tasks'
import { fill } from '../memberUi'
import { ICON_BUTTON, MemberPicker, PrivateBadge, PrivateToggle, shortDay, TaskCheck } from './taskUi'

function TaskRow({ task, filter, copy, locale, me, members, membersById, onPatch, onOpen, onMenu }) {
  const team = task.team ? task.team !== filter && copy.teams[task.team] : filter === ALL_TEAMS && copy.teamTabs.none
  const context = [task.projectType !== 'task' && task.projectTitle, team].filter(Boolean).join(' · ')
  return (
    <li
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
          {shortDay(task.due, locale)}
        </span>
      )}
      {!task.private && (
        <MemberPicker
          compact
          members={members}
          membersById={membersById}
          selected={task.assignees}
          team={task.team}
          onChange={(assignees) => onPatch({ assignees: memberChange(task.assignees, assignees) })}
          copy={copy.people}
          me={me}
          label={copy.createDialog.assignees}
        />
      )}
      <button
        type="button"
        aria-label={fill(copy.board.cardMenu, { title: task.title })}
        className={ICON_BUTTON}
        onClick={(e) => {
          const { right, bottom } = e.currentTarget.getBoundingClientRect()
          onMenu(task, right, bottom + 4)
        }}
      >
        <MoreVertical aria-hidden="true" className="h-4 w-4" />
      </button>
    </li>
  )
}

export default function TaskList({ tasks, filter, newTeam, searching, copy, locale, me, members, membersById, onAdd, onPatch, onOpen, onMenu }) {
  const text = copy.list
  const [draft, setDraft] = useState('')
  const [isPrivate, setPrivate] = useState(false)
  const sorted = sortTasks(tasks)
  const open = sorted.filter((task) => !task.done)
  const done = sorted.filter((task) => task.done)

  const add = async (e) => {
    e.preventDefault()
    const title = draft.trim()
    if (!title) return
    setDraft('')
    if (!(await onAdd(title, isPrivate))) setDraft(title)
  }
  const row = (task) => (
    <TaskRow
      key={task.id}
      task={task}
      filter={filter}
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
    <div className="flex flex-col gap-7">
      <form
        onSubmit={add}
        className="flex flex-wrap items-center gap-x-3 rounded-lg border border-border bg-bg-subtle px-3 pb-2 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus sm:flex-nowrap sm:pb-0"
      >
        <Plus aria-hidden="true" className="h-4 w-4 shrink-0 text-fg-muted" />
        <label className="min-w-0 flex-1 basis-4/5 sm:basis-auto">
          <span className="sr-only">{text.addLabel}</span>
          <input
            className="h-11 w-full border-0 bg-transparent text-sm text-fg outline-none placeholder:text-fg-muted"
            value={draft}
            maxLength={TITLE_MAX}
            placeholder={newTeam ? fill(text.add, { team: copy.teams[newTeam] }) : text.addAny}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <PrivateToggle pressed={isPrivate} onChange={setPrivate} label={copy.private.toggle} />
      </form>

      {!open.length && <p className="py-6 text-center text-sm text-fg-muted">{searching ? text.noResults : filter === MINE ? text.emptyMine : text.empty}</p>}

      {TASK_GROUPS.filter((group) => group !== 'done').map((group) => {
        const list = open.filter((task) => task.group === group)
        if (!list.length) return null
        return (
          <section key={group} aria-labelledby={`tasks-${group}`}>
            <h2
              id={`tasks-${group}`}
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

      {done.length > 0 && (
        <details className="group">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-2 text-xs font-medium uppercase tracking-wider text-fg-muted hover:text-fg">
            {text.groups.done}
            <span className="tabular-nums">{done.length}</span>
            <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <ul role="list" className="mt-1 flex flex-col">
            {done.map(row)}
          </ul>
        </details>
      )}
    </div>
  )
}
