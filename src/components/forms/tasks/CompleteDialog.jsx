/**
 * Asks before a project moves to "done": lists who still has open tasks, warns about open required ones and can save
 * the task list as a template in the same step. With open tasks there are two ways to finish: along with them
 * ("Offene mit abschließen", closeOpen), or the project only, whose open tasks then stay open but leave every task list.
 * Status and template are separate API actions, sent in this order. When only the template fails, the dialog stays open
 * and a retry saves just the template.
 * Props: project (summary or null = closed), copy (workspace copy), membersById, run, onClose().
 */
import React, { useEffect, useId, useRef, useState } from 'react'
import { openRequired, TITLE_MAX } from '../../../lib/tasks'
import { fill, FormDialog } from '../memberUi'
import { Avatar } from './taskUi'

/** The people with open tasks and how many each has, most first; tasks nobody has taken counted apart. */
function openWork(tasks) {
  const counts = new Map()
  let unassigned = 0
  for (const task of tasks) {
    if (!task.assignees.length) unassigned += 1
    for (const memberId of task.assignees) counts.set(memberId, (counts.get(memberId) ?? 0) + 1)
  }
  return { people: [...counts].sort((a, b) => b[1] - a[1]), unassigned }
}

const finishedProject = (project, closeOpen) => ({
  ...project,
  status: 'done',
  ...(closeOpen && { tasks: project.tasks.map((task) => (task.done ? task : { ...task, done: true, status: 'done' })) }),
})

export default function CompleteDialog({ project, copy, membersById, run, onClose }) {
  const text = copy.completeDialog
  const dialog = useRef(null)
  const id = useId()
  const [asTemplate, setAsTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [busy, setBusy] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (!project) return
    setAsTemplate(false)
    setTemplateName(project.title)
    setFinished(false)
    dialog.current.showModal()
  }, [project?.id])

  const required = project ? openRequired(project.tasks) : 0
  const openTasks = project ? project.tasks.filter((task) => !task.done) : []
  const { people, unassigned } = openWork(openTasks)

  // Two submit buttons when tasks are open; the one pressed says whether they finish too.
  const submit = async (e) => {
    e.preventDefault()
    const closeOpen = e.nativeEvent.submitter?.value === 'all'
    setBusy(true)
    const done =
      finished ||
      !!(await run({ action: 'status', id: project.id, status: 'done', closeOpen }, (projects) =>
        projects.map((item) => (item.id === project.id ? finishedProject(item, closeOpen) : item)),
      ))
    if (done) setFinished(true)
    const saved =
      done && (!asTemplate || !!(await run({ action: 'saveTemplate', id: project.id, name: templateName.trim() })))
    setBusy(false)
    if (saved) dialog.current.close()
  }

  const row = (key, avatar, name, count) => (
    <li key={key} className="flex items-center gap-2.5 text-sm">
      {avatar}
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <span className="shrink-0 text-fg-muted">{fill(text.openCount, { count })}</span>
    </li>
  )

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
          {openTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <p id={`${id}-open`} className="text-sm">
                {openTasks.length === 1 ? text.openTasks.one : fill(text.openTasks.many, { count: openTasks.length })}
              </p>
              <ul role="list" aria-labelledby={`${id}-open`} className="flex max-h-56 flex-col gap-2 overflow-y-auto">
                {people.map(([memberId, count]) => {
                  const member = membersById.get(memberId) ?? { id: memberId, name: copy.activity.someone, photo: null }
                  return row(memberId, <Avatar member={member} decorative />, member.name, count)
                })}
                {unassigned > 0 &&
                  row(
                    'unassigned',
                    <span aria-hidden="true" className="h-6 w-6 shrink-0 rounded-full border border-dashed border-border-strong" />,
                    text.unassigned,
                    unassigned,
                  )}
              </ul>
              <p className="text-caption text-fg-muted">{text.openHint}</p>
            </div>
          )}
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
            {openTasks.length > 0 ? (
              <>
                <button type="submit" value="all" className="form-submit" disabled={busy}>
                  {text.closeOpen}
                </button>
                <button type="submit" value="project" className="form-secondary" disabled={busy}>
                  {text.onlyProject}
                </button>
              </>
            ) : (
              <button type="submit" className="form-submit" disabled={busy}>
                {text.submit}
              </button>
            )}
            <button type="button" className="form-secondary" onClick={() => dialog.current.close()}>
              {text.cancel}
            </button>
          </div>
        </>
      )}
    </FormDialog>
  )
}
