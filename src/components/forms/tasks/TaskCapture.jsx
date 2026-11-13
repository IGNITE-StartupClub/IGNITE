/**
 * The one field that adds a task: on the hub, in a board column and above the list. It reads the line like the search's
 * "+" (captureTask): "Flyer drucken bis Mi @Lena #Marketing". What it read stands as chips below before anything is
 * saved, @ and # complete from a list, and what stays unclear is named instead of guessed. Without @ the task is the
 * member's own ("Für dich"); without # it joins the team on screen.
 * Props: copy (workspace copy with capture, problems, private and teams), members (id, name, team), me, today, locale,
 * team (the team on screen, '' for none), stacked (narrow layout of a board column), autoFocus, inputId (for buttons
 * elsewhere that focus the field),
 * onAdd({ title, due, assignees, team }, isPrivate) → Promise, truthy once saved, onCancel() (shows "Abbrechen"; Escape
 * and leaving the empty field call it too).
 */
import React, { Fragment, useId, useState } from 'react'
import { CalendarDays, UserRound, Users } from 'lucide-react'
import { captureTask, completeToken, dueLabel, openToken, suggestions, tokenToComplete } from '../../../lib/memberSearch'
import { TEAM_IDS, TITLE_MAX } from '../../../lib/tasks'
import { fill, PRIMARY_BUTTON, TOOL_BUTTON } from '../memberUi'
import { INPUT, PrivateToggle, shortName } from './taskUi'

const CHIP = 'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs'
const SET = 'border-border-strong text-fg'
const UNSET = 'border-border text-fg-muted'

export default function TaskCapture({ copy, members, me, today, locale, team = '', stacked = false, autoFocus = false, inputId, onAdd, onCancel }) {
  const id = useId()
  const fieldId = inputId ?? `${id}-input`
  const text = copy.capture
  const [draft, setDraft] = useState('')
  const [isPrivate, setPrivate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(false)

  const teams = TEAM_IDS.map((teamId) => ({ id: teamId, name: copy.teams[teamId] }))
  const read = draft.trim() ? captureTask(draft, { members, teams, me, today, team }) : null
  // A private task has no people, so naming someone would drop them without a word.
  const others = read && isPrivate ? read.assignees.filter((person) => person.id !== me) : []
  const problems = read
    ? [...read.problems, ...(others.length ? [{ kind: 'privatePeople', token: others.map(({ name }) => `@${name}`).join(', ') }] : [])]
    : []
  const token = read ? tokenToComplete(draft, read.problems, members, teams) : null
  const completions = suggestions(token, members, teams)
  const typing = openToken(draft)
  // The word being typed is no problem yet while the list offers to complete it.
  const shown = problems.filter(({ token: word }) => !(completions.length && word === typing?.word))
  const selected = Math.min(active, completions.length - 1)
  const mayAdd = !!read?.title && !problems.length && !busy

  const pick = (option) => {
    setDraft(completeToken(draft, token, option.handle))
    setActive(0)
  }
  const submit = async (e) => {
    e.preventDefault()
    if (!mayAdd) return
    setBusy(true)
    const saved = await onAdd({ title: read.title, due: read.due, assignees: read.assignees, team: read.team }, isPrivate)
    setBusy(false)
    if (!saved) return
    setDraft('')
    setActive(0)
  }
  const onKeyDown = (e) => {
    if (completions.length && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      setActive((selected + (e.key === 'ArrowDown' ? 1 : -1) + completions.length) % completions.length)
    } else if (completions.length && e.key === 'Enter') {
      e.preventDefault()
      pick(completions[selected])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (onCancel) onCancel()
      else setDraft('')
    }
  }
  const forWhom = isPrivate
    ? text.private
    : read?.assignees.length === 1 && read.assignees[0].id === me
      ? text.forMe
      : fill(text.for, { names: read?.assignees.map(({ name }) => shortName(name)).join(', ') ?? '' })

  const buttons = (
    <div className={`flex shrink-0 items-center gap-2 ${stacked ? 'justify-end' : ''}`}>
      {onCancel && (
        <button type="button" className={`${TOOL_BUTTON} h-10`} onClick={onCancel}>
          {text.cancel}
        </button>
      )}
      <button type="submit" className={`${PRIMARY_BUTTON} h-10`} disabled={!mayAdd}>
        {busy ? text.adding : text.add}
      </button>
    </div>
  )

  return (
    <form
      onSubmit={submit}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return
        setFocused(false)
        if (onCancel && !draft.trim()) onCancel()
      }}
      className="flex flex-col gap-2"
    >
      <div className={`flex gap-2 ${stacked ? 'flex-col' : 'flex-wrap items-center'}`}>
        <div className="relative min-w-0 flex-1 basis-56">
          <label htmlFor={fieldId} className="sr-only">
            {text.label}
          </label>
          <input
            id={fieldId}
            className={INPUT}
            value={draft}
            maxLength={TITLE_MAX * 2}
            placeholder={text.placeholder}
            autoFocus={autoFocus}
            autoComplete="off"
            enterKeyHint="done"
            role="combobox"
            aria-expanded={completions.length > 0}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={completions.length ? `${id}-option-${selected}` : undefined}
            aria-describedby={`${id}-preview`}
            onChange={(e) => {
              setDraft(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
          />
          <ul
            id={`${id}-list`}
            role="listbox"
            aria-label={text.complete}
            hidden={!completions.length}
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-bg py-1 shadow-lg"
          >
            {completions.map((option, index) => (
              <li
                key={option.id}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={index === selected}
                // Down instead of click, so the field keeps the focus and the list does not close first.
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(option)
                }}
                onMouseEnter={() => setActive(index)}
                className={`cursor-pointer px-3 py-2 text-sm ${index === selected ? 'bg-bg-subtle text-fg' : 'text-fg-muted'}`}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
        <div className={`flex items-center gap-2 ${stacked ? 'justify-between' : ''}`}>
          <PrivateToggle pressed={isPrivate} onChange={setPrivate} label={copy.private.toggle} />
          {stacked && buttons}
        </div>
        {!stacked && buttons}
      </div>

      <div id={`${id}-preview`} aria-live="polite" className="flex flex-col gap-1.5">
        {read ? (
          <ul aria-label={text.preview} className="flex flex-wrap gap-1.5">
            <li className={`${CHIP} ${read.due ? SET : UNSET}`}>
              <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              {read.due ? fill(text.due, { date: dueLabel(read.due, today, locale) }) : text.dueNone}
            </li>
            <li className={`${CHIP} ${SET}`}>
              <UserRound aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{forWhom}</span>
            </li>
            <li className={`${CHIP} ${read.team ? SET : UNSET}`}>
              <Users aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              {read.team ? fill(text.team, { team: copy.teams[read.team] }) : text.teamNone}
            </li>
          </ul>
        ) : (
          focused && (
            <p className="text-caption text-fg-muted">
              {text.hint.map(({ token: word, text: rest }) => (
                <Fragment key={word}>
                  <span className="font-medium text-fg">{word}</span>
                  {rest}
                </Fragment>
              ))}
            </p>
          )
        )}
        {shown.map(({ kind, token: word }) => (
          <p key={`${kind}-${word}`} className="text-caption text-danger">
            {fill(copy.problems[kind], { token: word })}
          </p>
        ))}
      </div>
    </form>
  )
}
