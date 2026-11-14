/**
 * The page the tasks module opens on. The member's own tasks come first: one field adds a task (TaskCapture), the open
 * ones stand in groups by deadline, overdue first, and the leads of a project also see its tasks nobody has taken yet
 * ("Noch zu verteilen"). Beside them the next 14 days as a list of the days with something on them (events, the Weekly,
 * the member's deadlines and those of open projects), or as the two-week calendar, remembered in this browser; then the
 * projects the member leads or works in. Teamleads see a line when their team has overdue tasks or tasks without a
 * person, which leads to the Team-Check. Phones get a fixed button that jumps to the field.
 * Props: entries (calendarEntries), complete, planOf(entry) → its project or undefined, projects (myProjects),
 * projectCount (all projects of the projects page), deadlines (projectDeadlines), mine (the member's tasks with their
 * private ones), unassigned (unassignedTasks), check (the teamlead's teamCheck with its `team`, or null), today, copy
 * (workspace copy), locale, me, members, membersById, captureId (id of the field, for the buttons that focus it),
 * onView(view), onMine(), onTeamCheck(), onStart(event), onOpen(projectId), onOpenEvent(entry), onOpenTask(task),
 * onPatch(task, fields), onAdd(captured, isPrivate) → Promise, onAddOnDay(kind, day) with kind internal, task or event.
 */
import React, { useEffect, useId, useState } from 'react'
import { Lock, Plus } from 'lucide-react'
import { dueLabel } from '../../../lib/memberSearch'
import { addDays, memberChange, progress, projectDay, sortTasks, weekStart } from '../../../lib/tasks'
import { fill, Menu, MENU_ITEM, PRIMARY_BUTTON, TOOL_BUTTON } from '../memberUi'
import TaskCapture from './TaskCapture'
import { dayPart, DueSetter, MemberPicker, ProgressBar, Segmented, showRest, TaskCheck, teamName } from './taskUi'

// Two whole weeks from this week's Monday, so every row starts on Monday as in the events calendar.
const CALENDAR_DAYS = 14
const AGENDA_DAYS = 14
const AGENDA_SHOWN = 8
const AGENDA_KEY = 'ignite-tasks-agenda'
const CHIPS_SHOWN = 3
const PROJECTS_SHOWN = 4
// How many tasks each group shows before "N weitere anzeigen": what is due soon in full, the rest briefly.
const GROUP_SHOWN = { overdue: 5, week: 5, later: 3, unassigned: 2, none: 2 }
const MY_GROUPS = ['overdue', 'week', 'later', 'unassigned', 'none']
const ADD_KINDS = ['internal', 'task', 'event']
const CARD = 'rounded-card border border-border bg-card'
const HEADING = 'text-[22px] font-semibold tracking-tight'
const LEAD_ON = 'flex items-center justify-between gap-2 border-0 bg-transparent p-0 text-sm font-medium text-accent hover:underline'
const ROW_LINE = 'border-0 border-t border-solid border-border'
const TITLE_BUTTON = 'min-w-0 border-0 bg-transparent p-0 text-left text-sm font-medium leading-snug'
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

function Calendar({ entries, projects, tasks, activeDay, today, copy, locale, toggle, onOpenEvent, onOpen, onOpenTask, onAdd }) {
  const text = copy.overview
  const monday = weekStart(today)
  const days = Array.from({ length: CALENDAR_DAYS }, (_, index) => addDays(monday, index))
  return (
    <section data-tour="days" aria-labelledby="task-calendar" className={`${CARD} px-5 pb-5 pt-5 sm:px-6`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 id="task-calendar" className={HEADING}>
          {text.days}
        </h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
          {toggle}
        </div>
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

function OverviewCard({ title, aside, link, onLink, tour, children }) {
  const id = useId()
  return (
    <section data-tour={tour} aria-labelledby={id} className={`${CARD} flex min-w-0 flex-col overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 pb-4 pt-5 sm:px-6">
        <h2 id={id} className={HEADING}>
          {title}
        </h2>
        {aside && <div className="text-sm tabular-nums text-fg-muted">{aside}</div>}
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
      {link && (
        <button type="button" className={`${LEAD_ON} ${ROW_LINE} min-h-14 w-full rounded-none px-5 sm:px-6`} onClick={onLink}>
          {link}
          <span aria-hidden="true">→</span>
        </button>
      )}
    </section>
  )
}

/** Where a task belongs, under its title: its project, or that it is a task of its own and its team. */
function TaskContext({ task, group, today, copy, locale }) {
  const text = copy.overview
  if (task.private) {
    return (
      <span className="inline-flex items-center gap-1 text-caption text-fg-muted">
        <Lock aria-hidden="true" className="h-3 w-3" />
        {copy.private.badge}
      </span>
    )
  }
  const where = task.projectType === 'task' ? [text.single, task.team && teamName(copy, task.team)] : [fill(text.inProject, { project: task.projectTitle })]
  const extra =
    group === 'unassigned'
      ? [task.due ? fill(text.dueOn, { date: dueLabel(task.due, today, locale) }) : text.noDue]
      : [task.status === 'doing' && copy.taskStatuses.doing]
  return <span className="block truncate text-caption text-fg-muted">{[...where, ...extra].filter(Boolean).join(' · ')}</span>
}

function MyTaskRow({ task, group, today, copy, locale, me, members, membersById, onCheck, onOpenTask, onPatch }) {
  const text = copy.overview
  return (
    <li data-task-item={task.id} className={`${ROW_LINE} flex min-h-14 items-center gap-3 px-5 py-2.5 sm:px-6`}>
      {group !== 'unassigned' && <TaskCheck checked={task.done} onChange={onCheck} label={fill(copy.panel.markDone, { title: task.title })} />}
      <div className="min-w-0 flex-1">
        <button
          type="button"
          data-control="open"
          className={`${TITLE_BUTTON} line-clamp-2 ${task.done ? 'text-fg-muted line-through' : 'text-fg'}`}
          onClick={() => onOpenTask(task)}
        >
          {task.title}
        </button>
        <TaskContext task={task} group={group} today={today} copy={copy} locale={locale} />
      </div>
      {group === 'unassigned' ? (
        <MemberPicker
          members={members}
          membersById={membersById}
          selected={task.assignees}
          team={task.team}
          onChange={(assignees) => onPatch(task, { assignees: memberChange(task.assignees, assignees) })}
          copy={copy.people}
          me={me}
          label={fill(text.assignFor, { title: task.title })}
        />
      ) : group === 'none' && !task.done ? (
        <DueSetter label={text.setDue} saveLabel={text.saveDue} onSet={(due) => onPatch(task, { due })} />
      ) : (
        task.due && (
          <span className={`shrink-0 text-caption tabular-nums ${group === 'overdue' ? 'font-medium text-danger' : 'text-fg-muted'}`}>
            {dueLabel(task.due, today, locale)}
          </span>
        )
      )}
    </li>
  )
}

function MyTasks({ mine, unassigned, today, copy, locale, me, members, membersById, captureId, onAdd, onPatch, onOpenTask, onMine }) {
  const text = copy.overview
  // A task ticked here keeps its place, struck through, until the page changes, so a slip is undone where it happened.
  const [checked, setChecked] = useState(() => new Map())
  const [expanded, setExpanded] = useState([])
  const open = mine.filter((task) => !task.done)
  const groupOf = (task) => checked.get(task.id) ?? task.group
  const listed = mine.filter((task) => !task.done || checked.has(task.id))
  const groups = MY_GROUPS.map((group) => ({
    group,
    tasks: group === 'unassigned' ? unassigned : sortTasks(listed.filter((task) => groupOf(task) === group)),
  })).filter(({ tasks }) => tasks.length)
  const check = (task) => (done) => {
    if (done) setChecked(new Map(checked).set(task.id, task.group))
    onPatch(task, { done })
  }

  return (
    <OverviewCard
      title={text.mine}
      aside={unassigned.length ? fill(text.openAndUnassigned, { count: open.length, unassigned: unassigned.length }) : fill(text.openCount, { count: open.length })}
      link={text.toBoard}
      onLink={onMine}
    >
      <div className="px-5 pb-4 sm:px-6">
        <TaskCapture copy={copy} members={members} me={me} today={today} locale={locale} inputId={captureId} onAdd={onAdd} />
      </div>
      {!groups.length && <p className={`${ROW_LINE} px-5 py-4 text-sm text-fg-muted sm:px-6`}>{text.noneMine}</p>}
      <div data-focus-scope className="flex-1">
        {groups.map(({ group, tasks }) => {
          const all = expanded.includes(group)
          const shown = all ? tasks : tasks.slice(0, GROUP_SHOWN[group])
          const heading = group === 'unassigned' ? text.unassigned.heading : copy.list.groups[group]
          return (
            <section key={group} aria-labelledby={`my-${group}`}>
              <h3
                id={`my-${group}`}
                className={`${ROW_LINE} px-5 pb-1 pt-4 text-xs font-medium uppercase tracking-wider sm:px-6 ${group === 'overdue' ? 'text-danger' : 'text-fg-muted'}`}
              >
                {heading} · <span className="tabular-nums">{tasks.length}</span>
              </h3>
              {group === 'unassigned' && <p className="px-5 pb-2 text-caption text-fg-muted sm:px-6">{text.unassigned.text}</p>}
              <ul role="list">
                {shown.map((task) => (
                  <MyTaskRow
                    key={task.id}
                    task={task}
                    group={group}
                    today={today}
                    copy={copy}
                    locale={locale}
                    me={me}
                    members={members}
                    membersById={membersById}
                    onCheck={check(task)}
                    onOpenTask={onOpenTask}
                    onPatch={onPatch}
                  />
                ))}
              </ul>
              {shown.length < tasks.length && (
                <button
                  type="button"
                  className="mx-5 mb-3 border-0 bg-transparent p-0 text-sm text-fg-muted underline underline-offset-2 hover:text-fg sm:mx-6"
                  onClick={(e) => {
                    const list = e.currentTarget.previousElementSibling
                    const first = shown.length
                    showRest(() => setExpanded([...expanded, group]), () => list.children[first]?.querySelector('[data-control]'))
                  }}
                >
                  {fill(text.more, { count: tasks.length - shown.length })}
                </button>
              )}
            </section>
          )
        })}
      </div>
    </OverviewCard>
  )
}

/** Planning state of an event in a few words: how far its tasks are, or that nobody plans it yet. */
function planningText(project, text) {
  if (!project) return text.noPlanning
  if (project.folded) return text.planningArchived
  const tasks = progress(project.tasks)
  return tasks.total ? fill(text.planningShort, tasks) : text.planningEmpty
}

function AgendaItem({ item, planOf, copy, onStart, onOpen, onOpenEvent, onOpenTask }) {
  const text = copy.overview
  const { kind } = item
  const project = kind === 'event' ? planOf(item.entry) : null
  const title = kind === 'task' ? item.task.title : kind === 'project' ? item.project.title : item.entry.title
  const time = item.entry?.time
  const detail =
    kind === 'event'
      ? [text.event, time, planningText(project, text)]
      : kind === 'series'
        ? [text.series, time]
        : [kind === 'task' ? text.yourDeadline : text.projectDeadline]
  const openIt = () =>
    kind === 'task' ? onOpenTask(item.task) : kind === 'project' ? onOpen(item.project.id) : onOpenEvent(item.entry)
  return (
    <li className="flex flex-col gap-2 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="min-w-0">
        <button type="button" className={`${TITLE_BUTTON} block max-w-full truncate text-fg hover:underline`} onClick={openIt}>
          {title}
        </button>
        <span className="block text-caption text-fg-muted">{detail.filter(Boolean).join(' · ')}</span>
      </div>
      {kind === 'event' && (
        <button
          type="button"
          className={`${TOOL_BUTTON} h-9 shrink-0 self-start px-3 text-xs sm:self-auto`}
          onClick={() => (project ? onOpen(project.id) : onStart(item.entry))}
        >
          {project ? text.openPlanning : copy.calendar.startPlanning}
        </button>
      )}
    </li>
  )
}

function Agenda({ entries, deadlines, tasks, planOf, complete, today, copy, locale, toggle, onStart, onOpen, onOpenEvent, onOpenTask }) {
  const text = copy.overview
  const [all, setAll] = useState(false)
  const last = addDays(today, AGENDA_DAYS - 1)
  // An event of several days that has begun stands on today.
  const items = [
    ...entries
      .filter((entry) => entry.endDay >= today && entry.day <= last)
      .map((entry) => ({ key: `e-${entry.id}`, kind: entry.source === 'series' ? 'series' : 'event', day: entry.day < today ? today : entry.day, order: entry.time || '00:00', entry })),
    ...tasks
      .filter((task) => !task.done && task.due >= today && task.due <= last)
      .map((task) => ({ key: `t-${task.id}`, kind: 'task', day: task.due, order: '99', task })),
    ...deadlines
      .filter((project) => project.due >= today && project.due <= last)
      .map((project) => ({ key: `p-${project.id}`, kind: 'project', day: project.due, order: '99', project })),
  ].sort((a, b) => a.day.localeCompare(b.day) || a.order.localeCompare(b.order))
  const shown = all ? items : items.slice(0, AGENDA_SHOWN)
  const days = [...new Set(shown.map((item) => item.day))]

  return (
    <OverviewCard title={text.agenda} aside={toggle} tour="days">
      {!items.length && (
        <p className={`${ROW_LINE} px-5 py-4 text-sm text-fg-muted sm:px-6`}>{complete ? text.agendaEmpty : copy.calendar.unavailable}</p>
      )}
      {days.length > 0 && (
        <ol role="list" className="pb-2">
          {days.map((day) => (
            <li key={day} className={`${ROW_LINE} flex gap-4 px-5 py-3 sm:px-6`}>
              <p className="flex w-10 shrink-0 flex-col items-center pt-1">
                <span className="sr-only">{dayPart(day, locale, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                <span aria-hidden="true" className="text-2xs font-medium uppercase tracking-wider text-fg-muted">
                  {dayPart(day, locale, { weekday: 'short' }).replace('.', '')}
                </span>
                <span
                  aria-hidden="true"
                  className={`grid h-8 w-8 place-items-center rounded-full text-[17px] font-semibold ${day === today ? 'bg-brand-bright text-white' : ''}`}
                >
                  {dayPart(day, locale, { day: 'numeric' }).replace('.', '')}
                </span>
              </p>
              <ul role="list" className="min-w-0 flex-1">
                {shown
                  .filter((item) => item.day === day)
                  .map((item) => (
                    <AgendaItem
                      key={item.key}
                      item={item}
                      planOf={planOf}
                      copy={copy}
                      onStart={onStart}
                      onOpen={onOpen}
                      onOpenEvent={onOpenEvent}
                      onOpenTask={onOpenTask}
                    />
                  ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
      {shown.length < items.length && (
        <button
          type="button"
          className="mx-5 mb-4 w-fit border-0 bg-transparent p-0 text-sm text-fg-muted underline underline-offset-2 hover:text-fg sm:mx-6"
          onClick={() => setAll(true)}
        >
          {fill(text.moreAgenda, { count: items.length })}
        </button>
      )}
    </OverviewCard>
  )
}

function ProjectRow({ project, me, today, copy, locale, onOpen }) {
  const text = copy.overview
  const done = progress(project.tasks)
  const day = projectDay(project)
  const lead = project.leads.includes(me)
  const toAssign = project.tasks.filter((task) => !task.done && !task.assignees.length).length
  const own = project.tasks.filter((task) => !task.done && task.assignees.includes(me)).length
  const role = lead
    ? [text.youLead, toAssign > 0 && fill(text.toAssign, { count: toAssign })]
    : [fill(own === 0 ? text.yourTasks.none : own === 1 ? text.yourTasks.one : text.yourTasks.many, { count: own })]
  const detail = [project.type === 'event' && copy.types.event, day && dueLabel(day, today, locale), ...role].filter(Boolean)
  return (
    <button
      type="button"
      className={`${ROW_LINE} block w-full rounded-none bg-transparent px-5 py-3.5 text-left text-fg hover:bg-bg-subtle sm:px-6`}
      onClick={() => onOpen(project.id)}
    >
      <span className="block truncate text-[17px] font-medium">{project.title}</span>
      <span className="block text-caption text-fg-muted">{detail.join(' · ')}</span>
      <span className="mt-2 flex items-center gap-2.5">
        {done.total ? (
          <>
            <ProgressBar percent={done.percent} label={copy.board.progress} />
            <span className="shrink-0 text-caption tabular-nums text-fg-muted">{fill(copy.panel.progress, done)}</span>
          </>
        ) : (
          <span className="text-caption text-fg-subtle">{copy.board.noTasks}</span>
        )}
      </span>
    </button>
  )
}

function TeamCheckLine({ check, copy, onOpen }) {
  const text = copy.teamCheck
  const parts = ['unassigned', 'overdue'].filter((kind) => check[kind].length).map((kind) => fill(text.counts[kind], { count: check[kind].length }))
  if (!parts.length) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-card border border-border bg-bg-subtle px-5 py-3.5 sm:px-6">
      <p className="text-sm">{fill(text.banner, { team: copy.teams[check.team], parts: parts.join(', ') })}</p>
      <button type="button" className={LEAD_ON} onClick={onOpen}>
        {text.open}
        <span aria-hidden="true">→</span>
      </button>
    </div>
  )
}

export default function TaskOverview({
  entries,
  complete,
  planOf,
  projects,
  projectCount,
  deadlines,
  mine,
  unassigned,
  check,
  today,
  copy,
  locale,
  me,
  members,
  membersById,
  captureId,
  onView,
  onMine,
  onTeamCheck,
  onStart,
  onOpen,
  onOpenEvent,
  onOpenTask,
  onPatch,
  onAdd,
  onAddOnDay,
}) {
  const text = copy.overview
  const [agenda, setAgenda] = useState('list')
  useEffect(() => {
    try {
      if (localStorage.getItem(AGENDA_KEY) === 'calendar') setAgenda('calendar')
    } catch {
      // Without storage the list shows, which is the default anyway.
    }
  }, [])
  const chooseAgenda = (next) => {
    setAgenda(next)
    try {
      localStorage.setItem(AGENDA_KEY, next)
    } catch {
      // Not remembering the choice is harmless.
    }
  }
  const toggle = <Segmented label={text.agendaLayouts.label} options={{ list: text.agendaLayouts.list, calendar: text.agendaLayouts.calendar }} value={agenda} onChange={chooseAgenda} />
  // The calendar marks the next event's day; an event of several days that has begun counts from today.
  const next = entries.find((entry) => entry.endDay >= today && entry.source !== 'series')
  const activeDay = next && (next.day < today ? today : next.day)
  const focusCapture = () => {
    const field = document.getElementById(captureId)
    field?.focus({ preventScroll: true })
    field?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col gap-6 pb-20 sm:pb-0">
      {check && <TeamCheckLine check={check} copy={copy} onOpen={onTeamCheck} />}
      {agenda === 'calendar' && (
        <Calendar
          entries={entries}
          projects={deadlines}
          tasks={mine.filter((task) => !task.done)}
          activeDay={activeDay}
          today={today}
          copy={copy}
          locale={locale}
          toggle={toggle}
          onOpenEvent={onOpenEvent}
          onOpen={onOpen}
          onOpenTask={onOpenTask}
          onAdd={onAddOnDay}
        />
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <MyTasks
          mine={mine}
          unassigned={unassigned}
          today={today}
          copy={copy}
          locale={locale}
          me={me}
          members={members}
          membersById={membersById}
          captureId={captureId}
          onAdd={onAdd}
          onPatch={onPatch}
          onOpenTask={onOpenTask}
          onMine={onMine}
        />
        <div className="flex min-w-0 flex-col gap-6">
          {agenda === 'list' && (
            <Agenda
              entries={entries}
              deadlines={deadlines}
              tasks={mine}
              planOf={planOf}
              complete={complete}
              today={today}
              copy={copy}
              locale={locale}
              toggle={toggle}
              onStart={onStart}
              onOpen={onOpen}
              onOpenEvent={onOpenEvent}
              onOpenTask={onOpenTask}
            />
          )}
          <OverviewCard title={text.projects} link={fill(text.allProjects, { count: projectCount })} onLink={() => onView('projects')}>
            {!projects.length && <p className={`${ROW_LINE} px-5 py-4 text-sm text-fg-muted sm:px-6`}>{text.noneProjects}</p>}
            {projects.slice(0, PROJECTS_SHOWN).map((project) => (
              <ProjectRow key={project.id} project={project} me={me} today={today} copy={copy} locale={locale} onOpen={onOpen} />
            ))}
          </OverviewCard>
        </div>
      </div>
      {/* Phones reach the field from anywhere on the long page. */}
      <button type="button" className={`${PRIMARY_BUTTON} fixed inset-x-4 bottom-4 z-30 h-12 justify-center shadow-lg sm:hidden`} onClick={focusCapture}>
        <Plus aria-hidden="true" className="h-4 w-4" />
        {text.newTask}
      </button>
    </div>
  )
}
