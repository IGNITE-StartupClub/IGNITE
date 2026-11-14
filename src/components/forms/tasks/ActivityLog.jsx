/**
 * The log the server keeps of a project or a single task, loaded when it shows (GET ?activity=<id>) and again after
 * every change. Entries hold ids and days; names, dates and sentences follow the reader's language. Someone assigning
 * themselves reads as taking the task, and a single task speaks of the task, not of a project.
 * Props: project, copy (workspace copy), locale, membersById.
 */
import React, { useEffect, useState } from 'react'
import { projectStatus } from '../../../lib/tasks'
import { fill } from '../memberUi'
import { Avatar, dateTime, longDay, teamName } from './taskUi'

/** The copy key of an entry's sentence. */
function sentence(entry, type, copy) {
  const self = !!entry.member && entry.member === entry.actor
  if (self && entry.action === 'assigned') return 'took'
  if (self && entry.action === 'unassigned') return 'gaveUp'
  if (entry.action === 'dated' && type === 'event') return 'eventDated'
  if (type === 'task' && entry.action in copy.activity.single) return `single.${entry.action}`
  return entry.action
}

export default function ActivityLog({ project, copy, locale, membersById }) {
  const [entries, setEntries] = useState(null) // null while the first answer is on its way
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let current = true
    fetch(`/api/members/tasks?activity=${encodeURIComponent(project.id)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Activity failed with ${res.status}`))))
      .then((data) => {
        if (!current) return
        setEntries(data.activity)
        setFailed(false)
      })
      .catch((err) => {
        console.error(err)
        if (current) setFailed(true)
      })
    return () => {
      current = false
    }
  }, [project.id, project.updatedAt])
  const name = (memberId) => (memberId === 'system' ? copy.activity.system : (membersById.get(memberId)?.name ?? copy.activity.someone))
  // The server stores ids and days; names and dates follow the reader's language.
  const details = {
    status: (status) => copy.statuses[projectStatus(status)] ?? status,
    dated: (day) => longDay(day, locale),
    teamed: (team) => teamName(copy, team) ?? team,
  }
  const text = (key) => key.split('.').reduce((value, part) => value?.[part], copy.activity) ?? ''
  if (failed) return <p className="text-sm text-fg-muted">{copy.results.error}</p>
  if (!entries) return <p className="text-sm text-fg-muted">{copy.panel.loadingActivity}</p>
  if (!entries.length) return <p className="text-sm text-fg-muted">{copy.panel.noActivity}</p>
  return (
    <ol className="flex flex-col gap-4">
      {entries.map((entry, index) => {
        const actor = membersById.get(entry.actor)
        const detail = details[entry.action]?.(entry.detail) ?? entry.detail
        return (
          <li key={`${entry.at}-${index}`} className="flex gap-3 text-sm">
            {actor ? (
              <Avatar member={actor} size="md" decorative />
            ) : (
              <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded-full bg-bg-subtle" />
            )}
            <div>
              <p>{fill(text(sentence(entry, project.type, copy)), { actor: name(entry.actor), detail, member: name(entry.member) })}</p>
              <p className="text-xs text-fg-muted">{dateTime(entry.at, locale)}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
