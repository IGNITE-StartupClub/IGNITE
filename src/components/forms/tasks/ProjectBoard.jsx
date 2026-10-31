/**
 * The kanban board of the tasks module: one column per project status with one card per project (subtasks never
 * become cards). Cards move by drag and drop or, for keyboards and touch screens, through "Verschieben nach" in their
 * menu; both call onMove(id, status), which saves at once. The archive shows the same cards without columns.
 * Props: projects (already filtered), archived (archive view), copy (workspace copy), locale, today, membersById,
 * onOpen(id), onMove(id, status).
 */
import React, { useState } from 'react'
import { AlertTriangle, CalendarDays, MoreHorizontal } from 'lucide-react'
import { isOverdue, PROJECT_STATUSES, progress, projectDay } from '../../../lib/tasks'
import { fill, Menu, MENU_ITEM } from '../memberUi'
import { AvatarStack, eventDayLabel, ICON_BUTTON, ProgressBar, projectPeople, STATUS_TONE, TYPE_TEXT } from './taskUi'

function ProjectCard({ project, copy, locale, today, membersById, onOpen, onMove, draggable, onDragStart, onDragEnd }) {
  const done = progress(project.tasks)
  const overdue = project.tasks.filter((task) => isOverdue(task, today)).length
  const day = projectDay(project)
  const late = !project.eventDay && project.due && project.due < today && project.status !== 'done'
  return (
    <article
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`relative rounded-lg border border-border bg-bg p-4 shadow-sm transition-colors hover:border-border-strong ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[0.6875rem] font-semibold uppercase tracking-wider ${TYPE_TEXT[project.type]}`}>
          {copy.types[project.type]}
        </p>
        <div className="relative z-10 -mr-2 -mt-2">
          <Menu
            label={<MoreHorizontal aria-hidden="true" className="h-4 w-4" />}
            ariaLabel={fill(copy.board.cardMenu, { title: project.title })}
            className={ICON_BUTTON}
          >
            {(close) => (
              <>
                <button
                  type="button"
                  className={MENU_ITEM}
                  onClick={() => {
                    close()
                    onOpen(project.id)
                  }}
                >
                  {copy.board.open}
                </button>
                {!project.archived && (
                  <>
                    <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-fg-muted">{copy.board.moveTo}</p>
                    {PROJECT_STATUSES.filter((status) => status !== project.status).map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`${MENU_ITEM} flex items-center gap-2`}
                        onClick={() => {
                          close()
                          onMove(project.id, status)
                        }}
                      >
                        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUS_TONE[status]}`} />
                        {copy.statuses[status]}
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </Menu>
        </div>
      </div>
      <h3 className="mt-1 text-sm font-semibold leading-snug">
        {/* The ::after layer makes the whole card the click target; menu and avatars sit above it. */}
        <button
          type="button"
          className="border-0 bg-transparent p-0 text-left after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-focus"
          onClick={() => onOpen(project.id)}
        >
          {project.title}
        </button>
      </h3>
      {day && (
        <p className={`mt-1 flex items-center gap-1 text-xs ${late ? 'font-medium text-danger' : 'text-fg-muted'}`}>
          <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
          {eventDayLabel(day, locale)}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2">
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
      </div>
      {(overdue > 0 || projectPeople(project).length > 0) && (
        <div className="mt-3 flex items-center justify-between gap-2">
          {overdue > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-danger">
              <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
              {fill(copy.board.overdue, { count: overdue })}
            </span>
          ) : (
            <span />
          )}
          <span className="relative z-10">
            <AvatarStack ids={projectPeople(project)} membersById={membersById} copy={copy.people} />
          </span>
        </div>
      )}
    </article>
  )
}

export default function ProjectBoard({ projects, archived, copy, locale, today, membersById, onOpen, onMove }) {
  const [dragging, setDragging] = useState(null)
  const [over, setOver] = useState(null)
  const card = (project, draggable) => (
    <ProjectCard
      project={project}
      copy={copy}
      locale={locale}
      today={today}
      membersById={membersById}
      onOpen={onOpen}
      onMove={onMove}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', project.id)
        setDragging(project)
      }}
      onDragEnd={() => {
        setDragging(null)
        setOver(null)
      }}
    />
  )

  if (archived) {
    return (
      <>
        <p className="mb-3 text-sm text-fg-muted">{copy.board.archivedHint}</p>
        <ul role="list" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project) => (
            <li key={project.id}>{card(project, false)}</li>
          ))}
        </ul>
      </>
    )
  }

  return (
    <>
      <p className="mb-2 text-xs text-fg-muted lg:hidden">{copy.board.scrollHint}</p>
      {/* Phones scroll through the columns one by one; from lg on all four sit side by side. */}
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
        {PROJECT_STATUSES.map((status) => {
          const column = projects.filter((project) => project.status === status)
          const target = dragging && dragging.status !== status
          return (
            <section
              key={status}
              aria-labelledby={`column-${status}`}
              onDragOver={(e) => {
                if (!target) return
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                setOver(status)
              }}
              onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setOver(null)}
              onDrop={(e) => {
                e.preventDefault()
                if (target) onMove(dragging.id, status)
                setDragging(null)
                setOver(null)
              }}
              className={`flex w-[min(80vw,20rem)] shrink-0 snap-start flex-col rounded-card border p-3 transition-colors lg:w-auto ${
                over === status
                  ? 'border-brand-bright bg-[color-mix(in_srgb,var(--color-brand-bright)_10%,transparent)]'
                  : 'border-transparent bg-[color-mix(in_srgb,var(--color-fg)_4%,transparent)]'
              }`}
            >
              <h3 id={`column-${status}`} className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold">
                <span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUS_TONE[status]}`} />
                {copy.statuses[status]}
                <span className="ml-auto rounded-full bg-bg px-2 text-xs font-medium tabular-nums text-fg-muted">{column.length}</span>
              </h3>
              <ul role="list" className="flex min-h-24 flex-1 flex-col gap-3">
                {column.map((project) => (
                  <li key={project.id} className={dragging?.id === project.id ? 'opacity-50' : ''}>
                    {card(project, true)}
                  </li>
                ))}
                {!column.length && (
                  <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border-strong p-4 text-center text-xs text-fg-subtle">
                    {target ? copy.board.dropHere : copy.board.emptyColumn}
                  </li>
                )}
              </ul>
            </section>
          )
        })}
      </div>
    </>
  )
}
