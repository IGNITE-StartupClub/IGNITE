/**
 * Reading a Luma event by its link, shared by CreateDialog (a new event) and MakeEventDialog (a project that becomes
 * one). The server reads Luma (/api/members/luma-import); this module asks it and shows what came back.
 */
import React from 'react'
import { ExternalLink, MapPin } from 'lucide-react'
import { fill } from '../memberUi'
import { dayPart, eventDayLabel } from './taskUi'

export const NO_IMPORT = { status: 'idle', error: '', hidden: [], existing: null, listed: null }

/** The form after an import: what Luma has replaces the field, what it leaves empty keeps what was typed. */
export const withImport = (form, event) => ({
  ...form,
  title: event.title || form.title,
  description: event.description || form.description,
  due: event.due,
  time: event.time,
  // An end on the same day needs no end day of its own.
  endDue: event.endDue && event.endDue !== event.due ? event.endDue : '',
  endTime: event.endTime,
  place: event.place || form.place,
  coverUrl: event.coverUrl,
  luma: { id: event.lumaEventId, url: event.lumaUrl },
})

/**
 * Asks the server for the Luma event behind a link. Resolves to { event, state } with the import state for the form,
 * or to { state } alone with the error to show; `errors` is the copy of the import's error messages.
 */
export async function requestLumaEvent(url, errors) {
  try {
    const res = await fetch('/api/members/luma-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    const data = await res.json()
    if (!res.ok) return { state: { ...NO_IMPORT, status: 'failed', error: errors[data.code] ?? errors.error } }
    return {
      event: data.event,
      state: { status: 'done', error: '', hidden: data.event.hidden, existing: data.existing ?? null, listed: data.listed ?? null },
    }
  } catch (err) {
    console.error('Luma import failed:', err)
    return { state: { ...NO_IMPORT, status: 'failed', error: errors.error } }
  }
}

/** What Luma says about the imported event, so the member sees it is the right one before adding it. */
export function LumaPreview({ form, text, timeText, locale, onUnlink }) {
  const hours = form.time && (form.endTime ? `${form.time}–${form.endTime}` : form.time)
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="surface-brand flex items-center gap-3 p-3">
        {form.coverUrl ? (
          <img src={form.coverUrl} alt={text.luma.cover} className="h-14 w-14 shrink-0 rounded-md object-cover" />
        ) : (
          <div aria-hidden="true" className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-bg text-fg">
            <span className="text-2xs font-medium uppercase">{dayPart(form.due, locale, { month: 'short' }).replace('.', '')}</span>
            <span className="text-[20px] font-semibold leading-tight">{dayPart(form.due, locale, { day: 'numeric' }).replace('.', '')}</span>
          </div>
        )}
        <p className="min-w-0 text-[18px] font-semibold leading-snug">{form.title}</p>
      </div>
      <div className="flex flex-col gap-1 p-3 text-sm">
        <p>
          {eventDayLabel(form.due, locale)}
          {form.endDue && ` – ${eventDayLabel(form.endDue, locale)}`}
          {hours && ` · ${fill(timeText, { time: hours })}`}
        </p>
        {form.place && (
          <p className="flex items-center gap-1 text-fg-muted">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{form.place}</span>
          </p>
        )}
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          <a href={form.luma.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent underline">
            {text.luma.linked}
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          </a>
          <button type="button" className="border-0 bg-transparent p-0 text-fg-muted underline hover:text-fg" onClick={onUnlink}>
            {text.luma.unlink}
          </button>
        </p>
      </div>
    </div>
  )
}
