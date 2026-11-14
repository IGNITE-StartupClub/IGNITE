/**
 * The Team-Check of a teamlead (teamCheck): the open tasks of one team that are overdue, that nobody has taken, or that
 * have no deadline, each with the one or two steps that settle it in place. A task can stand in more than one list. An
 * empty page means every open task of the team has a person and a deadline.
 * Props: check ({ overdue, unassigned, undated } of teamCheck), team (team id), today, copy (workspace copy), locale, me,
 * members, membersById, onPatch(task, fields), onOpenTask(task).
 */
import React, { useState } from 'react'
import { addDays, memberChange, similarTask, weekEnd } from '../../../lib/tasks'
import { dueLabel } from '../../../lib/memberSearch'
import { fill, TOOL_BUTTON } from '../memberUi'
import { DueSetter, MemberPicker, shortName, showRest } from './taskUi'

const SHOWN = 5
const GROUPS = ['overdue', 'unassigned', 'undated']
const SMALL_BUTTON = `${TOOL_BUTTON} h-8 shrink-0 px-2.5 text-xs`
const ROW_LINE = 'border-0 border-t border-solid border-border'

function people(task, membersById, text) {
  const names = task.assignees.map((id) => membersById.get(id)?.name).filter(Boolean).map(shortName)
  return names.length ? names.join(', ') : text.nobody
}

function CheckRow({ task, group, all, today, copy, locale, me, members, membersById, onPatch, onOpenTask }) {
  const text = copy.teamCheck
  const where = task.projectType === 'task' ? copy.overview.single : task.projectTitle
  const twin = group === 'undated' ? similarTask(task, all) : null
  const detail =
    group === 'overdue'
      ? [people(task, membersById, text), fill(text.since, { date: dueLabel(task.due, today, locale) })]
      : group === 'unassigned'
        ? [where, task.due ? fill(text.dueOn, { date: dueLabel(task.due, today, locale) }) : text.noDue]
        : [people(task, membersById, text), twin && fill(text.similar, { title: twin.title })]
  const assign = (assignees) => onPatch(task, { assignees: memberChange(task.assignees, assignees) })
  const picker = (
    <MemberPicker
      members={members}
      membersById={membersById}
      selected={task.assignees}
      team={task.team}
      onChange={assign}
      copy={{ ...copy.people, assign: group === 'unassigned' ? text.pick : copy.people.assign }}
      me={me}
      label={fill(text.pickFor, { title: task.title })}
    />
  )
  const thisWeek = weekEnd(today)
  return (
    <li data-task-item={task.id} className={`${ROW_LINE} flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4`}>
      <div className="min-w-0">
        <button
          type="button"
          data-control="open"
          className="block max-w-full border-0 bg-transparent p-0 text-left text-sm font-medium text-fg hover:underline"
          onClick={() => onOpenTask(task)}
        >
          {task.title}
        </button>
        <span className="block text-caption text-fg-muted">{detail.filter(Boolean).join(' · ')}</span>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {group === 'overdue' && (
          <>
            <DueSetter label={text.newDate} saveLabel={text.save} onSet={(due) => onPatch(task, { due })} />
            {task.assignees.length ? (
              <button type="button" className={SMALL_BUTTON} onClick={() => onOpenTask(task)}>
                {text.openTask}
              </button>
            ) : (
              picker
            )}
          </>
        )}
        {group === 'unassigned' && (
          <>
            {picker}
            <button type="button" className={SMALL_BUTTON} onClick={() => assign([...task.assignees, me])}>
              {text.takeIt}
            </button>
          </>
        )}
        {group === 'undated' && (
          <>
            <button type="button" className={SMALL_BUTTON} onClick={() => onPatch(task, { due: thisWeek })}>
              {text.thisWeek}
            </button>
            <button type="button" className={SMALL_BUTTON} onClick={() => onPatch(task, { due: addDays(thisWeek, 7) })}>
              {text.nextWeek}
            </button>
            <DueSetter label={text.pickDate} saveLabel={text.save} onSet={(due) => onPatch(task, { due })} />
            <button type="button" className={SMALL_BUTTON} onClick={() => onPatch(task, { status: 'dropped' })}>
              {copy.taskStatuses.dropped}
            </button>
          </>
        )}
      </div>
    </li>
  )
}

export default function TeamCheck({ check, team, today, copy, locale, me, members, membersById, onPatch, onOpenTask }) {
  const text = copy.teamCheck
  const [expanded, setExpanded] = useState([])
  const counts = GROUPS.filter((group) => check[group].length)
  const all = [...new Map([...check.overdue, ...check.unassigned, ...check.undated].map((task) => [task.id, task])).values()]

  return (
    <div data-focus-scope className="flex flex-col gap-6">
      <p className="max-w-2xl text-sm text-fg-muted">{text.lead}</p>
      {counts.length > 0 && (
        <ul role="list" className="flex flex-wrap gap-2">
          {counts.map((group) => (
            <li key={group}>
              <button
                type="button"
                className={`${SMALL_BUTTON} rounded-full ${group === 'overdue' ? 'border-danger text-danger' : ''}`}
                onClick={() => document.getElementById(`check-${group}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                {fill(text.counts[group], { count: check[group].length })}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!counts.length && <p className="rounded-card border border-border bg-bg-subtle px-5 py-4 text-sm">{fill(text.empty, { team: copy.teams[team] })}</p>}
      {counts.map((group) => {
        const tasks = check[group]
        const shown = expanded.includes(group) ? tasks : tasks.slice(0, SHOWN)
        return (
          <section key={group} id={`check-${group}`} aria-labelledby={`check-${group}-heading`} className="scroll-mt-28">
            <h2
              id={`check-${group}-heading`}
              className={`mb-1 text-xs font-medium uppercase tracking-wider ${group === 'overdue' ? 'text-danger' : 'text-fg-muted'}`}
            >
              {text.groups[group]} · <span className="tabular-nums">{tasks.length}</span>
            </h2>
            {group === 'undated' && <p className="mb-2 text-caption text-fg-muted">{text.undatedHint}</p>}
            <ul role="list">
              {shown.map((task) => (
                <CheckRow
                  key={task.id}
                  task={task}
                  group={group}
                  all={all}
                  today={today}
                  copy={copy}
                  locale={locale}
                  me={me}
                  members={members}
                  membersById={membersById}
                  onPatch={onPatch}
                  onOpenTask={onOpenTask}
                />
              ))}
            </ul>
            {shown.length < tasks.length && (
              <button
                type="button"
                className="mt-2 border-0 bg-transparent p-0 text-sm text-fg-muted underline underline-offset-2 hover:text-fg"
                onClick={(e) => {
                  const list = e.currentTarget.previousElementSibling
                  showRest(() => setExpanded([...expanded, group]), () => list.children[SHOWN]?.querySelector('[data-control]'))
                }}
              >
                {fill(text.more, { count: tasks.length - shown.length })}
              </button>
            )}
          </section>
        )
      })}
    </div>
  )
}
