/**
 * The start view of the tasks module: the next two weeks as a band of days above one card each for events, projects and
 * tasks. Projects and the task counts follow the selected team; "Dir zugewiesen" always lists the member's own open
 * tasks. A day with an event picks it for the events card, which otherwise shows the next event. Every card leads on to
 * its full view.
 * Props: events (calendar events with `day`), complete, projectsByEvent, projects (filterProjects), tasks (scopedTasks of
 * the team), mine (scopedTasks of the member), both with scopedPrivateTasks, today, copy (workspace copy), locale,
 * onView(view), onStart(event), onOpen(projectId), onOpenTask(task), onPatch(task, fields).
 */
import React, { useId, useState } from 'react'
import { Lock } from 'lucide-react'
import { addDays, berlinDay, boardColumns, progress, sortTasks } from '../../../lib/tasks'
import { fill, TOOL_BUTTON } from '../memberUi'
import { berlinTime, dayPart, ProgressBar, shortDay, TaskCheck } from './taskUi'

const BAND_DAYS = 14
const PROJECTS_SHOWN = 3
const TASKS_SHOWN = 3
const TILES = ['backlog', 'doing', 'review']
const CARD = 'rounded-card border border-border bg-card'
const HEADING = 'text-xl font-semibold tracking-tight'
const LEAD_ON = 'flex items-center justify-between gap-2 border-0 bg-transparent p-0 text-sm font-medium text-accent hover:underline'
const ROW_LINE = 'border-0 border-t border-solid border-border'

function DayBand({ days, byDay, activeDay, today, projectsByEvent, locale, onPick }) {
  return (
    <div className="overflow-x-auto">
      <ul role="list" className="grid gap-1" style={{ gridTemplateColumns: `repeat(${BAND_DAYS}, minmax(4.5rem, 1fr))` }}>
        {days.map((day) => {
          const dayEvents = byDay.get(day) ?? []
          const date = dayPart(day, locale, { weekday: 'long', day: 'numeric', month: 'long' })
          return (
            <li key={day} className="min-w-0">
              <button
                type="button"
                disabled={!dayEvents.length}
                aria-pressed={dayEvents.length ? day === activeDay : undefined}
                aria-label={[...dayEvents.map((event) => event.title), date].join(', ')}
                onClick={() => onPick(day)}
                className={`flex h-full min-h-24 w-full min-w-0 flex-col items-start gap-0.5 overflow-hidden rounded-lg border p-1.5 text-left text-fg ${
                  day === activeDay ? 'border-accent bg-bg-subtle' : 'border-transparent bg-transparent'
                } ${dayEvents.length ? 'hover:bg-bg-subtle' : ''}`}
              >
                <span className="text-xs text-fg-muted">{dayPart(day, locale, { weekday: 'short' }).replace('.', '')}</span>
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-[0.9375rem] ${
                    day === today ? 'bg-brand-bright font-semibold text-white' : 'font-medium'
                  }`}
                >
                  {dayPart(day, locale, { day: 'numeric' }).replace('.', '')}
                </span>
                {dayEvents.map((event) => (
                  <span
                    key={event.id}
                    className={`mt-0.5 block max-w-full truncate rounded-md px-1.5 py-px text-[0.6875rem] ${
                      projectsByEvent.has(event.id) ? 'surface-brand' : 'bg-[color-mix(in_srgb,var(--color-fg)_14%,transparent)] text-fg'
                    }`}
                  >
                    {event.title}
                  </span>
                ))}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function EventSummary({ event, project, copy, locale, onStart, onOpen }) {
  const text = copy.overview
  const tasks = project && progress(project.tasks)
  const planning = !project ? text.noPlanning : tasks.total ? fill(text.planning, tasks) : text.planningEmpty
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-4">
        <div aria-hidden="true" className="surface-brand flex h-[4.75rem] w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-card">
          <span className="text-xs font-medium">{dayPart(event.day, locale, { month: 'short' }).replace('.', '')}</span>
          <span className="text-[1.75rem] font-semibold leading-tight">{dayPart(event.day, locale, { day: 'numeric' }).replace('.', '')}</span>
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-tight">{event.title}</h3>
          <p className="mt-0.5 text-[0.8125rem] text-fg-muted">
            {dayPart(event.day, locale, { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
            {fill(text.time, { time: berlinTime(event.startAt, locale) })}
          </p>
        </div>
      </div>
      <p className="text-sm text-fg-muted">{planning}</p>
      <button type="button" className={`${TOOL_BUTTON} w-full justify-center`} onClick={() => (project ? onOpen(project.id) : onStart(event))}>
        {project ? text.openPlanning : copy.calendar.startPlanning}
      </button>
    </div>
  )
}

function OverviewCard({ title, link, onLink, children }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className={`${CARD} flex min-w-0 flex-[1_1_20rem] flex-col overflow-hidden`}>
      <h2 id={id} className={`${HEADING} px-5 pb-3.5 pt-5`}>
        {title}
      </h2>
      <div className="flex flex-1 flex-col">{children}</div>
      <button type="button" className={`${LEAD_ON} ${ROW_LINE} min-h-[3.25rem] w-full rounded-none px-5`} onClick={onLink}>
        {link}
        <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}

export default function TaskOverview({ events, complete, projectsByEvent, projects, tasks, mine, today, copy, locale, onView, onStart, onOpen, onOpenTask, onPatch }) {
  const text = copy.overview
  const [pickedDay, setPickedDay] = useState(null)
  // A task checked off here stays until the page changes, so a slip can be undone and the list does not jump.
  const [checked, setChecked] = useState([])

  const byDay = new Map()
  for (const event of events) byDay.set(event.day, [...(byDay.get(event.day) ?? []), event])
  // An event of several days stays the next one until its last day, like on the start page.
  const activeDay = pickedDay ?? events.find((event) => berlinDay(Date.parse(event.endAt)) >= today)?.day
  const listed = byDay.get(activeDay) ?? []
  const days = Array.from({ length: BAND_DAYS }, (_, index) => addDays(today, index))
  const columns = boardColumns(tasks)
  const assigned = sortTasks(mine.filter((task) => !task.done || checked.includes(task.id))).slice(0, TASKS_SHOWN)

  return (
    <div className="flex flex-col gap-6">
      <section aria-label={text.days} className={`${CARD} px-5 pb-5 pt-4`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h2 className={HEADING}>{text.days}</h2>
          <button type="button" className={`${LEAD_ON} min-h-11`} onClick={() => onView('events')}>
            {text.calendar}
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <DayBand
          days={days}
          byDay={byDay}
          activeDay={activeDay}
          today={today}
          projectsByEvent={projectsByEvent}
          locale={locale}
          onPick={setPickedDay}
        />
      </section>

      <div className="flex flex-wrap items-stretch gap-6">
        <OverviewCard title={copy.views.events} link={copy.calendar.allEvents} onLink={() => onView('events')}>
          <div className="flex flex-1 flex-col gap-6 px-5 pb-5">
            {listed.map((event) => (
              <EventSummary
                key={event.id}
                event={event}
                project={projectsByEvent.get(event.id)}
                copy={copy}
                locale={locale}
                onStart={onStart}
                onOpen={onOpen}
              />
            ))}
            {!listed.length && <p className="text-sm text-fg-muted">{complete ? copy.calendar.noUpcoming : copy.calendar.unavailable}</p>}
          </div>
        </OverviewCard>

        <OverviewCard title={copy.views.projects} link={text.allProjects} onLink={() => onView('projects')}>
          {!projects.length && <p className={`${ROW_LINE} px-5 py-4 text-sm text-fg-muted`}>{copy.board.noResults}</p>}
          {projects.slice(0, PROJECTS_SHOWN).map((project) => {
            const done = progress(project.tasks)
            return (
              <button
                key={project.id}
                type="button"
                className={`${ROW_LINE} block w-full rounded-none bg-transparent px-5 py-3 text-left text-fg hover:bg-bg-subtle`}
                onClick={() => onOpen(project.id)}
              >
                <span className="block truncate text-sm font-medium">{project.title}</span>
                <span className="mt-2 flex items-center gap-2.5">
                  {done.total ? (
                    <>
                      <ProgressBar percent={done.percent} label={copy.board.progress} />
                      <span className="shrink-0 text-xs tabular-nums text-fg-muted">
                        {done.done}/{done.total}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-fg-subtle">{copy.board.noTasks}</span>
                  )}
                </span>
              </button>
            )
          })}
        </OverviewCard>

        <OverviewCard title={copy.views.tasks} link={text.allTasks} onLink={() => onView('tasks')}>
          <div className="grid grid-cols-3 gap-2 px-5 pb-4">
            {TILES.map((status) => (
              <button
                key={status}
                type="button"
                className="flex min-w-0 flex-col rounded-xl border-0 bg-bg-subtle px-2.5 py-2 text-left text-fg hover:bg-[color-mix(in_srgb,var(--color-fg)_10%,transparent)]"
                onClick={() => onView('tasks')}
              >
                <span className="text-2xl font-semibold leading-tight tabular-nums">{columns[status].length}</span>
                <span className="truncate text-[0.8125rem] text-fg-muted">{copy.taskStatuses[status]}</span>
              </button>
            ))}
          </div>
          <p className={`${ROW_LINE} px-5 pb-1 pt-3 text-xs font-medium uppercase tracking-wider text-fg-muted`}>{text.assigned}</p>
          {!assigned.length && <p className="px-5 pb-4 text-sm text-fg-muted">{text.noneAssigned}</p>}
          <ul role="list" className="flex-1 pb-1">
            {assigned.map((task) => (
              <li key={task.id} className="flex min-h-11 items-center gap-3 px-5">
                <TaskCheck
                  checked={task.done}
                  onChange={(done) => {
                    setChecked([...checked, task.id])
                    onPatch(task, { done })
                  }}
                  label={fill(copy.panel.markDone, { title: task.title })}
                />
                <button
                  type="button"
                  className={`min-w-0 flex-1 truncate border-0 bg-transparent p-0 text-left text-sm font-medium ${task.done ? 'text-fg-muted line-through' : 'text-fg'}`}
                  onClick={() => onOpenTask(task)}
                >
                  {task.title}
                </button>
                {task.private && <Lock role="img" aria-label={copy.private.badge} className="h-3.5 w-3.5 shrink-0 text-fg-muted" />}
                {task.due && (
                  <span className={`shrink-0 text-xs tabular-nums ${task.group === 'overdue' ? 'font-medium text-danger' : 'text-fg-muted'}`}>
                    {shortDay(task.due, locale)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </OverviewCard>
      </div>
    </div>
  )
}
