/**
 * The tasks of the selected filter as a kanban board with one column per status. Cards move by drag and drop or, for
 * keyboards and touch screens, through the "…" menu that also opens on a right click and holds taking, dropping and
 * deleting; both end in onPatch(task, { status }), which saves at once. The circle on a card ticks it off, a task nobody
 * has taken offers "Übernehmen", one without a deadline "Datum setzen". The plus of a column opens the field that adds a
 * task right there (TaskCapture); "Aufgabe" in the page head opens it in the first column (addSignal). A click on a card
 * opens it. Private cards are dashed and have no people. The done column only ever grows, so it starts with the last
 * few tasks. Dropped tasks get no column: they wait folded below the board.
 * Props: tasks (scopedTasks and scopedPrivateTasks), filter (MINE, a team id or another filter), searching, copy
 * (workspace copy), locale, today, me, members, membersById, team (team on screen for new tasks, '' for none),
 * knownTeam (the team cards leave unnamed: the one on screen, else the member's own), addSignal, captureId,
 * onAdd(captured, isPrivate, status), onPatch(task, fields), onOpen(task), onMenu(task, x, y).
 */
import React, { useEffect, useState } from 'react'
import { ChevronDown, MoreHorizontal, Plus, Repeat } from 'lucide-react'
import { dueLabel } from '../../../lib/memberSearch'
import { ALL_TEAMS, BOARD_STATUSES, boardColumns, memberChange, MINE } from '../../../lib/tasks'
import { fill, TOOL_BUTTON } from '../memberUi'
import TaskCapture from './TaskCapture'
import { DueSetter, ICON_BUTTON, MemberPicker, PrivateBadge, showRest, STATUS_TONE, TaskCheck, teamName } from './taskUi'

const DONE_SHOWN = 8
const TAG = 'max-w-full truncate rounded-full bg-bg-subtle px-2.5 py-0.5 text-[14px]'
const SMALL_BUTTON = `${TOOL_BUTTON} h-8 shrink-0 px-2.5 text-xs`

/** The menu button of a card or row, which opens the same menu as a right click. */
export function MenuButton({ task, copy, onMenu, className = '' }) {
  return (
    <button
      type="button"
      data-control="menu"
      aria-label={fill(copy.board.cardMenu, { title: task.title })}
      className={`${ICON_BUTTON} ${className}`}
      onClick={(e) => {
        const { left, bottom } = e.currentTarget.getBoundingClientRect()
        onMenu(task, left, bottom + 4)
      }}
    >
      <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
    </button>
  )
}

/** People of a task, with "Übernehmen" while nobody has it. */
export function TaskPeople({ task, copy, me, members, membersById, onPatch }) {
  if (task.private) return null
  const assign = (assignees) => onPatch({ assignees: memberChange(task.assignees, assignees) })
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      {!task.done && !task.assignees.length && (
        <button type="button" className={SMALL_BUTTON} onClick={() => assign([me])}>
          {copy.board.take}
        </button>
      )}
      <MemberPicker
        compact
        members={members}
        membersById={membersById}
        selected={task.assignees}
        team={task.team}
        onChange={assign}
        copy={copy.people}
        me={me}
        label={copy.createDialog.assignees}
        everyone
      />
    </span>
  )
}

function TaskCard({ task, filter, knownTeam, today, copy, locale, me, members, membersById, onPatch, onOpen, onMenu, onDragStart, onDragEnd }) {
  const finished = task.done
  const team = task.team ? task.team !== knownTeam && teamName(copy, task.team) : filter === ALL_TEAMS && copy.teamTabs.none
  const project = task.projectType !== 'task' && fill(copy.overview.inProject, { project: task.projectTitle })
  const overdue = task.group === 'overdue'
  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      // Firefox starts no drag on a button, so the card opens from here and not from a stretched title button.
      onClick={(e) => !e.target.closest('button, label, input, [popover]') && onOpen(task)}
      onContextMenu={(e) => {
        if (e.target.closest('[popover]')) return
        e.preventDefault()
        onMenu(task, e.clientX, e.clientY)
      }}
      className={`cursor-grab rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-border-strong active:cursor-grabbing ${
        task.private ? 'border-dashed border-border-strong' : 'border-border'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="-ml-1 -mt-0.5">
          <TaskCheck checked={task.done} onChange={(done) => onPatch({ done })} label={fill(copy.panel.markDone, { title: task.title })} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-medium leading-snug">
            <button
              type="button"
              data-control="open"
              className={`max-w-full border-0 bg-transparent p-0 text-left hyphens-auto ${finished ? 'text-fg-muted line-through' : 'text-fg'}`}
              onClick={() => onOpen(task)}
            >
              {task.title}
            </button>
          </h3>
          {project && <p className="mt-0.5 truncate text-[14px] text-fg-muted">{project}</p>}
        </div>
        <MenuButton task={task} copy={copy} onMenu={onMenu} className="-mr-1.5 -mt-1" />
      </div>
      {task.description && <p className="mt-1.5 line-clamp-2 text-[14px] text-fg-muted">{task.description}</p>}
      {(task.private || team || (task.priority === 'high' && !finished)) && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {task.private && <PrivateBadge label={copy.private.badge} />}
          {team && <span className={`${TAG} text-fg-muted`}>{team}</span>}
          {task.priority === 'high' && !finished && <span className={`${TAG} text-danger`}>{copy.priorities.high}</span>}
        </div>
      )}
      <div className="mt-3 flex min-h-8 flex-wrap items-center justify-between gap-2 border-0 border-t border-solid border-border pt-2.5">
        {task.due ? (
          <span className={`inline-flex items-center gap-1.5 text-[14px] font-medium ${overdue ? 'text-danger' : 'text-fg-muted'}`}>
            {overdue ? fill(copy.taskBoard.overdue, { date: dueLabel(task.due, today, locale) }) : dueLabel(task.due, today, locale)}
            {task.repeat && (
              <span className="inline-flex" title={copy.repeats[task.repeat]}>
                <Repeat aria-hidden="true" className="h-3.5 w-3.5" />
                <span className="sr-only">{copy.repeats[task.repeat]}</span>
              </span>
            )}
          </span>
        ) : finished ? (
          <span />
        ) : (
          <DueSetter label={copy.overview.setDue} saveLabel={copy.overview.saveDue} onSet={(due) => onPatch({ due })} />
        )}
        <TaskPeople task={task} copy={copy} me={me} members={members} membersById={membersById} onPatch={onPatch} />
      </div>
    </article>
  )
}

/** The dropped tasks below the board, folded, the last one first. */
function DroppedTasks({ tasks, copy, onOpen, onMenu }) {
  const text = copy.taskBoard
  if (!tasks.length) return null
  return (
    <details className="group mt-6">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-2 text-xs font-medium uppercase tracking-wider text-fg-muted hover:text-fg">
        {text.dropped} · <span className="tabular-nums">{tasks.length}</span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="box-border">
        <p className="mt-2 text-caption text-fg-muted">{text.droppedHint}</p>
        <ul role="list" className="mt-2 flex flex-col">
          {tasks.map((task) => (
            <li key={task.id} data-task-item={task.id} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-bg-subtle">
              <button
                type="button"
                data-control="open"
                className="min-w-0 flex-1 truncate border-0 bg-transparent p-0 text-left text-sm text-fg-muted line-through"
                onClick={() => onOpen(task)}
              >
                {task.title}
              </button>
              <span className={`${TAG} shrink-0 text-xs text-fg-muted`}>{copy.taskStatuses.dropped}</span>
              <MenuButton task={task} copy={copy} onMenu={onMenu} />
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}

export default function TaskBoard({
  tasks,
  filter,
  searching,
  copy,
  locale,
  today,
  me,
  members,
  membersById,
  team,
  knownTeam,
  addSignal,
  captureId,
  onAdd,
  onPatch,
  onOpen,
  onMenu,
}) {
  const text = copy.taskBoard
  const [dragging, setDragging] = useState(null)
  const [over, setOver] = useState(null)
  const [adding, setAdding] = useState(null)
  const [allDone, setAllDone] = useState(false)
  const columns = boardColumns(tasks)

  // "Aufgabe" in the page head: the field of the first column, also when it was open already.
  useEffect(() => {
    if (!addSignal) return
    setAdding('backlog')
    setTimeout(() => document.getElementById(captureId)?.focus())
  }, [addSignal])

  return (
    <>
      {!tasks.length && (
        <p className="text-center text-sm text-fg-muted">{searching ? copy.list.noResults : filter === MINE ? copy.list.emptyMine : copy.list.empty}</p>
      )}
      {/* Phones scroll through the columns one by one; from lg on all three sit side by side. */}
      <div data-focus-scope className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
        {BOARD_STATUSES.map((status) => {
          const label = copy.taskStatuses[status]
          const addLabel = fill(text.addIn, { status: label })
          const target = dragging && dragging.status !== status
          const cards = status === 'done' && !allDone ? columns.done.slice(0, DONE_SHOWN) : columns[status]
          return (
            <section
              key={status}
              aria-labelledby={`task-column-${status}`}
              onDragOver={(e) => {
                if (!target) return
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                setOver(status)
              }}
              onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setOver(null)}
              onDrop={(e) => {
                e.preventDefault()
                if (target) onPatch(dragging, { status })
                setDragging(null)
                setOver(null)
              }}
              className={`flex min-h-[28rem] w-[min(85vw,22rem)] shrink-0 snap-start flex-col rounded-card border p-3 transition-colors lg:w-auto ${
                over === status
                  ? 'border-brand-bright bg-[color-mix(in_srgb,var(--color-brand-bright)_10%,transparent)]'
                  : 'border-border bg-bg-subtle'
              }`}
            >
              <div className="mb-3 flex min-h-8 items-center gap-2 px-1">
                <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_TONE[status]}`} />
                <h2 id={`task-column-${status}`} className="text-sm font-semibold">
                  {label}
                </h2>
                <span className="rounded-full bg-bg px-2 text-xs font-medium tabular-nums text-fg-muted">{columns[status].length}</span>
                {status !== 'done' && (
                  <button type="button" aria-label={addLabel} className={`${ICON_BUTTON} ml-auto`} onClick={() => setAdding(status)}>
                    <Plus aria-hidden="true" className="h-4 w-4" />
                  </button>
                )}
              </div>
              {adding === status && (
                <div className="mb-3 rounded-lg border border-border bg-card p-3">
                  <TaskCapture
                    copy={copy}
                    members={members}
                    me={me}
                    today={today}
                    locale={locale}
                    team={team}
                    stacked
                    autoFocus
                    inputId={status === 'backlog' ? captureId : undefined}
                    onAdd={(captured, isPrivate) => onAdd(captured, isPrivate, status)}
                    onCancel={() => setAdding(null)}
                  />
                </div>
              )}
              <ul role="list" className="flex flex-1 flex-col gap-3">
                {cards.map((task) => (
                  <li key={task.id} data-task-item={task.id} className={dragging?.id === task.id ? 'opacity-50' : ''}>
                    <TaskCard
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
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move'
                        e.dataTransfer.setData('text/plain', task.id)
                        setDragging(task)
                      }}
                      onDragEnd={() => {
                        setDragging(null)
                        setOver(null)
                      }}
                    />
                  </li>
                ))}
                {!cards.length && target && (
                  <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border-strong p-4 text-center text-xs text-fg-subtle">
                    {copy.board.dropHere}
                  </li>
                )}
              </ul>
              {cards.length < columns[status].length && (
                <button
                  type="button"
                  className="mt-3 border-0 bg-transparent p-0 text-sm text-fg-muted underline underline-offset-2 hover:text-fg"
                  onClick={(e) => {
                    const list = e.currentTarget.previousElementSibling
                    showRest(() => setAllDone(true), () => list.children[DONE_SHOWN]?.querySelector('[data-control="open"]'))
                  }}
                >
                  {fill(text.showAll, { count: columns[status].length })}
                </button>
              )}
            </section>
          )
        })}
      </div>
      <DroppedTasks tasks={columns.dropped} copy={copy} onOpen={onOpen} onMenu={onMenu} />
    </>
  )
}
