/**
 * The dialog of a private task: all its fields, sharing it and deleting it. A private task has no project, so it opens
 * here and not in the project panel. Saving sends only the fields changed since the dialog opened, so an edit on another
 * device stays; closing with unsaved changes asks first (DiscardDialog). "Teilen" saves what was typed and then makes the
 * task a shared single task (sharePrivate), which opens in its place.
 * Props: task (null = closed), copy (workspace copy), run, onClose, onShared(id) with the id of the shared task's card.
 */
import React, { useEffect, useId, useRef, useState } from 'react'
import { changedFields } from '../../../lib/liveUpdates'
import { PRIORITIES, REPEATS, TASK_STATUSES, TEXT_MAX, TITLE_MAX } from '../../../lib/tasks'
import { DANGER_BUTTON, fill, FormDialog, TOOL_BUTTON } from '../memberUi'
import { TeamSelect } from './taskUi'

export default function PrivateTaskDialog({ task, copy, run, onClose, onShared }) {
  const text = copy.private
  const labels = copy.createDialog
  const dialog = useRef(null)
  const id = useId()
  const [start, setStart] = useState(null)
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!task) return
    const { title, description, due, priority, status, team, repeat = '' } = task
    setStart({ title, description, due, priority, status, team, repeat })
    setForm({ title, description, due, priority, status, team, repeat })
    dialog.current.showModal()
  }, [task?.id])
  // The task can go while the dialog is open: deleted on another device, or a restore was undone.
  useEffect(() => {
    if (!task && dialog.current.open) dialog.current.close()
  }, [task])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const patch = form ? changedFields(start, form) : {}
  const dirty = Object.keys(patch).length > 0
  const saveChanges = () => !dirty || run({ action: 'updatePrivate', taskId: task.id, patch })
  const save = async (e) => {
    e.preventDefault()
    if (await saveChanges()) dialog.current.close()
  }
  const share = async () => {
    setBusy(true)
    const shared = (await saveChanges()) && (await run({ action: 'sharePrivate', taskId: task.id }))
    setBusy(false)
    if (!shared) return
    dialog.current.close()
    onShared(shared.id)
  }
  const remove = async () => {
    if (!window.confirm(fill(text.confirmRemove, { title: task.title }))) return
    if (await run({ action: 'removePrivate', taskId: task.id })) dialog.current.close()
  }

  return (
    <FormDialog
      dialogRef={dialog}
      id={`${id}-heading`}
      heading={text.heading}
      closeLabel={copy.panel.close}
      onClose={onClose}
      onSubmit={save}
      dirty={dirty}
      discard={copy.discard}
    >
      {form && (
        <>
          <p className="text-sm text-fg-muted">{text.hint}</p>
          <div className="field">
            <label htmlFor={`${id}-title`} className="field-label">
              {labels.title}
            </label>
            <input id={`${id}-title`} className="input" required maxLength={TITLE_MAX} value={form.title} onChange={set('title')} />
          </div>
          <div className="field">
            <label htmlFor={`${id}-description`} className="field-label">
              {labels.description}
            </label>
            <textarea id={`${id}-description`} className="input min-h-20" maxLength={TEXT_MAX} value={form.description} onChange={set('description')} />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor={`${id}-status`} className="field-label">
                {copy.panel.status}
              </label>
              <select id={`${id}-status`} className="input" value={form.status} onChange={set('status')}>
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {copy.taskStatuses[status]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor={`${id}-team`} className="field-label">
                {labels.team}
              </label>
              <TeamSelect id={`${id}-team`} className="input" value={form.team} onChange={set('team')} teams={copy.teams} empty={copy.teamTabs.none} />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor={`${id}-due`} className="field-label">
                {labels.due}
              </label>
              <input id={`${id}-due`} type="date" className="input" value={form.due} onChange={set('due')} />
            </div>
            <div className="field">
              <label htmlFor={`${id}-priority`} className="field-label">
                {copy.panel.priority}
              </label>
              <select id={`${id}-priority`} className="input" value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {copy.priorities[priority]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor={`${id}-repeat`} className="field-label">
              {copy.panel.repeat}
            </label>
            <select
              id={`${id}-repeat`}
              className="input"
              value={form.repeat}
              onChange={set('repeat')}
              aria-describedby={form.repeat ? `${id}-repeat-hint` : undefined}
            >
              {REPEATS.map((repeat) => (
                <option key={repeat} value={repeat}>
                  {copy.repeats[repeat]}
                </option>
              ))}
            </select>
            {form.repeat && (
              <p id={`${id}-repeat-hint`} className="mt-1 text-xs text-fg-muted">
                {copy.panel.repeatHint}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-bg-subtle p-3">
            <p className="min-w-0 flex-[1_1_16rem] text-sm text-fg-muted">{text.shareHint}</p>
            <button type="button" className={`${TOOL_BUTTON} h-9`} disabled={busy || !form.title.trim()} onClick={share}>
              {text.share}
            </button>
          </div>
          <div className="form-actions">
            <button type="submit" className="form-submit" disabled={busy || !form.title.trim()}>
              {copy.panel.save}
            </button>
            <button type="button" className={DANGER_BUTTON} onClick={remove}>
              {text.remove}
            </button>
          </div>
        </>
      )}
    </FormDialog>
  )
}
