/**
 * Dashboard of the members start page: greeting with team and key figures, the next open tasks and the next event.
 * Ticking a task posts to /api/members/tasks; the row stays struck through until the next load and the figures follow.
 * Props: copy (memberArea.home.dashboard), welcome, name (greeting), team ({ name, icon }), tasks (the member's open
 * tasks from openTasks(), each with a dueLabel), today, event ({ id, title, month, day, when } or null), eventsComplete,
 * links ({ team, mine, tasks, events, project }; team is '' for the board, which has nothing to change, and project is
 * the task page, a project id goes behind its #).
 */
import React, { useState } from 'react'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { eventTaskCount, homeFigures } from '../../lib/memberHome'
import { fill } from './memberUi'

const NEXT_TASKS = 4
const PANEL_TILE = 'bg-bg-subtle transition-colors hover:bg-[hsl(261_62%_34%)]'
const TEAM_CHIP = 'inline-flex min-h-[52px] items-center gap-2.5 rounded-button py-[5px] pl-[5px] pr-[18px] font-medium text-fg'
const ROW = 'transition-colors hover:bg-bg-subtle'

function Figure({ value, label, url, alert }) {
  return (
    <li>
      <a href={url} className={`${PANEL_TILE} flex h-full flex-col gap-0.5 rounded-card px-[clamp(12px,1.6vw,22px)] py-[18px] text-fg no-underline`}>
        <span className={`text-[52px] font-semibold leading-[1.1] tracking-tight ${alert ? 'text-[#ffb4ab]' : ''}`}>{value}</span>
        <span className="text-sm text-fg-muted">{label}</span>
      </a>
    </li>
  )
}

function TaskRow({ task, done, today, copy, projectUrl, onToggle }) {
  const late = task.group === 'overdue' && !done
  const dueToday = task.due === today && !done
  return (
    <li className={`${ROW} flex min-h-[76px] items-center gap-1.5 border-t border-border py-2 pl-3 pr-6`}>
      <label className="relative inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={done}
          onChange={(e) => onToggle(task, e.target.checked)}
          aria-label={fill(copy.done, { title: task.title })}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus ${
            done ? 'border-primary bg-primary text-primary-fg' : 'border-border-strong hover:border-accent'
          }`}
        >
          {done && <Check className="h-4 w-4" strokeWidth={3} />}
        </span>
      </label>
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${done ? 'text-fg-muted line-through' : 'text-fg'}`}>{task.title}</p>
        <a href={projectUrl} className="text-caption text-accent no-underline hover:underline">
          {task.private ? copy.private : task.projectTitle}
        </a>
      </div>
      <span
        className={`shrink-0 text-caption ${late ? 'font-semibold text-danger' : dueToday ? 'font-semibold text-accent' : 'text-fg-muted'}`}
      >
        {task.dueLabel}
      </span>
    </li>
  )
}

function EventCard({ copy, event, eventsComplete, openCount, url }) {
  const line = openCount === 0 ? copy.none : openCount === 1 ? copy.one : fill(copy.many, { count: openCount })
  return (
    <section aria-labelledby="next-event" className="flex min-w-0 flex-[1_1_380px] flex-col gap-5 rounded-card border border-border bg-card p-6">
      <h2 id="next-event" className="text-[24px] font-semibold tracking-tight">
        {copy.heading}
      </h2>
      {event ? (
        <>
          <div className="flex items-center gap-4">
            <div aria-hidden="true" className="surface-brand flex h-[76px] w-[72px] shrink-0 flex-col items-center justify-center rounded-card">
              <span className="text-xs font-medium text-fg-muted">{event.month}</span>
              <span className="text-[28px] font-semibold leading-[1.1] tracking-tight">{event.day}</span>
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-tight tracking-tight">{event.title}</p>
              <p className="text-sm text-fg-muted">{event.when}</p>
            </div>
          </div>
          <p className="text-sm text-fg-muted">{line}</p>
        </>
      ) : (
        <p className="text-sm text-fg-muted">{eventsComplete ? copy.empty : copy.unavailable}</p>
      )}
      <a
        href={url}
        className={`${ROW} mt-auto inline-flex min-h-[52px] items-center justify-center rounded-button border border-border-strong font-semibold text-fg no-underline`}
      >
        {copy.calendar}
      </a>
    </section>
  )
}

export default function MemberDashboard({ copy, welcome, name, team, tasks, today, event, eventsComplete, links }) {
  const [doneIds, setDoneIds] = useState(() => new Set())
  const [failed, setFailed] = useState(false)

  const mark = (id, done) =>
    setDoneIds((current) => {
      const next = new Set(current)
      if (done) next.add(id)
      else next.delete(id)
      return next
    })

  const toggle = async (task, done) => {
    mark(task.id, done)
    setFailed(false)
    try {
      const res = await fetch('/api/members/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          task.private
            ? { action: 'updatePrivate', taskId: task.id, patch: { done } }
            : { action: 'updateTask', id: task.projectId, taskId: task.id, patch: { done } },
        ),
      })
      if (!res.ok) throw new Error(`Task not updated: ${res.status}`)
    } catch (err) {
      console.error(err)
      mark(task.id, !done)
      setFailed(true)
    }
  }

  const open = tasks.filter((task) => !doneIds.has(task.id))
  const figures = homeFigures(open)

  return (
    <div className="flex flex-col gap-7 text-sm">
      <section
        aria-labelledby="page-title"
        className="surface-brand relative flex flex-wrap items-end justify-between gap-8 overflow-hidden rounded-3xl p-[clamp(20px,3vw,40px)]"
      >
        <img src="/brand/ignite-mark-white.svg" alt="" className="pointer-events-none absolute -right-10 -top-[90px] h-auto w-[420px] max-w-none opacity-5" />
        <div className="relative flex flex-col items-start gap-4">
          <h1 id="page-title" className="text-[clamp(2.25rem,1.6rem+2.8vw,3.75rem)] leading-[1.1] hyphens-none">
            {welcome}, <em>{name}</em>
          </h1>
          {links.team ? (
            <a href={links.team} aria-label={fill(copy.changeTeam, { team: team.name })} className={`${PANEL_TILE} ${TEAM_CHIP} no-underline`}>
              <img src={team.icon} alt="" width="42" height="42" className="block rounded-full" />
              {team.name}
              <ChevronDown aria-hidden="true" className="h-4 w-4 text-fg-muted" strokeWidth={3} />
            </a>
          ) : (
            <p className={`${TEAM_CHIP} bg-bg-subtle`}>
              <img src={team.icon} alt="" width="42" height="42" className="block rounded-full" />
              {team.name}
            </p>
          )}
        </div>
        <ul className="relative grid min-w-0 flex-[0_1_620px] grid-cols-3 gap-[clamp(8px,1vw,14px)]">
          <Figure value={figures.open} label={copy.figures.open} url={links.mine} />
          <Figure value={figures.week} label={copy.figures.week} url={links.mine} />
          <Figure value={figures.overdue} label={copy.figures.overdue} url={links.mine} alert={figures.overdue > 0} />
        </ul>
      </section>

      <div className="flex flex-wrap items-stretch gap-7">
        <section aria-labelledby="my-tasks" className="flex min-w-0 flex-[999_1_560px] flex-col overflow-hidden rounded-card border border-border bg-card">
          <h2 id="my-tasks" className="px-6 pb-4 pt-6 text-[24px] font-semibold tracking-tight">
            {copy.next.heading}
          </h2>
          {tasks.length ? (
            <ul className="flex-1">
              {tasks.slice(0, NEXT_TASKS).map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  done={doneIds.has(task.id)}
                  today={today}
                  copy={copy.next}
                  projectUrl={task.private ? links.tasks : `${links.project}#${task.projectId}`}
                  onToggle={toggle}
                />
              ))}
            </ul>
          ) : (
            <p className="flex-1 border-t border-border p-6 text-fg-muted">{copy.next.empty}</p>
          )}
          {failed && (
            <p role="alert" className="border-t border-border px-6 py-3 text-sm text-danger">
              {copy.next.error}
            </p>
          )}
          <a href={links.tasks} className={`${ROW} flex min-h-[60px] items-center justify-between border-t border-border px-6 text-sm font-medium text-accent no-underline`}>
            {copy.next.all}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </section>

        <EventCard
          copy={copy.event}
          event={event}
          eventsComplete={eventsComplete}
          openCount={event ? eventTaskCount(open, event.id) : 0}
          url={links.events}
        />
      </div>
    </div>
  )
}
