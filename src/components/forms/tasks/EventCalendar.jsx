/**
 * The events calendar above the project board: a month or week grid of the public events (Luma and externalEvents,
 * loaded by the page, never copied) and cards for the upcoming events or the selected day. Each card either starts the
 * planning project of its event or opens it. Collapsing is remembered for the browser session.
 * Props: events ({ id, title, startAt, endAt, location, url, day }), projectsByEvent (Map event id → project summary),
 * complete (false when the calendar could not be loaded), today, copy (workspace copy), locale, membersById,
 * onStart(event), onOpen(projectId).
 */
import React, { useEffect, useId, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { addDays, progress } from '../../../lib/tasks'
import { fill, PRIMARY_BUTTON, TOOL_BUTTON } from '../memberUi'
import { AvatarStack, berlinTime, eventDayLabel, ICON_BUTTON, longDay, ProgressBar, projectPeople, SURFACE } from './taskUi'

const COLLAPSED_KEY = 'ignite-tasks-calendar-collapsed'
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
        {eventDayLabel(event.day, locale)} · {berlinTime(event.startAt, locale)}
      </p>
      <h3 className="mt-1 text-base font-semibold leading-snug">{event.title}</h3>
      {event.location && (
        <p className="mt-1 flex items-center gap-1 text-sm text-fg-muted">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{event.location}</span>
        </p>
      )}
      {project ? (
        <>
          <div className="mt-3 flex items-center gap-3">
            <ProgressBar percent={done.percent} label={copy.board.progress} />
            <span className="shrink-0 text-xs text-fg-muted">
              {done.total ? fill(copy.panel.progress, done) : copy.board.noTasks}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <AvatarStack ids={projectPeople(project)} membersById={membersById} copy={copy.people} />
            <button type="button" className={`${TOOL_BUTTON} h-9`} onClick={() => onOpen(project.id)}>
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

export default function EventCalendar({ events, projectsByEvent, complete, today, copy, locale, membersById, onStart, onOpen }) {
  const text = copy.calendar
  const gridId = useId()
  const [mode, setMode] = useState('month')
  const [cursor, setCursor] = useState(today)
  const [selected, setSelected] = useState(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(sessionStorage.getItem(COLLAPSED_KEY) === '1')
    } catch {
      // Without storage the calendar simply starts open.
    }
  }, [])
  const toggleCollapsed = () => {
    setCollapsed(!collapsed)
    try {
      sessionStorage.setItem(COLLAPSED_KEY, collapsed ? '0' : '1')
    } catch {
      // Not remembering the choice is harmless.
    }
  }

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
  const listed = selected ? (byDay.get(selected) ?? []) : events.filter((event) => event.day >= today).slice(0, UPCOMING_MAX)

  return (
    <section aria-labelledby={`${gridId}-heading`} className={`${SURFACE} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${gridId}-heading`} className="text-lg font-semibold">
          {text.heading}
        </h2>
        <button
          type="button"
          className={`${TOOL_BUTTON} h-9`}
          aria-expanded={!collapsed}
          aria-controls={gridId}
          onClick={toggleCollapsed}
        >
          {collapsed ? text.expand : text.collapse}
          <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>
      {!complete && <p className="mt-3 text-sm text-fg-muted">{text.unavailable}</p>}

      <div id={gridId} hidden={collapsed} className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label={copy.views.label} className="inline-flex rounded-lg border border-border-strong p-0.5">
              {['month', 'week'].map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={mode === item}
                  onClick={() => setMode(item)}
                  className={`h-8 rounded-md border-0 px-3 text-sm ${mode === item ? 'bg-fg text-bg' : 'bg-transparent text-fg hover:bg-bg-subtle'}`}
                >
                  {text[item]}
                </button>
              ))}
            </div>
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
              const outside = mode === 'month' && day.slice(0, 7) !== monthStart(cursor).slice(0, 7)
              const isToday = day === today
              const isSelected = day === selected
              return (
                <li key={day}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`${longDay(day, locale)}${dayEvents.length ? `: ${dayEvents.map((event) => event.title).join(', ')}` : ''}`}
                    onClick={() => setSelected(isSelected ? null : day)}
                    className={`flex w-full flex-col items-stretch gap-1 rounded-md border p-1 text-left transition-colors ${
                      mode === 'week' ? 'min-h-28' : 'min-h-11 sm:min-h-16'
                    } ${isSelected ? 'border-fg bg-bg-subtle' : 'border-transparent hover:bg-bg-subtle'} ${outside ? 'opacity-40' : ''}`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center self-center rounded-full text-xs sm:self-start ${
                        isToday ? 'bg-brand-bright font-semibold text-white' : day < today ? 'text-fg-muted' : 'text-fg'
                      }`}
                    >
                      {Number(day.slice(8))}
                    </span>
                    {dayEvents.length > 0 && (
                      <>
                        {/* Phones only get dots: titles do not fit into a seventh of the screen. */}
                        <span className={`flex justify-center gap-0.5 ${mode === 'week' ? 'hidden' : 'sm:hidden'}`}>
                          {dayEvents.map((event) => (
                            <span
                              key={event.id}
                              className={`h-1.5 w-1.5 rounded-full ${projectsByEvent.has(event.id) ? 'bg-brand-bright' : 'bg-accent'}`}
                            />
                          ))}
                        </span>
                        <span className={`flex-col gap-0.5 ${mode === 'week' ? 'flex' : 'hidden sm:flex'}`}>
                          {dayEvents.map((event) => (
                            <span
                              key={event.id}
                              className={`truncate rounded px-1 py-0.5 text-[0.6875rem] leading-tight ${
                                projectsByEvent.has(event.id)
                                  ? 'bg-brand-bright text-white'
                                  : 'bg-[color-mix(in_srgb,var(--color-accent-text)_18%,transparent)] text-fg'
                              }`}
                            >
                              {event.title}
                            </span>
                          ))}
                        </span>
                      </>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="mt-2 flex items-center gap-3 text-xs text-fg-muted">
            <span className="inline-flex items-center gap-1">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-bright" />
              {text.planned}
            </span>
            <span className="inline-flex items-center gap-1">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" />
              {text.notPlanned}
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
                project={projectsByEvent.get(event.id)}
                copy={copy}
                locale={locale}
                membersById={membersById}
                onStart={onStart}
                onOpen={onOpen}
              />
            ))}
            {!listed.length && <p className="text-sm text-fg-muted">{selected ? text.noEvents : text.noUpcoming}</p>}
          </div>
        </div>
      </div>
    </section>
  )
}
