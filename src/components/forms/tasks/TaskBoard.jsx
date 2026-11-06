/**
 * The tasks of the selected tab as a kanban board with one column per status. Cards move by drag and drop or, for
 * keyboards and touch screens, through the menu behind their grip; both end in onPatch(task, { status }), which saves at
 * once. The plus of a column adds a single task right there, for the team or only for the member, a click on a card
 * opens it. Private cards are dashed and have no people. The done column only ever grows, so it starts with the last few
 * tasks.
 * Props: tasks (scopedTasks and scopedPrivateTasks), tab (team id or ALL_TEAMS), onlyMine, searching, copy (workspace
 * copy), locale, me, members, membersById, onAdd(title, status, isPrivate), onPatch(task, fields), onOpen(task).
 */
import React, { useState } from 'react'
import { CalendarDays, GripVertical, Plus } from 'lucide-react'
import { ALL_TEAMS, boardColumns, memberChange, TASK_STATUSES, TITLE_MAX } from '../../../lib/tasks'
import { fill, Menu, MENU_ITEM } from '../memberUi'
import { ICON_BUTTON, INPUT, MemberPicker, PrivateBadge, PrivateToggle, shortDay, STATUS_TONE } from './taskUi'

const DONE_SHOWN = 8
const TAG = 'max-w-full truncate rounded-full bg-bg-subtle px-2 py-px text-xs'

function AddCard({ label, privateLabel, onAdd, onClose }) {
  const [title, setTitle] = useState('')
  const [isPrivate, setPrivate] = useState(false)
  const add = async (e) => {
    e.preventDefault()
    const text = title.trim()
    if (!text) return
    setTitle('')
    if (!(await onAdd(text, isPrivate))) setTitle(text)
  }
  return (
    <form onSubmit={add} onKeyDown={(e) => e.key === 'Escape' && onClose()} className="mb-3 flex flex-col gap-2">
      <label>
        <span className="sr-only">{label}</span>
        <input
          autoFocus
          className={INPUT}
          value={title}
          maxLength={TITLE_MAX}
          placeholder={label}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={(e) => !title.trim() && !e.currentTarget.form.contains(e.relatedTarget) && onClose()}
        />
      </label>
      <PrivateToggle pressed={isPrivate} onChange={setPrivate} label={privateLabel} />
    </form>
  )
}

function TaskCard({ task, tab, copy, locale, me, members, membersById, onPatch, onOpen, onDragStart, onDragEnd }) {
  const finished = task.status === 'done'
  const foreign = tab === ALL_TEAMS || task.team !== tab
  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      // Firefox starts no drag on a button, so the card opens from here and not from a stretched title button.
      onClick={(e) => !e.target.closest('button, [popover]') && onOpen(task)}
      className={`cursor-grab rounded-lg border bg-card p-3.5 shadow-sm transition-colors hover:border-border-strong active:cursor-grabbing ${
        task.private ? 'border-dashed border-border-strong' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 text-sm font-medium leading-snug">
          <button
            type="button"
            className={`max-w-full border-0 bg-transparent p-0 text-left hyphens-auto ${finished ? 'text-fg-muted line-through' : 'text-fg'}`}
            onClick={() => onOpen(task)}
          >
            {task.title}
          </button>
        </h3>
        <div className="-mr-1.5 -mt-1.5">
          <Menu
            label={<GripVertical aria-hidden="true" className="h-4 w-4" />}
            ariaLabel={fill(copy.taskBoard.move, { title: task.title })}
            className={ICON_BUTTON}
          >
            {(close) => (
              <>
                <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-fg-muted">{copy.board.moveTo}</p>
                {TASK_STATUSES.filter((status) => status !== task.status).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`${MENU_ITEM} flex items-center gap-2`}
                    onClick={() => {
                      close()
                      onPatch({ status })
                    }}
                  >
                    <span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUS_TONE[status]}`} />
                    {copy.taskStatuses[status]}
                  </button>
                ))}
              </>
            )}
          </Menu>
        </div>
      </div>
      {task.description && <p className="mt-1.5 line-clamp-2 text-caption text-fg-muted">{task.description}</p>}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {task.private ? (
          <PrivateBadge label={copy.private.badge} />
        ) : (
          <>
            <span className={`${TAG} text-fg-muted`}>{task.projectType === 'task' ? copy.createKinds.task.label : task.projectTitle}</span>
            {foreign && <span className={`${TAG} text-fg-muted`}>{copy.teams[task.team] ?? copy.teamTabs.none}</span>}
          </>
        )}
        {task.priority === 'high' && !finished && <span className={`${TAG} text-danger`}>{copy.priorities.high}</span>}
      </div>
      {(task.due || !task.private) && (
        <div className="mt-3 flex min-h-8 items-center justify-between gap-2 border-0 border-t border-solid border-border pt-2.5">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${task.group === 'overdue' ? 'text-danger' : 'text-fg-muted'}`}>
            {task.due && (
              <>
                <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                {shortDay(task.due, locale)}
              </>
            )}
          </span>
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
        </div>
      )}
    </article>
  )
}

export default function TaskBoard({ tasks, tab, onlyMine, searching, copy, locale, me, members, membersById, onAdd, onPatch, onOpen }) {
  const text = copy.taskBoard
  const [dragging, setDragging] = useState(null)
  const [over, setOver] = useState(null)
  const [adding, setAdding] = useState(null)
  const [allDone, setAllDone] = useState(false)
  const columns = boardColumns(tasks)

  return (
    <>
      {!tasks.length && (
        <p className="text-center text-sm text-fg-muted">{searching ? copy.list.noResults : onlyMine ? copy.list.emptyMine : copy.list.empty}</p>
      )}
      {/* Phones scroll through the columns one by one; from lg on all four sit side by side. */}
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
        {TASK_STATUSES.map((status) => {
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
              className={`flex min-h-[28rem] w-[min(80vw,20rem)] shrink-0 snap-start flex-col rounded-card border p-3 transition-colors lg:w-auto ${
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
                <AddCard
                  label={addLabel}
                  privateLabel={copy.private.toggle}
                  onAdd={(title, isPrivate) => onAdd(title, status, isPrivate)}
                  onClose={() => setAdding(null)}
                />
              )}
              <ul role="list" className="flex flex-1 flex-col gap-3">
                {cards.map((task) => (
                  <li key={task.id} className={dragging?.id === task.id ? 'opacity-50' : ''}>
                    <TaskCard
                      task={task}
                      tab={tab}
                      copy={copy}
                      locale={locale}
                      me={me}
                      members={members}
                      membersById={membersById}
                      onPatch={(fields) => onPatch(task, fields)}
                      onOpen={onOpen}
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
                  onClick={() => setAllDone(true)}
                >
                  {fill(text.showAll, { count: columns[status].length })}
                </button>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}
