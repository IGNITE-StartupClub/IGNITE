/**
 * Building blocks shared by the members area islands (MemberAdmin, CrmBoard, AlumniDirectory): button and badge
 * classes, placeholder filling, the search field, toggle chips, initials avatars, form fields and the modal form dialog.
 * Styles: ./forms.css plus Tailwind utilities.
 */
import React from 'react'
import { Search, X } from 'lucide-react'
import { initials } from '../../lib/contacts'

// Without border and text colour, so each use sets its own and no two utilities compete.
export const BUTTON_BASE =
  'inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors'
export const TOOL_BUTTON = `${BUTTON_BASE} border-border-strong text-fg hover:bg-bg-subtle`
export const PRIMARY_BUTTON = `${BUTTON_BASE} border-fg bg-fg text-bg hover:opacity-90`
export const DANGER_BUTTON = `${BUTTON_BASE} border-danger text-danger hover:bg-bg-subtle`
export const BADGE = 'inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium'

/** Replaces {key} placeholders in a copy string. */
export const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => values[key])

export function SearchField({ label, value, onChange }) {
  return (
    <label className="relative min-w-0 flex-1 basis-64">
      <span className="sr-only">{label}</span>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className="h-10 w-full rounded-lg border border-border-strong bg-bg-subtle pl-10 pr-3 text-sm text-fg placeholder:text-fg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        autoComplete="off"
      />
    </label>
  )
}

/** A filter chip that is pressed or not; screen readers hear the state through aria-pressed. */
export function Chip({ pressed, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors ${
        pressed ? 'border-fg bg-fg text-bg' : 'border-border-strong text-fg hover:bg-bg-subtle'
      }`}
    >
      {children}
    </button>
  )
}

/** Decorative: the name always sits right next to it. */
export function Initials({ name, large = false }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full border border-border-strong bg-bg-subtle font-medium uppercase text-fg-muted ${
        large ? 'h-14 w-14 text-lg' : 'h-10 w-10'
      }`}
    >
      {initials(name)}
    </span>
  )
}

/** A labelled form field; `hint` is shown below and gets the id `<id>-hint` for aria-describedby. */
export function Field({ id, label, hint, children }) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="field-hint text-sm">
          {hint}
        </p>
      )}
    </div>
  )
}

/**
 * A modal dialog around a form. `dialogRef` opens it (showModal) from the island; a click on the backdrop, the close
 * button and Escape close it, and `onClose` runs every time.
 */
export function FormDialog({ dialogRef, id, heading, closeLabel, onClose, onSubmit, children }) {
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={id}
      onClose={onClose}
      // A click on the backdrop lands on the dialog element itself.
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      className="w-[min(40rem,calc(100vw-2rem))] rounded-card border border-border bg-bg p-0 text-fg backdrop:bg-black/60"
    >
      <form onSubmit={onSubmit} className="form p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={id} className="text-display-sm">
            {heading}
          </h2>
          <button
            type="button"
            className="rounded-md border-0 p-1 text-fg-muted hover:text-fg"
            onClick={() => dialogRef.current.close()}
            aria-label={closeLabel}
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        {children}
      </form>
    </dialog>
  )
}
