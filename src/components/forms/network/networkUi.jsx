/**
 * Building blocks of the Netzwerk islands (NetworkDirectory, ProfileView, PersonForm, OrgViews): the avatar, a filter
 * button with a checkbox list in a popover, the tag picker that can add to the shared pool, a search picker for people
 * and the select of a field's visibility. Styles: ../forms.css plus Tailwind utilities.
 */
import React, { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Plus, X } from 'lucide-react'
import { initials } from '../../../lib/contacts'
import { fill } from '../memberUi'

export const CARD = 'rounded-card border border-border bg-bg'
export const SECTION_HEADING = 'text-xs font-semibold uppercase tracking-wider text-fg-muted'
export const SOFT_BADGE = 'inline-flex items-center whitespace-nowrap rounded-full border border-border-strong px-2 py-0.5 text-xs text-fg-muted'
export const STRONG_BADGE = 'inline-flex items-center whitespace-nowrap rounded-full bg-fg px-2 py-0.5 text-xs font-medium text-bg'
export const INPUT = 'input'

/** Photo or initials; decorative, the name always stands next to it. */
export function Avatar({ name, photo, size = 48 }) {
  const style = { width: size, height: size }
  return photo ? (
    <img src={photo} alt="" width={size} height={size} loading="lazy" style={style} className="shrink-0 rounded-full object-cover" />
  ) : (
    <span
      aria-hidden="true"
      style={{ ...style, fontSize: Math.max(13, size / 3) }}
      className="flex shrink-0 items-center justify-center rounded-full border border-border-strong bg-bg-subtle font-medium uppercase text-fg-muted"
    >
      {initials(name)}
    </span>
  )
}

/**
 * A popover anchored below a button, placed by the browser's popover API (Escape and outside clicks close it).
 * `children(close)` renders the content.
 */
export function Popover({ label, ariaLabel, className, panelClassName = 'w-72', children }) {
  const id = useId()
  const button = useRef(null)
  const panel = useRef(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const popover = panel.current
    const place = (event) => {
      if (event.newState !== 'open') return
      const anchor = button.current.getBoundingClientRect()
      const width = Math.min(popover.offsetWidth || 288, window.innerWidth - 16)
      popover.style.left = `${Math.max(8, Math.min(anchor.left, window.innerWidth - width - 8))}px`
      popover.style.top = `${anchor.bottom + 4}px`
    }
    const toggled = (event) => setOpen(event.newState === 'open')
    popover.addEventListener('beforetoggle', place)
    popover.addEventListener('toggle', toggled)
    return () => {
      popover.removeEventListener('beforetoggle', place)
      popover.removeEventListener('toggle', toggled)
    }
  }, [])

  return (
    <>
      <button ref={button} type="button" popoverTarget={id} aria-expanded={open} aria-label={ariaLabel} className={className}>
        {label}
      </button>
      <div
        ref={panel}
        id={id}
        popover="auto"
        className={`fixed inset-auto m-0 max-h-[min(24rem,70vh)] overflow-auto rounded-lg border border-border bg-bg p-1 text-fg shadow-lg ${panelClassName}`}
      >
        {open && children(() => panel.current.hidePopover())}
      </div>
    </>
  )
}

const FILTER_BUTTON =
  'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors hover:bg-bg-subtle'

/**
 * A filter with several options to tick. `options` is [{ value, label, count? }]; with more than eight a search field
 * narrows them. The button shows how many are ticked.
 */
export function FilterMenu({ label, options, selected, onChange, copy }) {
  const [query, setQuery] = useState('')
  const active = selected.length > 0
  const toggle = (value) => onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])
  const needle = query.trim().toLocaleLowerCase('de')
  const shown = needle ? options.filter((option) => option.label.toLocaleLowerCase('de').includes(needle)) : options
  return (
    <Popover
      className={`${FILTER_BUTTON} ${active ? 'border-fg bg-fg text-bg hover:bg-fg' : 'border-border-strong text-fg'}`}
      label={
        <>
          {label}
          {active && <span className="rounded-full bg-bg px-1.5 text-xs font-semibold text-fg">{selected.length}</span>}
          <ChevronDown aria-hidden="true" className="h-4 w-4" />
        </>
      }
    >
      {() => (
        <div role="group" aria-label={label}>
          {options.length > 8 && (
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={copy.search}
              aria-label={copy.search}
              className="mb-1 h-9 w-full rounded-md border border-border-strong bg-bg-subtle px-2.5 text-sm"
            />
          )}
          {!shown.length && <p className="px-3 py-2 text-sm text-fg-muted">{copy.none}</p>}
          {shown.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-bg-subtle">
              <input type="checkbox" checked={selected.includes(option.value)} onChange={() => toggle(option.value)} className="h-4 w-4" />
              <span className="min-w-0 flex-1">{option.label}</span>
              {option.count !== undefined && <span className="text-xs text-fg-muted">{option.count}</span>}
            </label>
          ))}
        </div>
      )}
    </Popover>
  )
}

/** A removable chip, for active filters and chosen tags. */
export function RemovableChip({ label, removeLabel, onRemove }) {
  return (
    <span className="inline-flex h-8 items-center gap-1 rounded-full border border-border-strong bg-bg-subtle pl-3 pr-1 text-sm">
      {label}
      <button type="button" onClick={onRemove} aria-label={removeLabel} className="rounded-full border-0 p-1 text-fg-muted hover:bg-bg hover:text-fg">
        <X aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    </span>
  )
}

/**
 * The tags of one category: chosen ones as removable chips, a popover to add more from the pool, and a way to create
 * a new tag when the search finds none of that name. `onCreate(label)` resolves to the new tag's id or null.
 */
export function TagPicker({ category, categoryLabel, tags, value, onChange, onCreate, copy }) {
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const pool = tags.filter((tag) => tag.category === category)
  const labels = Object.fromEntries(tags.map((tag) => [tag.id, tag.label]))
  const needle = query.trim().toLocaleLowerCase('de')
  const shown = pool.filter((tag) => !value.includes(tag.id) && (!needle || tag.label.toLocaleLowerCase('de').includes(needle)))
  const exact = pool.find((tag) => tag.label.toLocaleLowerCase('de') === needle)

  const create = async (close) => {
    if (exact) {
      if (!value.includes(exact.id)) onChange([...value, exact.id])
      setQuery('')
      return close()
    }
    setBusy(true)
    const id = await onCreate(query.trim())
    setBusy(false)
    if (id) {
      onChange([...value, id])
      setQuery('')
      close()
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((id) => (
          <RemovableChip
            key={id}
            label={labels[id] ?? '…'}
            removeLabel={fill(copy.remove, { label: labels[id] ?? '' })}
            onRemove={() => onChange(value.filter((item) => item !== id))}
          />
        ))}
        <Popover
          className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-border-strong px-3 text-sm text-fg-muted hover:text-fg"
          label={
            <>
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              {fill(copy.add, { category: categoryLabel })}
            </>
          }
        >
          {(close) => (
            <div>
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  if (shown.length === 1 && !exact) {
                    onChange([...value, shown[0].id])
                    setQuery('')
                    close()
                  } else if (query.trim().length >= 2) create(close)
                }}
                placeholder={copy.search}
                aria-label={copy.search}
                className="mb-1 h-9 w-full rounded-md border border-border-strong bg-bg-subtle px-2.5 text-sm"
              />
              <ul className="m-0 list-none p-0">
                {shown.map((tag) => (
                  <li key={tag.id}>
                    <button
                      type="button"
                      className="block w-full rounded-md border-0 px-2.5 py-1.5 text-left text-sm hover:bg-bg-subtle"
                      onClick={() => {
                        onChange([...value, tag.id])
                        setQuery('')
                      }}
                    >
                      {tag.label}
                    </button>
                  </li>
                ))}
              </ul>
              {query.trim().length >= 2 && !exact && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => create(close)}
                  className="mt-1 flex w-full items-center gap-2 rounded-md border-0 px-2.5 py-1.5 text-left text-sm font-medium hover:bg-bg-subtle"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  {fill(copy.create, { label: query.trim() })}
                </button>
              )}
            </div>
          )}
        </Popover>
      </div>
    </div>
  )
}

/**
 * Picks one person (`multiple` false) or several from `people` ([{ id, name, line? }]) by typing a name. The chosen
 * ones show as removable chips.
 */
export function PersonPicker({ id, people, value, onChange, multiple = false, copy, placeholder }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const chosen = multiple ? value : value ? [value] : []
  const byId = Object.fromEntries(people.map((person) => [person.id, person]))
  const needle = query.trim().toLocaleLowerCase('de')
  const matches = needle
    ? people.filter((person) => !chosen.includes(person.id) && person.name.toLocaleLowerCase('de').includes(needle)).slice(0, 8)
    : []
  const pick = (personId) => {
    onChange(multiple ? [...value, personId] : personId)
    setQuery('')
    setOpen(false)
  }
  const remove = (personId) => onChange(multiple ? value.filter((item) => item !== personId) : '')

  return (
    <div className="relative">
      {chosen.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {chosen.map((personId) => (
            <RemovableChip
              key={personId}
              label={byId[personId]?.name ?? '…'}
              removeLabel={fill(copy.remove, { label: byId[personId]?.name ?? '' })}
              onRemove={() => remove(personId)}
            />
          ))}
        </div>
      )}
      {(multiple || !chosen.length) && (
        <input
          id={id}
          type="search"
          autoComplete="off"
          value={query}
          placeholder={placeholder ?? copy.search}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (matches[0]) pick(matches[0].id)
            }
          }}
          className="input"
        />
      )}
      {open && needle && (
        <ul className="absolute left-0 right-0 z-10 m-0 mt-1 max-h-60 list-none overflow-auto rounded-lg border border-border bg-bg p-1 shadow-lg">
          {!matches.length && <li className="px-3 py-2 text-sm text-fg-muted">{copy.none}</li>}
          {matches.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(person.id)}
                className="flex w-full flex-col rounded-md border-0 px-2.5 py-1.5 text-left text-sm hover:bg-bg-subtle"
              >
                <span>{person.name}</span>
                {person.line && <span className="text-xs text-fg-muted">{person.line}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** The visibility of one field; `levels` are the allowed ones, `disabled` when the viewer cannot see the field. */
export function LevelSelect({ value, levels, onChange, label, copy, disabled }) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 shrink-0 rounded-lg border border-border-strong bg-bg-subtle px-2 text-sm text-fg disabled:opacity-60 sm:w-48"
    >
      {levels.map((level) => (
        <option key={level} value={level}>
          {copy.levels[level]}
        </option>
      ))}
    </select>
  )
}

/** Check mark for pressed toggle chips inside forms. */
export const CheckIcon = () => <Check aria-hidden="true" className="h-3.5 w-3.5" />
