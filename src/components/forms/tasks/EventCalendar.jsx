/**
 * The calendar of the events page: a month or week grid of the public events (Luma and externalEvents, loaded by the
 * page, never copied), the Weekly and the own events, and cards for the upcoming events or the selected day. The Weekly shows in the grid and on its day, never among the upcoming events, and has nothing to plan. Each card
 * either starts the planning project of its event or opens it. A click on a title in the grid opens that event. The
 * grid also shows the deadlines of the open projects, outlined, and a selected day lists them below its events. A
 * selected day from today on offers to add a project, a task or an event; a task shows on the hub and the board, the
 * grid has no tasks.
 * Props: events (calendarEntries), deadlines (projectDeadlines), planOf(event) → its project or undefined, complete
 * (false when the calendar could not be loaded), today, copy (workspace copy), locale, membersById, onStart(event),
 * onOpen(projectId), onOpenEvent(event), onAddOnDay(kind, day) with kind internal, task or event.
 */
import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Plus } from 'lucide-react'
import { addDays, isEvent, progress, projectAssignees } from '../../../lib/tasks'
import { fill, PRIMARY_BUTTON, TOOL_BUTTON } from '../memberUi'
import { AvatarStack, eventDayLabel, ICON_BUTTON, LeadLine, longDay, ProgressBar, Segmented, SURFACE } from './taskUi'

const UPCOMING_MAX = 4

const weekday = (day) => (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7
const mondayOf = (day) => addDays(day, -weekday(day))
const monthStart = (day) => `${day.slice(0, 8)}01`
function addMonths(day, months) {
  const date = new Date(`${monthStart(day)}T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + months)
  return date.toISOString().slice(0, 10)
}

/** The days the grid shows: whole weeks from Monday to Sunday. */
function gridDays(mode, cursor) {
  const start = mondayOf(mode === 'week' ? cursor : monthStart(cursor))
  const last = mode === 'week' ? addDays(start, 6) : addDays(addMonths(cursor, 1), -1)
  const end = addDays(last, 6 - weekday(last))
  const days = []
  for (let day = start; day <= end; day = addDays(day, 1)) days.push(day)
  return days
}

function EventCard({ event, project, copy, locale, membersById, onStart, onOpen }) {
  const done = project && progress(project.tasks)
  return (
    <article className="rounded-lg border border-border bg-bg-subtle p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        {eventDayLabel(event.day, locale)}
        {event.time && ` · ${event.time}`}
      </p>
      <h3 className="mt-1 text-base font-semibold leading-snug">{event.title}</h3>
      {event.location && (
        <p className="mt-1 flex items-center gap-1 text-sm text-fg-muted">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{event.location}</span>
        </p>
      )}
      {!isEvent(event) ? (
        <p className="mt-2 text-caption font-medium text-accent">{copy.calendar.series}</p>
      ) : project ? (
        <>
          {/* An archived planning comes without its tasks until it is opened, so it has no progress to show. */}
          {project.folded ? (
            <p className="mt-3 text-xs text-fg-muted">{copy.overview.planningArchived}</p>
          ) : (
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar percent={done.percent} label={copy.board.progress} />
              <span className="shrink-0 text-xs text-fg-muted">
                {done.total ? fill(copy.panel.progress, done) : copy.board.noTasks}
              </span>
            </div>
          )}
          <LeadLine project={project} membersById={membersById} copy={copy} className="mt-3" />
          <div className="mt-3 flex items-center justify-between gap-2">
            <AvatarStack ids={projectAssignees(project)} membersById={membersById} copy={copy.people} />
            <button type="button" className={`${TOOL_BUTTON} ml-auto h-9`} onClick={() => onOpen(project.id)}>
              {copy.calendar.openProject}
            </button>
          </div>
        </>
      ) : (
        <button type="button" className={`${PRIMARY_BUTTON} mt-3 h-9`} onClick={() => onStart(event)}>
          {copy.calendar.startPlanning}
        </button>
      )}
    </article>
  )
}

export default function EventCalendar({ events, deadlines, planOf, complete, today, copy, locale, membersById, onStart, onOpen, onOpenEvent, onAddOnDay }) {
  const text = copy.calendar
  const [mode, setMode] = useState('month')
  const [cursor, setCursor] = useState(today)
  const [selected, setSelected] = useState(null)

  const byDay = new Map()
  for (const event of events) byDay.set(event.day, [...(byDay.get(event.day) ?? []), event])
  const days = gridDays(mode, cursor)
  const shift = (step) => setCursor(mode === 'week' ? addDays(cursor, 7 * step) : addMonths(cursor, step))
  const heading =
    mode === 'week'
      ? `${longDay(days[0], locale)} – ${longDay(days[6], locale)}`
      : new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(
          new Date(`${monthStart(cursor)}T00:00:00Z`),
        )
  const selectedProjects = selected ? deadlines.filter((project) => project.due === selected) : []
  const listed = selected ? (byDay.get(selected) ?? []) : events.filter((event) => isEvent(event) && event.day >= today).slice(0, UPCOMING_MAX)

  return (
    <section aria-label={text.heading} className={`${SURFACE} p-4 sm:p-5`}>
      {!complete && <p className="mb-4 text-sm text-fg-muted">{text.unavailable}</p>}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Segmented label={copy.views.label} options={{ month: text.month, week: text.week }} value={mode} onChange={setMode} />
            <button type="button" className={ICON_BUTTON} aria-label={text.previous} onClick={() => shift(-1)}>
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <button type="button" className={ICON_BUTTON} aria-label={text.next} onClick={() => shift(1)}>
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              type="button"
              className={`${TOOL_BUTTON} h-8`}
              onClick={() => {
                setCursor(today)
                setSelected(today)
              }}
            >
              {text.today}
            </button>
            <p className="ml-auto text-sm font-medium capitalize" aria-live="polite">
              {heading}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-fg-muted" aria-hidden="true">
            {text.weekdays.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
          <ul role="list" className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayEvents = byDay.get(day) ?? []
              const dayProjects = deadlines.filter((project) => project.due === day)
              const outside = mode === 'month' && day.slice(0, 7) !== monthStart(cursor).slice(0, 7)
              const isToday = day === today
              const isSelected = day === selected
              return (
                <li
                  key={day}
                  className={`relative flex flex-col items-stretch gap-1 rounded-md border p-1 transition-colors ${
                    mode === 'week' ? 'min-h-28' : 'min-h-11 sm:min-h-16'
                  } ${isSelected ? 'border-fg bg-bg-subtle' : 'border-transparent hover:bg-bg-subtle'} ${outside ? 'opacity-40' : ''}`}
                >
                  {/* The day is a layer behind the titles, because a button cannot hold the buttons of its events. */}
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`${longDay(day, locale)}${dayEvents.length + dayProjects.length ? `: ${[...dayEvents, ...dayProjects].map((item) => item.title).join(', ')}` : ''}`}
                    onClick={() => setSelected(isSelected ? null : day)}
                    className="absolute inset-0 rounded-md border-0 bg-transparent p-0"
                  />
                  <span
                    className={`pointer-events-none relative flex h-6 w-6 items-center justify-center self-center rounded-full text-xs sm:self-start ${
                      isToday ? 'bg-brand-bright font-semibold text-white' : day < today ? 'text-fg-muted' : 'text-fg'
                    }`}
                  >
                    {Number(day.slice(8))}
                  </span>
                  {dayEvents.length + dayProjects.length > 0 && (
                    <>
                      {/* Phones only get dots: titles do not fit into a seventh of the screen. */}
                      <span className={`pointer-events-none relative flex justify-center gap-0.5 ${mode === 'week' ? 'hidden' : 'sm:hidden'}`}>
                        {dayEvents.map((event) => (
                          <span
                            key={event.id}
                            className={`h-1.5 w-1.5 rounded-full ${planOf(event) ? 'bg-brand-bright' : 'bg-accent'}`}
                          />
                        ))}
                        {dayProjects.map((project) => (
                          <span key={project.id} className="h-1.5 w-1.5 rounded-full border border-solid border-fg-muted" />
                        ))}
                      </span>
                      <span className={`relative flex-col gap-0.5 ${mode === 'week' ? 'flex' : 'hidden sm:flex'}`}>
                        {dayEvents.map((event) => (
                          <button
                            key={event.id}
                            type="button"
                            title={event.title}
                            onClick={() => onOpenEvent(event)}
                            className={`block w-full truncate rounded border-0 px-1 py-0.5 text-left text-2xs leading-tight ${
                              planOf(event)
                                ? 'bg-brand-bright text-white'
                                : 'bg-[color-mix(in_srgb,var(--color-accent-text)_18%,transparent)] text-fg'
                            }`}
                          >
                            {event.title}
                          </button>
                        ))}
                        {dayProjects.map((project) => (
                          <button
                            key={project.id}
                            type="button"
                            title={project.title}
                            onClick={() => onOpen(project.id)}
                            className="block w-full truncate rounded border border-solid border-border-strong bg-transparent px-1 py-0.5 text-left text-2xs leading-tight text-fg"
                          >
                            {project.title}
                          </button>
                        ))}
                      </span>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
            <span className="inline-flex items-center gap-1">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-bright" />
              {text.planned}
            </span>
            <span className="inline-flex items-center gap-1">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" />
              {text.notPlanned}
            </span>
            <span className="inline-flex items-center gap-1">
              <span aria-hidden="true" className="h-2 w-2 rounded-full border border-solid border-fg-muted" />
              {copy.overview.legendProject}
            </span>
          </p>
        </div>

        <div aria-live="polite" className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-fg-muted">
              {selected ? fill(text.dayEvents, { date: longDay(selected, locale) }) : text.upcoming}
            </h3>
            {selected && (
              <button type="button" className="border-0 bg-transparent p-0 text-sm text-accent underline" onClick={() => setSelected(null)}>
                {text.allEvents}
              </button>
            )}
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {listed.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                project={planOf(event)}
                copy={copy}
                locale={locale}
                membersById={membersById}
                onStart={onStart}
                onOpen={onOpen}
              />
            ))}
            {!listed.length && !selectedProjects.length && <p className="text-sm text-fg-muted">{selected ? text.noEvents : text.noUpcoming}</p>}
            {selectedProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                className="rounded-lg border border-solid border-border-strong bg-transparent p-3 text-left text-fg hover:bg-bg-subtle"
                onClick={() => onOpen(project.id)}
              >
                <span className="block text-xs text-fg-muted">{copy.overview.legendProject}</span>
                <span className="block text-sm font-medium">{project.title}</span>
              </button>
            ))}
            {selected && selected >= today && (
              <div className="flex flex-wrap gap-2">
                {['internal', 'task', 'event'].map((kind) => (
                  <button key={kind} type="button" className={`${TOOL_BUTTON} h-9`} onClick={() => onAddOnDay(kind, selected)}>
                    <Plus aria-hidden="true" className="h-4 w-4" />
                    {text.addKinds[kind].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
