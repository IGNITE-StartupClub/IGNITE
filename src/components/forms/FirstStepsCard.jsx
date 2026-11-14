/**
 * The card "Erste Schritte" on the members start page (FirstSteps.astro): calendar, a task through the search and
 * Claude or ChatGPT, each checked from real data (firstSteps in src/lib/onboarding.ts). An open calendar or assistant
 * step opens the onboarding dialog at that step, the search step opens the search with "+ ". "Ausblenden" stores the
 * mark `checklist` on the account. Changes from the dialog and the search arrive as ONBOARDING_CHANGE (memberHelp.js),
 * so the card follows without a reload; with every step done it stays until the next page.
 * Props: copy (memberArea.firstSteps), state (OnboardingState of the session), connectionsUrl.
 */
import React, { useEffect, useId, useState } from 'react'
import { Check } from 'lucide-react'
import { firstSteps, openSteps, withChange } from '../../lib/onboarding'
import { emit, FEEDBACK_EVENT, ONBOARDING_CHANGE, ONBOARDING_EVENT, saveMark, SEARCH_EVENT } from './memberHelp'
import { fill, TOOL_BUTTON } from './memberUi'

const ACCENT_TINT = 'bg-[color-mix(in_srgb,var(--color-accent-text)_10%,transparent)]'
const SUCCESS_TINT = 'bg-[color-mix(in_srgb,var(--color-success)_16%,transparent)]'

function Step({ step, copy, connectionsUrl }) {
  const text = copy.items[step.id][step.done ? 'done' : 'open']
  const action = `${TOOL_BUTTON} mt-auto self-start no-underline`
  return (
    <li
      className={`flex flex-col gap-4 rounded-card border p-5 ${
        step.done ? 'border-border bg-bg' : `border-[color-mix(in_srgb,var(--color-accent-text)_30%,var(--color-border))] ${ACCENT_TINT}`
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full border ${
            step.done ? `border-transparent text-success ${SUCCESS_TINT}` : 'border-border-strong'
          }`}
        >
          {step.done && <Check className="h-4 w-4" strokeWidth={3} />}
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug">
            <span className="sr-only">{step.done ? copy.done : copy.open} </span>
            {text.title}
          </h3>
          <p className="mt-1 text-caption text-fg-muted">{text.text}</p>
        </div>
      </div>
      {step.id === 'search' ? (
        <button type="button" onClick={() => emit(SEARCH_EVENT, { text: '+ ' })} className={action}>
          {text.action}
        </button>
      ) : step.done ? (
        <a href={connectionsUrl} className={action}>
          {text.action}
        </a>
      ) : (
        <button type="button" onClick={() => emit(ONBOARDING_EVENT, { step: step.id })} className={action}>
          {text.action}
        </button>
      )}
    </li>
  )
}

export default function FirstStepsCard({ copy, state: sessionState, connectionsUrl }) {
  const id = useId()
  const [state, setState] = useState(sessionState)
  const [hidden, setHidden] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const onChange = (e) => setState((current) => withChange(current, e.detail))
    window.addEventListener(ONBOARDING_CHANGE, onChange)
    return () => window.removeEventListener(ONBOARDING_CHANGE, onChange)
  }, [])

  // Hidden at once; it comes back with the message when the server refuses.
  const hide = async () => {
    setHidden(true)
    setFailed(false)
    try {
      await saveMark('checklist')
    } catch (err) {
      console.error(err)
      setHidden(false)
      setFailed(true)
    }
  }

  if (hidden) return null
  const steps = firstSteps(state)
  const done = steps.length - openSteps(steps)

  return (
    <section aria-labelledby={`${id}-title`} className="mt-7 rounded-card border border-border bg-card p-6 text-sm">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <h2 id={`${id}-title`} className="text-[24px] font-semibold tracking-tight">
          {copy.title}
        </h2>
        <div className="flex min-w-[12rem] flex-1 items-center gap-3">
          <div aria-hidden="true" className="h-1.5 max-w-[12rem] flex-1 overflow-hidden rounded-full bg-bg-subtle">
            <div className="h-full rounded-full bg-success" style={{ width: `${(done / steps.length) * 100}%` }} />
          </div>
          <p className="text-caption text-fg-muted">{fill(copy.progress, { done, total: steps.length })}</p>
        </div>
        <button
          type="button"
          onClick={hide}
          className="h-10 rounded-lg border-0 bg-transparent px-2 py-0 text-caption text-fg-muted hover:text-fg"
        >
          {copy.hide}
        </button>
      </div>
      {failed && (
        <p role="alert" className="mt-2 text-caption text-danger">
          {copy.hideFailed}
        </p>
      )}
      <ul className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-3">
        {steps.map((step) => (
          <Step key={step.id} step={step} copy={copy} connectionsUrl={connectionsUrl} />
        ))}
      </ul>
      <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-fg-muted">
        {copy.feedback.text}
        <button
          type="button"
          onClick={() => emit(FEEDBACK_EVENT)}
          className="border-0 bg-transparent p-0 text-caption font-semibold text-accent hover:underline"
        >
          {copy.feedback.action}
        </button>
      </p>
    </section>
  )
}
