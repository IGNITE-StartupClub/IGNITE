/**
 * The coach mark at the search icon (MemberSearch.jsx), for members who have seen the onboarding but never made a task
 * through the search (showsSearchHint in src/lib/onboarding.ts). It hangs absolutely below the icon instead of in a
 * popover: the search is a persisted island, Astro moves its nodes into the new header on every navigation, and moving
 * an open popover closes it. The horizontal offset keeps the box inside the window and its arrow on the icon. Without a
 * z-index, so the profile menu, which comes later in the header, opens above it.
 * Props: copy (memberArea.search.coach), shortcut (⌘K, or the copy for other systems), anchor (ref of the element around
 * the icon), id (of the text, which the icon names in aria-describedby), onTry, onDismiss.
 */
import React, { useEffect, useState } from 'react'
import { fill, PRIMARY_BUTTON } from './memberUi'

const WIDTH = 340
const GUTTER = 16
// Where the window allows, the arrow sits this far from the right edge, so the box reaches left under the pill.
const ARROW_FROM_RIGHT = 64

export default function SearchHint({ copy, shortcut, anchor, id, onTry, onDismiss }) {
  const [place, setPlace] = useState(null)
  const [keyboard, setKeyboard] = useState(false)

  useEffect(() => {
    // A shortcut means nothing on a phone or tablet without a mouse.
    setKeyboard(window.matchMedia('(any-pointer: fine)').matches)
    const measure = () => {
      const icon = anchor.current.getBoundingClientRect()
      const width = Math.min(WIDTH, window.innerWidth - 2 * GUTTER)
      const center = icon.left + icon.width / 2
      const left = Math.max(GUTTER, Math.min(center + ARROW_FROM_RIGHT - width, window.innerWidth - GUTTER - width))
      setPlace({ left: left - icon.left, width, arrow: center - left })
    }
    measure()
    window.addEventListener('resize', measure)
    document.addEventListener('astro:after-swap', measure)
    return () => {
      window.removeEventListener('resize', measure)
      document.removeEventListener('astro:after-swap', measure)
    }
  }, [])

  if (!place) return null
  const [before, after] = copy.text.split('{example}')
  return (
    <div
      role="note"
      style={{ left: place.left, width: place.width }}
      className="absolute top-[calc(100%+12px)] whitespace-normal rounded-card border border-border-strong bg-card p-4 text-left text-fg shadow-[shadow:var(--shadow-card)]"
    >
      <span
        aria-hidden="true"
        style={{ left: place.arrow }}
        className="absolute -top-[7px] h-3.5 w-3.5 -translate-x-1/2 rotate-45 border-l border-t border-border-strong bg-card"
      />
      <p className="text-2xs font-semibold text-accent">{copy.kicker}</p>
      <div id={id}>
        <p className="mt-1 text-sm font-semibold leading-snug">{copy.title}</p>
        <p className="mt-1.5 text-xs text-fg-muted">
          {before}
          <code className="whitespace-nowrap rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-2xs text-fg">{copy.example}</code>
          {after}
        </p>
        {keyboard && <p className="mt-1.5 text-xs text-fg-muted">{fill(copy.shortcut, { shortcut })}</p>}
      </div>
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onTry} className={PRIMARY_BUTTON}>
          {copy.try}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="h-10 rounded-lg border-0 bg-transparent px-2 py-0 text-sm text-fg-muted hover:text-fg"
        >
          {copy.dismiss}
        </button>
      </div>
    </div>
  )
}
