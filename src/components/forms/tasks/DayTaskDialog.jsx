/**
 * A task added from a day of a calendar: title and deadline, which starts on that day. The task is the member's own,
 * like one from the quick add without a person, or only theirs with "Nur für mich".
 * Props: request ({ day } or null = closed), copy (workspace copy), onAdd({ title, due }, isPrivate) → the answer or null,
 * onClose.
 */
import React, { useEffect, useId, useRef, useState } from 'react'
import { TITLE_MAX } from '../../../lib/tasks'
import { FormDialog } from '../memberUi'
import { PrivateToggle } from './taskUi'

export default function DayTaskDialog({ request, copy, onAdd, onClose }) {
  const text = copy.createDialog
  const dialog = useRef(null)
  const title = useRef(null)
  const id = useId()
  const [form, setForm] = useState({ title: '', due: '' })
  const [isPrivate, setPrivate] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!request) return
    setForm({ title: '', due: request.day })
    setPrivate(false)
    if (!dialog.current.open) dialog.current.showModal()
    // showModal focuses the first control, the close button.
    title.current.focus()
  }, [request])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const data = await onAdd({ title: form.title.trim(), due: form.due }, isPrivate)
    setBusy(false)
    if (data) dialog.current.close()
  }

  return (
    <FormDialog dialogRef={dialog} id={`${id}-heading`} heading={text.headings.task} closeLabel={copy.panel.close} onClose={onClose} onSubmit={submit}>
      <div className="field">
        <label htmlFor={`${id}-title`} className="field-label">
          {text.title}
        </label>
        <input id={`${id}-title`} ref={title} className="input" required maxLength={TITLE_MAX} value={form.title} onChange={set('title')} />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="field min-w-0 flex-1 basis-48">
          <label htmlFor={`${id}-due`} className="field-label">
            {text.due}
          </label>
          <input id={`${id}-due`} type="date" className="input" value={form.due} onChange={set('due')} />
        </div>
        <PrivateToggle pressed={isPrivate} onChange={setPrivate} label={copy.private.toggle} />
      </div>
      <div className="form-actions">
        <button type="submit" className="form-submit" disabled={busy || !form.title.trim()}>
          {text.submit}
        </button>
        <button type="button" className="form-secondary" onClick={() => dialog.current.close()}>
          {text.cancel}
        </button>
      </div>
    </FormDialog>
  )
}
