/**
 * Speech bubbles on the first visit of the tasks overview (showsTasksTour in src/lib/onboarding.ts): the capture field,
 * the tabs and the next 14 days, one after the other. Showing the first stores the mark `tasksTour`, so it comes once,
 * like the onboarding dialog. Fixed to the window instead of a popover, so it follows its element while the page
 * scrolls; a ring marks that element, the page stays usable.
 * Props: copy (workspace.tour), captureId (id of the capture field), onDone.
 */
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { saveMark } from '../memberHelp'
import { fill, PRIMARY_BUTTON } from '../memberUi'

const STEPS = [
  { id: 'capture', find: (captureId) => document.getElementById(captureId)?.closest('form') },
  { id: 'tabs', find: () => document.querySelector('[data-tour="tabs"] ul') },
  // The next 14 days as a list or as a calendar, whichever the member chose.
  { id: 'calendar', find: () => document.querySelector('[data-tour="days"]') },
]
const WIDTH = 320
const GUTTER = 16
const GAP = 12
const RING = 6

// The floating header pill covers the top of the window, so nothing of the tour may sit under it.
const headerBottom = () => document.querySelector('header')?.getBoundingClientRect().bottom ?? 0

export default function TasksTour({ copy, captureId, onDone }) {
  const uid = useId()
  const bubble = useRef(null)
  const primary = useRef(null)
  const [step, setStep] = useState(0)
  const [target, setTarget] = useState(null)
  const [place, setPlace] = useState(null)
  const last = step === STEPS.length - 1
  const { id } = STEPS[step]

  useEffect(() => {
    // Seen once is enough: a failed save only means it shows once more.
    saveMark('tasksTour').catch(console.error)
  }, [])

  useEffect(() => {
    const found = STEPS[step].find(captureId)
    // An element the page does not show leaves its bubble out.
    if (!found) {
      if (last) onDone()
      else setStep(step + 1)
      return
    }
    // Element and bubble below it in the middle of the free window; an element too tall for that goes to the top, with
    // room above for the bubble.
    const box = found.getBoundingClientRect()
    const top = headerBottom()
    const room = window.innerHeight - top
    const bubbleHeight = bubble.current?.offsetHeight ?? 160
    const pair = box.height + 2 * RING + GAP + bubbleHeight
    const offset = pair <= room ? (room - pair) / 2 + RING : bubbleHeight + GAP + 2 * RING
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollBy({ top: box.top - top - offset, behavior: still ? 'auto' : 'smooth' })
    setTarget(found)
    primary.current?.focus({ preventScroll: true })
  }, [step])

  useLayoutEffect(() => {
    if (!target) return
    const measure = () => {
      const box = target.getBoundingClientRect()
      const width = Math.min(WIDTH, window.innerWidth - 2 * GUTTER)
      const height = bubble.current?.offsetHeight ?? 160
      const ceiling = headerBottom() + GAP
      const below =
        box.bottom + RING + GAP + height <= window.innerHeight - GUTTER || box.top - RING - GAP - height < ceiling
      const left = Math.max(GUTTER, Math.min(box.left, window.innerWidth - GUTTER - width))
      // The arrow points at the start of a wide element and at the middle of a narrow one.
      const point = box.left + Math.min(box.width / 2, 48)
      setPlace({
        ring: {
          top: box.top - RING,
          left: box.left - RING,
          width: box.width + 2 * RING,
          height: box.height + 2 * RING,
        },
        top: Math.max(ceiling, below ? box.bottom + RING + GAP : box.top - RING - GAP - height),
        left,
        width,
        below,
        arrow: Math.max(20, Math.min(point - left, width - 20)),
      })
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [target])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onDone()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  return (
    <>
      {place && (
        <div
          aria-hidden="true"
          style={place.ring}
          className="pointer-events-none fixed z-40 rounded-card ring-2 ring-accent transition-all duration-200 motion-reduce:transition-none"
        />
      )}
      <div
        ref={bubble}
        role="dialog"
        aria-label={copy.label}
        aria-describedby={`${uid}-text`}
        style={place ? { top: place.top, left: place.left, width: place.width } : { visibility: 'hidden' }}
        className="fixed z-40 rounded-card border border-border-strong bg-card p-4 text-fg shadow-[shadow:var(--shadow-card)]"
      >
        {place && (
          <span
            aria-hidden="true"
            style={{ left: place.arrow }}
            className={`absolute h-3.5 w-3.5 -translate-x-1/2 rotate-45 bg-card ${
              place.below ? '-top-[7px] border-l border-t' : '-bottom-[7px] border-b border-r'
            } border-border-strong`}
          />
        )}
        <p className="text-2xs font-semibold text-accent">
          {fill(copy.progress, { step: step + 1, total: STEPS.length })}
        </p>
        <p className="mt-1 text-sm font-semibold leading-snug">{copy.steps[id].title}</p>
        <p id={`${uid}-text`} className="mt-1 text-xs text-fg-muted">
          {copy.steps[id].text}
        </p>
        <div className="mt-3.5 flex items-center gap-2">
          {!last && (
            <button
              type="button"
              onClick={onDone}
              className="h-10 rounded-lg border-0 bg-transparent px-2 py-0 text-sm text-fg-muted hover:text-fg"
            >
              {copy.skip}
            </button>
          )}
          <span className="flex-1" />
          <button
            ref={primary}
            type="button"
            onClick={() => (last ? onDone() : setStep(step + 1))}
            className={PRIMARY_BUTTON}
          >
            {last ? copy.finish : copy.next}
          </button>
        </div>
      </div>
    </>
  )
}
