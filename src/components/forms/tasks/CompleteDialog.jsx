/**
 * Asks before a project moves to "done": warns about open required tasks and can save the task list as a template in
 * the same step. Status and template are separate API actions, sent in this order; open tasks stay in the project.
 * Props: project (summary or null = closed), copy (workspace copy), run, onClose().
 */
import React, { useEffect, useId, useRef, useState } from 'react'
import { openRequired, TITLE_MAX } from '../../../lib/tasks'
import { fill, FormDialog } from '../memberUi'

export default function CompleteDialog({ project, copy, run, onClose }) {
  const text = copy.completeDialog
  const dialog = useRef(null)
  const id = useId()
  const [asTemplate, setAsTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!project) return
    setAsTemplate(false)
    setTemplateName(project.title)
    dialog.current.showModal()
  }, [project?.id])

  const required = project ? openRequired(project.tasks) : 0
  const open = project ? project.tasks.filter((task) => !task.done).length : 0

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const done = await run({ action: 'status', id: project.id, status: 'done' }, (projects) =>
      projects.map((item) => (item.id === project.id ? { ...item, status: 'done' } : item)),
    )
    if (done && asTemplate) await run({ action: 'saveTemplate', id: project.id, name: templateName.trim() })
    setBusy(false)
    if (done) dialog.current.close()
  }

  return (
    <FormDialog
      dialogRef={dialog}
      id={`${id}-heading`}
      heading={project?.type === 'event' ? text.eventHeading : text.heading}
      closeLabel={copy.panel.close}
      onClose={onClose}
      onSubmit={submit}
    >
      {project && (
        <>
          <p className="font-medium">{project.title}</p>
          {required > 0 && (
            <p role="alert" className="rounded-lg border border-danger p-3 text-sm text-danger">
              {fill(text.openRequired, { count: required })}
            </p>
          )}
          {open > 0 && <p className="text-sm text-fg-muted">{fill(text.openTasks, { count: open })}</p>}
          {project.tasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="choice">
                <input type="checkbox" checked={asTemplate} onChange={(e) => setAsTemplate(e.target.checked)} />
                {text.saveTemplate}
              </label>
              {asTemplate && (
                <div className="field">
                  <label htmlFor={`${id}-template`} className="field-label">
                    {copy.panel.templateName}
                  </label>
                  <input
                    id={`${id}-template`}
                    className="input"
                    required
                    maxLength={TITLE_MAX}
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
          <div className="form-actions">
            <button type="submit" className="form-submit" disabled={busy}>
              {text.submit}
            </button>
            <button type="button" className="form-secondary" onClick={() => dialog.current.close()}>
              {text.cancel}
            </button>
          </div>
        </>
      )}
    </FormDialog>
  )
}
