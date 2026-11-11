/**
 * The page the tasks module opens on: this week and the next from Monday as a calendar with the events, the deadlines
 * of the open projects and the member's own deadlines, then one card each for their tasks, the events and the projects,
 * each leading on to its page. A click in the calendar opens the event, the project or the task, a click on a day from
 * today on offers to add a project, a task or an event; the events card shows what comes next.
 * The field in the tasks card reads the same short form as the search ("Flyer drucken bis Mi @Lena #Marketing"); without
 * a person the task is the member's own.
 * Props: entries (calendarEntries), complete, planOf(entry) → its project or undefined, projects (open projects the
 * member leads, soonest first), deadlines (projectDeadlines), mine (the member's tasks with their private ones), today,
 * copy (workspace copy), locale, membersById,
 * onView(view), onStart(event), onOpen(projectId), onOpenEvent(entry), onOpenTask(task), onPatch(task, fields),
 * onCapture(text, isPrivate) → captureTask, onQuickAdd(captured, isPrivate), onAddOnDay(kind, day) with kind internal,
 * task or event.
 */
import React, { useId, useState } from 'react'
import { Lock, Plus } from 'lucide-react'
import { addDays, isEvent, progress, projectDay, sortTasks, TITLE_MAX, weekStart } from '../../../lib/tasks'
import { fill, Menu, MENU_ITEM, TOOL_BUTTON } from '../memberUi'
import { dayPart, INPUT, LeadLine, PrivateToggle, ProgressBar, shortDay, showRest, TaskCheck } from './taskUi'

// Two whole weeks from this week's Monday, so every row starts on Monday as in the events calendar.
const CALENDAR_DAYS = 14
const CHIPS_SHOWN = 3
const PROJECTS_SHOWN = 3
const TASKS_SHOWN = 5
const ADD_KINDS = ['internal', 'task', 'event']
const CARD = 'rounded-card border border-border bg-card'
const HEADING = 'text-[22px] font-semibold tracking-tight'
const LEAD_ON = 'flex items-center justify-between gap-2 border-0 bg-transparent p-0 text-sm font-medium text-accent hover:underline'
const ROW_LINE = 'border-0 border-t border-solid border-border'
const CHIP = 'relative block w-full truncate rounded-md px-1.5 py-0.5 text-left text-xs'
const CHIP_TONE = {
  event: 'border-0 bg-brand-bright text-white',
  project: 'border border-solid border-border-strong bg-transparent text-fg',
  task: 'border-0 bg-bg-subtle text-fg',
}

function CalendarDay({ day, today, active, entries, projects, tasks, copy, locale, onOpenEvent, onOpen, onOpenTask, onAdd }) {
  const [all, setAll] = useState(false)
  const chips = [
    ...entries.map((entry) => ({ id: entry.id, title: entry.title, tone: CHIP_TONE.event, onClick: () => onOpenEvent(entry) })),
    ...projects.map((project) => ({ id: project.id, title: project.title, tone: CHIP_TONE.project, onClick: () => onOpen(project.id) })),
    ...tasks.map((task) => ({ id: task.id, title: task.title, tone: CHIP_TONE.task, onClick: () => onOpenTask(task) })),
  ]
  const shown = all || chips.length <= CHIPS_SHOWN ? chips.length : CHIPS_SHOWN - 1
  const label = dayPart(day, locale, { weekday: 'long', day: 'numeric', month: 'long' })
  const showAll = (e) => {
    const cell = e.currentTarget.parentElement
    showRest(() => setAll(true), () => cell.querySelectorAll('[data-chip]')[shown])
  }
  const past = day < today
  return (
    <li
      className={`group relative flex min-h-32 min-w-0 flex-col gap-1 rounded-lg border p-2 transition-colors ${
        active ? 'border-accent' : 'border-border'
      } ${past ? 'bg-bg-subtle opacity-60' : 'hover:border-border-strong'}`}
    >
      {/* The day is a layer behind its entries, because a button cannot hold the buttons of its events. Nothing is
          added to a day that is over. */}
      {!past && (
        <Menu
          ariaLabel={fill(copy.calendar.addOn, { date: label })}
          className="absolute inset-0 flex items-end justify-end rounded-lg border-0 bg-transparent p-2 text-fg-muted"
          label={<Plus aria-hidden="true" className="h-4 w-4 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100" />}
        >
          {(close) =>
            ADD_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                className={`${MENU_ITEM} whitespace-normal`}
                onClick={() => {
                  close()
                  onAdd(kind, day)
                }}
              >
                <span className="block font-medium">{copy.calendar.addKinds[kind].label}</span>
                <span className="block text-xs text-fg-muted">{copy.calendar.addKinds[kind].text}</span>
              </button>
            ))
          }
        </Menu>
      )}
      {/* A paragraph takes no aria-label, so screen readers get the long date as text instead of the short parts. */}
      <p className="pointer-events-none relative mb-0.5 flex items-center justify-between gap-1">
        <span className="sr-only">{label}</span>
        <span aria-hidden="true" className="text-caption text-fg-muted">
          {dayPart(day, locale, { weekday: 'short' }).replace('.', '')}
        </span>
        <span
          aria-hidden="true"
          className={`grid h-7 w-7 place-items-center rounded-full text-sm ${day === today ? 'bg-brand-bright font-semibold text-white' : 'font-medium'}`}
        >
          {dayPart(day, locale, { day: 'numeric' }).replace('.', '')}
        </span>
      </p>
      {chips.slice(0, shown).map((chip) => (
        <button key={chip.id} type="button" data-chip title={chip.title} className={`${CHIP} ${chip.tone}`} onClick={chip.onClick}>
          {chip.title}
        </button>
      ))}
      {shown < chips.length && (
        <button
          type="button"
          aria-label={fill(copy.overview.showDay, { date: label })}
          className="relative w-fit border-0 bg-transparent px-1.5 py-0 text-xs text-fg-muted hover:text-fg hover:underline"
          onClick={showAll}
        >
          {fill(copy.overview.moreOnDay, { count: chips.length - shown })}
        </button>
      )}
    </li>
  )
}

function Calendar({ entries, projects, tasks, activeDay, today, copy, locale, onOpenEvent, onOpen, onOpenTask, onAdd }) {
  const text = copy.overview
  const monday = weekStart(today)
  const days = Array.from({ length: CALENDAR_DAYS }, (_, index) => addDays(monday, index))
  return (
    <section aria-labelledby="task-calendar" className={`${CARD} px-5 pb-5 pt-5 sm:px-6`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 id="task-calendar" className={HEADING}>
          {text.days}
        </h2>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-fg-muted">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-brand-bright" />
            {text.legendEvent}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm border border-solid border-border-strong" />
            {text.legendProject}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-fg-subtle" />
            {text.legendDeadline}
          </span>
        </p>
      </div>
      {/* Two weeks of seven days; phones scroll sideways, because a seventh of the screen holds no title. */}
      <div className="overflow-x-auto">
        <ul role="list" className="grid grid-cols-[repeat(7,minmax(7rem,1fr))] gap-1.5">
          {days.map((day) => (
            <CalendarDay
              key={day}
              day={day}
              today={today}
              active={day === activeDay}
              entries={entries.filter((entry) => entry.day <= day && day <= entry.endDay)}
              projects={projects.filter((project) => project.due === day)}
              tasks={tasks.filter((task) => task.due === day)}
              copy={copy}
              locale={locale}
              onOpenEvent={onOpenEvent}
              onOpen={onOpen}
              onOpenTask={onOpenTask}
              onAdd={onAdd}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}

function OverviewCard({ title, aside, link, onLink, children }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className={`${CARD} flex min-w-0 flex-col overflow-hidden`}>
      <div className="flex items-baseline justify-between gap-3 px-5 pb-4 pt-5 sm:px-6">
        <h2 id={id} className={HEADING}>
          {title}
        </h2>
        {aside && <span className="shrink-0 text-sm tabular-nums text-fg-muted">{aside}</span>}
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
      <button type="button" className={`${LEAD_ON} ${ROW_LINE} min-h-14 w-full rounded-none px-5 sm:px-6`} onClick={onLink}>
        {link}
        <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}

function QuickAdd({ copy, onCapture, onAdd }) {
  const text = copy.overview
  const [draft, setDraft] = useState('')
  const [isPrivate, setPrivate] = useState(false)
  const capture = draft.trim() ? onCapture(draft, isPrivate) : null
  const add = async (e) => {
    e.preventDefault()
    if (!capture?.title || capture.problems.length) return
    setDraft('')
    if (!(await onAdd(capture, isPrivate))) setDraft(draft)
  }
  return (
    <form onSubmit={add} className="px-5 pb-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <label className="min-w-0 flex-1 basis-56">
          <span className="sr-only">{text.quickAddLabel}</span>
          <input
            className={INPUT}
            value={draft}
            maxLength={TITLE_MAX * 2}
            placeholder={text.quickAdd}
            enterKeyHint="done"
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <PrivateToggle pressed={isPrivate} onChange={setPrivate} label={copy.private.toggle} />
      </div>
      {/* One polite region for all problems: an alert per problem was announced again with every letter typed. */}
      <div aria-live="polite">
        {capture?.problems.map(({ kind, token }) => (
          <p key={`${kind}${token}`} className="mt-1.5 text-caption text-danger">
            {fill(copy.problems[kind], { token })}
          </p>
        ))}
      </div>
    </form>
  )
}

function EventSummary({ entry, project, copy, locale, membersById, onStart, onOpen }) {
  const text = copy.overview
  const tasks = project && progress(project.tasks)
  const planning = !project ? text.noPlanning : project.folded ? text.planningArchived : tasks.total ? fill(text.planning, tasks) : text.planningEmpty
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div aria-hidden="true" className="surface-brand flex h-[4.5rem] w-16 shrink-0 flex-col items-center justify-center rounded-card">
          <span className="text-caption font-medium">{dayPart(entry.day, locale, { month: 'short' }).replace('.', '')}</span>
          <span className="text-[1.5rem] font-semibold leading-tight">{dayPart(entry.day, locale, { day: 'numeric' }).replace('.', '')}</span>
        </div>
        <div className="min-w-0">
          <h3 className="text-[18px] font-semibold leading-tight">{entry.title}</h3>
          <p className="mt-1 text-sm text-fg-muted">
            {dayPart(entry.day, locale, { weekday: 'long', day: 'numeric', month: 'long' })}
            {entry.time && ` · ${fill(text.time, { time: entry.time })}`}
          </p>
        </div>
      </div>
      <div>
        <p className="text-sm text-fg-muted">{planning}</p>
        {project && <LeadLine project={project} membersById={membersById} copy={copy} className="mt-0.5" />}
      </div>
      <button type="button" className={`${TOOL_BUTTON} min-h-11 w-full justify-center`} onClick={() => (project ? onOpen(project.id) : onStart(entry))}>
        {project ? text.openPlanning : copy.calendar.startPlanning}
      </button>
    </div>
  )
}

function ProjectRow({ project, copy, locale, membersById, onOpen }) {
  const done = progress(project.tasks)
  const day = projectDay(project)
  return (
    <button type="button" className={`${ROW_LINE} block w-full rounded-none bg-transparent px-5 py-3.5 text-left text-fg hover:bg-bg-subtle sm:px-6`} onClick={() => onOpen(project.id)}>
      <span className="block truncate text-[17px] font-medium">{project.title}</span>
      {day && <span className="block text-caption text-fg-muted">{fill(copy.overview.until, { date: shortDay(day, locale) })}</span>}
      <LeadLine project={project} membersById={membersById} copy={copy} className="mt-0.5" />
      <span className="mt-2 flex items-center gap-2.5">
        {done.total ? (
          <>
            <ProgressBar percent={done.percent} label={copy.board.progress} />
            <span className="shrink-0 text-caption tabular-nums text-fg-muted">
              {done.done}/{done.total}
            </span>
          </>
        ) : (
          <span className="text-caption text-fg-subtle">{copy.board.noTasks}</span>
        )}
      </span>
    </button>
  )
}

export default function TaskOverview({ entries, complete, planOf, projects, deadlines, mine, today, copy, locale, membersById, onView, onStart, onOpen, onOpenEvent, onOpenTask, onPatch, onCapture, onQuickAdd, onAddOnDay }) {
  const text = copy.overview
  // A task checked off here stays until the page changes, so a slip can be undone and the list does not jump.
  const [checked, setChecked] = useState([])

  const upcoming = entries.filter((entry) => entry.endDay >= today)
  // The Weekly stays in the calendar, but the events card and its marked day skip it.
  const events = upcoming.filter(isEvent)
  // An event of several days that has begun counts from today, so the card and the marked day agree.
  const activeDay = events[0]?.day < today ? today : events[0]?.day
  const listed = events.filter((entry) => entry.day <= activeDay && activeDay <= entry.endDay)
  const open = mine.filter((task) => !task.done)
  const shown = sortTasks(mine.filter((task) => !task.done || checked.includes(task.id))).slice(0, TASKS_SHOWN)

  return (
    <div className="flex flex-col gap-6">
      <Calendar
        entries={entries}
        projects={deadlines}
        tasks={open}
        activeDay={activeDay}
        today={today}
        copy={copy}
        locale={locale}
        onOpenEvent={onOpenEvent}
        onOpen={onOpen}
        onOpenTask={onOpenTask}
        onAdd={onAddOnDay}
      />

      <OverviewCard title={text.mine} aside={fill(text.openCount, { count: open.length })} link={text.toBoard} onLink={() => onView('tasks')}>
        <QuickAdd copy={copy} onCapture={onCapture} onAdd={onQuickAdd} />
        {!shown.length && <p className={`${ROW_LINE} px-5 py-4 text-sm text-fg-muted sm:px-6`}>{text.noneMine}</p>}
        <ul role="list" className="flex-1">
          {shown.map((task) => (
            <li key={task.id} className={`${ROW_LINE} flex min-h-14 items-center gap-3 px-5 py-2 sm:px-6`}>
              <TaskCheck
                checked={task.done}
                onChange={(done) => {
                  setChecked([...checked, task.id])
                  onPatch(task, { done })
                }}
                label={fill(copy.panel.markDone, { title: task.title })}
              />
              <button
                type="button"
                className={`line-clamp-2 min-w-0 flex-1 border-0 bg-transparent p-0 text-left text-sm font-medium leading-snug ${task.done ? 'text-fg-muted line-through' : 'text-fg'}`}
                onClick={() => onOpenTask(task)}
              >
                {task.title}
              </button>
              {task.private && <Lock role="img" aria-label={copy.private.badge} className="h-4 w-4 shrink-0 text-fg-muted" />}
              {task.due && (
                <span className={`shrink-0 text-caption tabular-nums ${task.group === 'overdue' ? 'font-medium text-danger' : 'text-fg-muted'}`}>
                  {shortDay(task.due, locale)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </OverviewCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <OverviewCard title={copy.views.events} link={copy.calendar.allEvents} onLink={() => onView('events')}>
          <div className="flex flex-col gap-6 px-5 pb-5 sm:px-6">
            {listed.map((entry) => (
              <EventSummary
                key={entry.id}
                entry={entry}
                project={planOf(entry)}
                copy={copy}
                locale={locale}
                membersById={membersById}
                onStart={onStart}
                onOpen={onOpen}
              />
            ))}
            {!listed.length && <p className="text-sm text-fg-muted">{complete ? copy.calendar.noUpcoming : copy.calendar.unavailable}</p>}
          </div>
        </OverviewCard>

        <OverviewCard title={copy.views.projects} link={text.allProjects} onLink={() => onView('projects')}>
          {!projects.length && <p className={`${ROW_LINE} px-5 py-4 text-sm text-fg-muted sm:px-6`}>{text.noneLed}</p>}
          {projects.slice(0, PROJECTS_SHOWN).map((project) => (
            <ProjectRow key={project.id} project={project} copy={copy} locale={locale} membersById={membersById} onOpen={onOpen} />
          ))}
        </OverviewCard>
      </div>
    </div>
  )
}
