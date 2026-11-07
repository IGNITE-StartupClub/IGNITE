/**
 * The dialog of a private task: all its fields and deleting it. A private task has no project, so it opens here and not
 * in the project panel. Saving sends only the fields changed since the dialog opened, so an edit on another device stays.
 * Props: task (null = closed), copy (workspace copy), run, onClose.
 */
import React, { useEffect, useId, useRef, useState } from 'react'
import { changedFields } from '../../../lib/liveUpdates'
import { PRIORITIES, TASK_STATUSES, TEXT_MAX, TITLE_MAX } from '../../../lib/tasks'
import { DANGER_BUTTON, fill, FormDialog } from '../memberUi'
import { TeamSelect } from './taskUi'

export default function PrivateTaskDialog({ task, copy, run, onClose }) {
  const text = copy.private
  const labels = copy.createDialog
  const dialog = useRef(null)
  const id = useId()
  const [start, setStart] = useState(null)
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (!task) return
    const { title, description, due, priority, status, team } = task
    setStart({ title, description, due, priority, status, team })
    setForm({ title, description, due, priority, status, team })
    dialog.current.showModal()
  }, [task?.id])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const save = async (e) => {
    e.preventDefault()
    const patch = changedFields(start, form)
    if (!Object.keys(patch).length) return dialog.current.close()
    if (await run({ action: 'updatePrivate', taskId: task.id, patch })) dialog.current.close()
  }
  const remove = async () => {
    if (!window.confirm(fill(text.confirmRemove, { title: task.title }))) return
    if (await run({ action: 'removePrivate', taskId: task.id })) dialog.current.close()
  }

  return (
    <FormDialog dialogRef={dialog} id={`${id}-heading`} heading={text.heading} closeLabel={copy.panel.close} onClose={onClose} onSubmit={save}>
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
          <div className="form-actions">
            <button type="submit" className="form-submit" disabled={!form.title.trim()}>
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
