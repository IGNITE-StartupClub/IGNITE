/**
 * Turns an internal project into an event once its Luma event exists, because planning often starts before it (decided
 * by Noah on 2026-11-11). The member pastes the Luma link and sees what Luma says; saving sends `makeEvent`. An event of
 * the IGNITE calendar turns the project into its planning, any other Luma event into an own event with Luma's day, time
 * and place. Tasks, people, status, title and description stay.
 * Props: project (the internal project), open (shows the dialog while true), copy (workspace copy), locale, run,
 * onClose().
 */
import React, { useEffect, useId, useRef, useState } from 'react'
import { fill, FormDialog, PRIMARY_BUTTON, TOOL_BUTTON } from '../memberUi'
import { LumaPreview, NO_IMPORT, requestLumaEvent, withImport } from './lumaImport'

const NOTHING = { title: '', description: '', place: '' }

export default function MakeEventDialog({ project, open, copy, locale, run, onClose }) {
  const text = copy.makeEvent
  const lumaText = copy.createDialog
  const dialog = useRef(null)
  const input = useRef(null)
  const id = useId()
  const [link, setLink] = useState('')
  const [lumaImport, setLumaImport] = useState(NO_IMPORT)
  const [event, setEvent] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setLink('')
    setLumaImport(NO_IMPORT)
    setEvent(null)
    setBusy(false)
    if (!dialog.current.open) dialog.current.showModal()
    input.current?.focus()
  }, [open])

  const importLuma = async () => {
    setLumaImport({ ...NO_IMPORT, status: 'loading' })
    const answer = await requestLumaEvent(link, lumaText.luma.errors)
    setEvent(answer.event ? withImport(NOTHING, answer.event) : null)
    setLumaImport(answer.state)
  }
  const reset = () => {
    setEvent(null)
    setLumaImport(NO_IMPORT)
    setLink('')
  }

  const { existing, listed } = lumaImport
  const submit = async (e) => {
    e.preventDefault()
    if (!event || existing) return
    setBusy(true)
    const { due, time, endDue, endTime, place, coverUrl, luma } = event
    const body = listed
      ? { action: 'makeEvent', id: project.id, eventId: listed.id }
      : { action: 'makeEvent', id: project.id, luma: { luma, due, time, endDue, endTime, place, coverUrl } }
    const done = await run(body)
    setBusy(false)
    if (done) dialog.current.close()
  }
  // The place field takes the meeting link of an online event too, so both hints land there.
  const hidden = ['place', 'online']
    .filter((field) => !listed && lumaImport.hidden.includes(field))
    .map((field) => `${lumaText.luma.hidden[field]} ${text.later}`)

  return (
    <FormDialog dialogRef={dialog} id={`${id}-heading`} heading={text.heading} closeLabel={copy.panel.close} onClose={onClose} onSubmit={submit}>
      <div className="mt-4 flex flex-col gap-5">
        <p className="text-sm text-fg-muted">{fill(text.intro, { title: project.title })}</p>
        {event ? (
          <LumaPreview form={event} text={lumaText} timeText={copy.overview.time} locale={locale} onUnlink={reset} />
        ) : (
          <div>
            <label htmlFor={`${id}-luma`} className="field-label">
              {lumaText.luma.label}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={input}
                id={`${id}-luma`}
                type="url"
                inputMode="url"
                className="input min-w-0 flex-1 basis-56"
                placeholder="https://luma.com/…"
                aria-describedby={`${id}-luma-status`}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  if (link.trim()) importLuma()
                }}
              />
              <button type="button" className={`${TOOL_BUTTON} h-11`} disabled={!link.trim() || lumaImport.status === 'loading'} onClick={importLuma}>
                {lumaImport.status === 'loading' ? lumaText.luma.importing : lumaText.luma.import}
              </button>
            </div>
          </div>
        )}
        <div id={`${id}-luma-status`} aria-live="polite" className="flex flex-col gap-2 text-sm empty:hidden">
          {lumaImport.status === 'failed' && <p className="text-danger">{lumaImport.error}</p>}
          {existing && <p>{fill(lumaText.luma.existing, { title: existing.title })}</p>}
          {listed && !existing && <p>{text.listed}</p>}
          {hidden.map((hint) => (
            <p key={hint} className="text-fg-muted">
              {hint}
            </p>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={PRIMARY_BUTTON} disabled={!event || !!existing || busy}>
            {text.submit}
          </button>
          <button type="button" className={TOOL_BUTTON} onClick={() => dialog.current.close()}>
            {copy.panel.cancel}
          </button>
        </div>
      </div>
    </FormDialog>
  )
}
