/**
 * The events page as cards: everything coming up with cover, date and the state of its planning, then the past events
 * as a short list. Of the Weekly only the next date gets a card. An own event that may be a public event asks once
 * whether the two are the same; only the answer changes anything, a card never merges by itself.
 * Props: entries and twins (calendarEntries), planOf(entry) → its project or undefined, complete, today, copy (workspace
 * copy), locale, membersById, onStart(entry), onOpen(projectId), onMerge(project, event), onApart(project, event).
 */
import React, { useState } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'
import { nextOfSeries, progress } from '../../../lib/tasks'
import { fill, PRIMARY_BUTTON, TOOL_BUTTON } from '../memberUi'
import { dayPart, eventDayLabel, LeadLine, longDay } from './taskUi'

const PAST_SHOWN = 5

function Cover({ entry, locale }) {
  return (
    <div className="relative h-[190px] shrink-0 overflow-hidden">
      {entry.coverUrl ? (
        <img src={entry.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="surface-brand grid h-full w-full place-items-center">
          <img src="/brand/ignite-mark-white.svg" alt="" className="h-14 w-14 opacity-90" />
        </div>
      )}
      <div aria-hidden="true" className="absolute left-3 top-3 flex h-14 w-12 flex-col items-center justify-center rounded-lg bg-bg text-fg shadow-sm">
        <span className="text-2xs font-medium uppercase">{dayPart(entry.day, locale, { month: 'short' }).replace('.', '')}</span>
        <span className="text-[20px] font-semibold leading-tight">{dayPart(entry.day, locale, { day: 'numeric' }).replace('.', '')}</span>
      </div>
    </div>
  )
}

function TwinQuestion({ project, event, copy, locale, onMerge, onApart }) {
  const text = copy.calendar
  return (
    <div className="rounded-lg border border-border-strong bg-bg-subtle p-3 text-sm">
      <p>{fill(text.twin, { title: event.title, date: longDay(event.day, locale) })}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button type="button" className={`${PRIMARY_BUTTON} h-9`} onClick={() => onMerge(project, event)}>
          {text.merge}
        </button>
        <button type="button" className={`${TOOL_BUTTON} h-9`} onClick={() => onApart(project, event)}>
          {text.apart}
        </button>
      </div>
    </div>
  )
}

export function EventCard({ entry, project, twin, copy, locale, membersById, onStart, onOpen, onMerge, onApart }) {
  const text = copy.calendar
  const tasks = project && progress(project.tasks)
  const planning = !project ? copy.overview.noPlanning : tasks.total ? fill(copy.overview.planning, tasks) : copy.overview.planningEmpty
  return (
    <article className="flex w-full min-w-0 flex-col overflow-hidden rounded-card border border-border bg-card">
      <Cover entry={entry} locale={locale} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          {entry.source === 'own' && <p className="mb-1 text-caption font-medium text-accent">{text.own}</p>}
          <h2 className="text-[20px] font-semibold leading-tight">{entry.title}</h2>
          <p className="mt-1 text-sm text-fg-muted">
            {eventDayLabel(entry.day, locale)}
            {entry.time && ` · ${fill(copy.overview.time, { time: entry.time })}`}
          </p>
          {entry.location && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-fg-muted">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{entry.location}</span>
            </p>
          )}
        </div>
        <div>
          <p className="text-sm text-fg-muted">{planning}</p>
          {project && <LeadLine project={project} membersById={membersById} copy={copy} className="mt-0.5" />}
        </div>
        {twin && <TwinQuestion project={project} event={twin} copy={copy} locale={locale} onMerge={onMerge} onApart={onApart} />}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
          <button type="button" className={project ? `${TOOL_BUTTON} h-10` : `${PRIMARY_BUTTON} h-10`} onClick={() => (project ? onOpen(project.id) : onStart(entry))}>
            {project ? copy.overview.openPlanning : text.startPlanning}
          </button>
          {entry.url && (
            <a href={entry.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
              {text.eventPage}
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

function PastEvents({ entries, planOf, copy, locale, onOpen }) {
  const text = copy.calendar
  const [all, setAll] = useState(false)
  const shown = all ? entries : entries.slice(0, PAST_SHOWN)
  return (
    <section aria-labelledby="past-events">
      <h2 id="past-events" className="text-[20px] font-semibold tracking-tight">
        {text.past}
      </h2>
      <ul role="list" className="mt-2 flex flex-col">
        {shown.map((entry) => {
          const project = planOf(entry)
          return (
            <li key={entry.id} className="flex min-h-12 items-center gap-4 border-0 border-t border-solid border-border py-2 first:border-t-0">
              <span className="w-24 shrink-0 text-caption tabular-nums text-fg-muted">{eventDayLabel(entry.day, locale)}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{entry.title}</span>
              {project && (
                <button type="button" className="shrink-0 border-0 bg-transparent p-0 text-sm text-accent hover:underline" onClick={() => onOpen(project.id)}>
                  {copy.overview.openPlanning}
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {shown.length < entries.length && (
        <button type="button" className="mt-2 border-0 bg-transparent p-0 text-sm text-fg-muted underline underline-offset-2 hover:text-fg" onClick={() => setAll(true)}>
          {fill(text.showAllPast, { count: entries.length })}
        </button>
      )}
    </section>
  )
}

export default function EventCards({ entries, twins, planOf, complete, today, copy, locale, membersById, onStart, onOpen, onMerge, onApart }) {
  const upcoming = nextOfSeries(entries.filter((entry) => entry.endDay >= today), planOf)
  const past = entries.filter((entry) => entry.endDay < today).reverse()
  return (
    <div className="flex flex-col gap-8">
      {!complete && <p className="text-sm text-fg-muted">{copy.calendar.unavailable}</p>}
      {!upcoming.length && complete && <p className="py-6 text-center text-sm text-fg-muted">{copy.calendar.noUpcoming}</p>}
      {upcoming.length > 0 && (
        <ul role="list" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((entry) => (
            <li key={entry.id} className="flex min-w-0">
              <EventCard
                entry={entry}
                project={planOf(entry)}
                twin={entry.source === 'own' ? twins.get(entry.id) : undefined}
                copy={copy}
                locale={locale}
                membersById={membersById}
                onStart={onStart}
                onOpen={onOpen}
                onMerge={onMerge}
                onApart={onApart}
              />
            </li>
          ))}
        </ul>
      )}
      {past.length > 0 && <PastEvents entries={past} planOf={planOf} copy={copy} locale={locale} onOpen={onOpen} />}
    </div>
  )
}
