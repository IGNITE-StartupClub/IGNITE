/**
 * An event without a plan, opened from a calendar: the card of the events page in a modal dialog. An event with a plan
 * opens its project instead (openEvent in TaskWorkspace).
 * Props: entry (from calendarEntries, null = closed), copy (workspace copy), locale, membersById, onStart(entry), onClose.
 */
import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { EventCard } from './EventCards'

export default function EventDialog({ entry, copy, locale, membersById, onStart, onClose }) {
  const dialog = useRef(null)
  useEffect(() => {
    if (entry && !dialog.current.open) dialog.current.showModal()
  }, [entry])

  return (
    <dialog
      ref={dialog}
      aria-label={entry?.title}
      onClose={onClose}
      // A click on the backdrop lands on the dialog element itself.
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      className="w-[min(28rem,calc(100vw-2rem))] rounded-card border-0 bg-transparent p-0 text-fg backdrop:bg-black/60"
    >
      {entry && (
        <>
          <EventCard
            entry={entry}
            copy={copy}
            locale={locale}
            membersById={membersById}
            onStart={(event) => {
              dialog.current.close()
              onStart(event)
            }}
          />
          <button
            type="button"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border-0 bg-bg p-0 text-fg shadow-sm"
            aria-label={copy.panel.close}
            onClick={() => dialog.current.close()}
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </>
      )}
    </dialog>
  )
}
