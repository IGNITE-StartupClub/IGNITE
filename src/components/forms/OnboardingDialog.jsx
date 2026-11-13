/**
 * The onboarding dialog "Erste Schritte" (HelpDialogs.jsx mounts it per opening): the task capture of the search, the
 * calendar subscription, Claude or ChatGPT and the website feedback, each skippable. Calendar and assistant only appear
 * for members who may connect (introSteps in src/lib/onboarding.ts). The calendar link is made here through
 * /api/members/connections and, as on the connections page, exists only in this dialog's state. While the assistant step
 * is open and no app is connected, coming back to the tab asks /api/members/onboarding again, because the app connects
 * in another tab. Opening it stores the mark `intro`, so it opens by itself only once.
 * Props: copy (memberArea.onboarding), panel (memberArea.connections.panel), appNames (memberArea.connections.apps),
 * state (OnboardingState, kept current by HelpDialogs), start (IntroStep), links ({ mcp, connections }), locale, onClose.
 */
import React, { Fragment, useEffect, useId, useRef, useState } from 'react'
import { Check, MessageCircle, Minus, Plus, Search, X } from 'lucide-react'
import { dueFrom, dueLabel } from '../../lib/memberSearch'
import { introSteps, showsChecklist, stepDone } from '../../lib/onboarding'
import { berlinDay } from '../../lib/tasks'
import { emit, FEEDBACK_EVENT, ONBOARDING_CHANGE, saveMark, SEARCH_EVENT } from './memberHelp'
import { CopyField, fill, PRIMARY_BUTTON, TOOL_BUTTON } from './memberUi'

const ACCENT_TINT = 'bg-[color-mix(in_srgb,var(--color-accent-text)_16%,transparent)]'
const SUCCESS_TINT = 'bg-[color-mix(in_srgb,var(--color-success)_16%,transparent)]'
const BOX = 'rounded-card border border-border bg-bg-subtle'
const ACCENT_BUTTON =
  'inline-flex min-h-10 items-center gap-2 rounded-lg border border-accent bg-transparent px-3.5 text-xs font-semibold text-accent no-underline'
const ASSISTANTS = ['claude', 'chatgpt']
// Coming back to the tab fires both focus and visibilitychange; one check covers both.
const RECHECK_GAP_MS = 2000

function Tokens({ parts }) {
  return parts.map(({ token, text }) => (
    <Fragment key={token}>
      <span className="font-semibold text-accent">{token}</span>
      {text}
    </Fragment>
  ))
}

function SearchStep({ copy, locale, onTry }) {
  const { example } = copy
  const today = berlinDay(Date.now())
  // The date the search itself reads from „bis Mi“, so the example stays true every week.
  const due = dueLabel(dueFrom(example.due, today), today, locale)
  const line = example.line.map(({ token, text }) => token + text).join('')
  return (
    <>
      <div role="img" aria-label={fill(example.label, { line, due })} className="overflow-hidden rounded-card border border-border-strong bg-bg">
        <div className="flex h-[52px] items-center gap-2.5 border-b border-border px-3.5">
          <Search aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-fg-muted" />
          <p className="min-w-0 truncate text-[16px]">
            <Tokens parts={example.line} />
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-3.5 py-3">
          <span className="text-2xs font-semibold text-fg-muted">{example.kind}</span>
          {[fill(example.chips.due, { due }), example.chips.person, example.chips.team].map((chip) => (
            <span key={chip} className="surface-brand inline-flex h-7 items-center rounded-full px-2.5 text-2xs">
              {chip}
            </span>
          ))}
          <span className="flex-1" />
          <span className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-2xs font-semibold text-primary-fg">
            {example.create}
          </span>
        </div>
      </div>
      <ul className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
        {copy.legend.map(({ token, text }) => (
          <li key={token} className="flex items-baseline gap-2.5 text-xs">
            <code className={`flex-none rounded-md px-2 py-0.5 font-mono text-2xs text-accent ${ACCENT_TINT}`}>{token}</code>
            <span>{text}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
        <button type="button" onClick={onTry} className={ACCENT_BUTTON}>
          <Search aria-hidden="true" className="h-4 w-4" />
          {copy.try}
        </button>
        <span className="text-2xs text-fg-muted">{copy.tryNote}</span>
      </div>
      <p className="text-2xs text-fg-muted">{copy.note}</p>
    </>
  )
}

function CalendarStep({ copy, panel, calendar, feedUrl, busy, failed, onCreate, connectionsUrl }) {
  return (
    <>
      <ul className="flex flex-wrap gap-2">
        {copy.includes.map((item) => (
          <li key={item} className={`inline-flex min-h-8 items-center gap-2 rounded-full px-3 text-2xs ${SUCCESS_TINT}`}>
            <Check aria-hidden="true" className="h-3.5 w-3.5 text-success" />
            {item}
          </li>
        ))}
        <li className="inline-flex min-h-8 items-center gap-2 rounded-full bg-bg-subtle px-3 text-2xs text-fg-muted">
          <Minus aria-hidden="true" className="h-3.5 w-3.5" />
          {copy.excludes}
        </li>
      </ul>

      {feedUrl ? (
        <>
          <div>
            <CopyField label={copy.link} value={feedUrl} copy={panel} className="" />
            <p className="mt-2 text-xs font-medium">{panel.calendar.once}</p>
          </div>
          <ul className={`divide-y divide-border ${BOX}`}>
            <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-3">
              <div className="min-w-0 flex-[1_1_12.5rem]">
                <p className="text-xs font-semibold">{copy.apps.apple.name}</p>
                <p className="mt-0.5 text-2xs text-fg-muted">{copy.apps.apple.text}</p>
              </div>
              <a href={feedUrl.replace(/^https?:/, 'webcal:')} className={`${TOOL_BUTTON} no-underline`}>
                {panel.calendar.open}
              </a>
            </li>
            {['google', 'outlook'].map((app) => (
              <li key={app} className="px-3.5 py-3">
                <p className="text-xs font-semibold">{copy.apps[app].name}</p>
                <p className="mt-0.5 text-2xs text-fg-muted">{copy.apps[app].text}</p>
              </li>
            ))}
          </ul>
          <p className="text-2xs text-fg-muted">{copy.delay}</p>
        </>
      ) : calendar ? (
        <div className={`flex flex-col items-start gap-2.5 p-4 ${BOX}`}>
          <p className="text-xs">{copy.existing}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onCreate} disabled={busy} className={`${TOOL_BUTTON} disabled:opacity-50`}>
              {panel.calendar.renew}
            </button>
            <a href={connectionsUrl} className={`${TOOL_BUTTON} no-underline`}>
              {copy.manage}
            </a>
          </div>
          <p className="text-2xs text-fg-muted">{panel.calendar.renewNote}</p>
        </div>
      ) : (
        <div className={`flex flex-col items-start gap-2.5 p-4 ${BOX}`}>
          <button type="button" onClick={onCreate} disabled={busy} className={`${PRIMARY_BUTTON} disabled:opacity-50`}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            {panel.calendar.create}
          </button>
          <p className="text-2xs text-fg-muted">{copy.createNote}</p>
        </div>
      )}

      {failed && (
        <p role="alert" className="text-xs text-danger">
          {panel.failed}
        </p>
      )}
    </>
  )
}

function Numbered({ n, children }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-bg-subtle text-2xs font-semibold"
      >
        {n}
      </span>
      <div className="min-w-0 flex-1 pt-0.5 text-caption">{children}</div>
    </li>
  )
}

function AssistantStep({ copy, panel, appNames, apps, mcpUrl }) {
  const [app, setApp] = useState('claude')
  const names = apps.map((name) => appNames[name] ?? name).join(', ')
  return (
    <>
      <div role="group" aria-label={copy.appsLabel} className="flex w-fit gap-0.5 rounded-[10px] border border-border bg-bg-subtle p-[3px]">
        {ASSISTANTS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={app === option}
            onClick={() => setApp(option)}
            className={`h-[34px] rounded-[7px] border-0 px-4 py-0 text-xs font-semibold ${
              app === option ? 'bg-card text-fg' : 'bg-transparent text-fg-muted hover:text-fg'
            }`}
          >
            {appNames[option]}
          </button>
        ))}
      </div>
      <ol className="flex flex-col gap-3">
        <Numbered n={1}>
          <CopyField label={copy.copyAddress} value={mcpUrl} copy={panel} className="" />
        </Numbered>
        <Numbered n={2}>{copy[app].add}</Numbered>
        <Numbered n={3}>{copy[app].connect}</Numbered>
        <Numbered n={4}>{copy[app].ask}</Numbered>
      </ol>
      <p className="text-2xs text-fg-muted">{copy.labels}</p>
      <div
        className={`flex items-center gap-2.5 rounded-card border px-3.5 py-3 ${
          apps.length ? `border-transparent ${SUCCESS_TINT}` : 'border-dashed border-border-strong'
        }`}
      >
        <span aria-hidden="true" className={`h-2.5 w-2.5 flex-none rounded-full ${apps.length ? 'bg-success' : 'bg-fg-muted'}`} />
        <p role="status" className="text-xs">
          {apps.length ? fill(copy.connected, { apps: names }) : copy.none}
        </p>
      </div>
      <p className="text-2xs text-fg-muted">{copy.privacy}</p>
    </>
  )
}

function FeedbackStep({ copy, later, onFeedback }) {
  return (
    <>
      <div
        className={`flex flex-wrap items-center gap-x-4 gap-y-3 rounded-card border border-[color-mix(in_srgb,var(--color-accent-text)_35%,var(--color-border))] p-4 sm:p-5 ${ACCENT_TINT}`}
      >
        <span aria-hidden="true" className="surface-brand flex h-10 w-10 flex-none items-center justify-center rounded-full">
          <MessageCircle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-[1_1_13.75rem]">
          <p className="text-sm font-semibold">{copy.cardTitle}</p>
          <p className="mt-1 text-xs text-fg-muted">{copy.cardText}</p>
        </div>
        <button type="button" onClick={onFeedback} className={ACCENT_BUTTON}>
          {copy.action}
        </button>
      </div>
      {later && (
        <div className={`p-4 ${BOX}`}>
          <p className="text-caption font-semibold">{copy.laterTitle}</p>
          <p className="mt-1 text-xs text-fg-muted">{copy.laterText}</p>
        </div>
      )}
    </>
  )
}

export default function OnboardingDialog({ copy, panel, appNames, state, start, links, locale, onClose }) {
  const dialog = useRef(null)
  const heading = useRef(null)
  const checkedAt = useRef(0)
  const uid = useId()
  const steps = introSteps(state.mayConnect)
  const [step, setStep] = useState(steps.includes(start) ? start : steps[0])
  const [feedUrl, setFeedUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const index = steps.indexOf(step)
  const connected = state.apps.length > 0

  useEffect(() => {
    dialog.current.showModal()
    // Seen once is enough: a failed save only means it opens by itself once more.
    if (!state.marks.intro) saveMark('intro').catch(console.error)
  }, [])
  // The step's heading, so a screen reader hears where the member is; showModal focused the first button.
  useEffect(() => heading.current.focus(), [step])

  useEffect(() => {
    if (step !== 'assistant' || connected) return
    const recheck = async () => {
      if (document.visibilityState !== 'visible' || Date.now() - checkedAt.current < RECHECK_GAP_MS) return
      checkedAt.current = Date.now()
      const res = await fetch('/api/members/onboarding')
      if (!res.ok) throw new Error(`Onboarding state failed: ${res.status}`)
      emit(ONBOARDING_CHANGE, await res.json())
    }
    const onReturn = () => recheck().catch(console.error)
    window.addEventListener('focus', onReturn)
    document.addEventListener('visibilitychange', onReturn)
    return () => {
      window.removeEventListener('focus', onReturn)
      document.removeEventListener('visibilitychange', onReturn)
    }
  }, [step, connected])

  const close = () => dialog.current.close()
  const go = (position) => setStep(steps[position])
  const leaveFor = (event, detail) => {
    close()
    emit(event, detail)
  }

  const createFeed = async () => {
    setBusy(true)
    setFailed(false)
    try {
      const res = await fetch('/api/members/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'calendar' }),
      })
      if (!res.ok) throw new Error(`Calendar link not created: ${res.status}`)
      setFeedUrl((await res.json()).feedUrl)
      emit(ONBOARDING_CHANGE, { calendar: true })
    } catch (err) {
      console.error(err)
      setFailed(true)
    }
    setBusy(false)
  }

  const badge = (done, current) =>
    done
      ? `border-transparent text-success ${SUCCESS_TINT}`
      : current
        ? 'border-primary bg-primary text-primary-fg'
        : 'border-border-strong text-fg-muted'

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${uid}-title`}
      onClose={onClose}
      // A click on the backdrop lands on the dialog element itself.
      onClick={(e) => e.target === e.currentTarget && close()}
      className="h-[min(43.5rem,calc(100dvh-2rem))] max-h-none w-[min(51rem,calc(100vw-2rem))] max-w-none overflow-hidden rounded-card border border-border bg-card p-0 text-fg shadow-[var(--shadow-card)] backdrop:bg-black/60"
    >
      <div className="grid h-full sm:grid-cols-[14.75rem_minmax(0,1fr)]">
        <aside className="hidden min-h-0 flex-col gap-4 border-r border-border bg-bg-subtle px-3.5 pb-5 pt-6 sm:flex">
          <div className="px-2.5">
            <p className="text-2xs font-semibold text-accent">{copy.kicker}</p>
            <h2 id={`${uid}-title`} className="mt-1 text-[22px] font-bold leading-tight">
              {copy.title}
            </h2>
          </div>
          <ol aria-label={copy.stepsLabel} className="flex flex-col gap-1">
            {steps.map((option, position) => {
              const done = option !== 'feedback' && stepDone(state, option)
              const current = option === step
              return (
                <li key={option}>
                  <button
                    type="button"
                    aria-current={current ? 'step' : undefined}
                    onClick={() => go(position)}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-[10px] border-0 px-2.5 py-2 text-left ${
                      current ? 'bg-bg' : 'bg-transparent hover:bg-bg'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border text-2xs font-semibold ${badge(done, current)}`}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : position + 1}
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5 leading-snug">
                      <span className="text-xs font-semibold">{copy.steps[option].label}</span>
                      <span className={`text-2xs ${done ? 'text-success' : 'text-fg-muted'}`}>
                        {done ? copy.steps[option].done : copy.steps[option].open}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <p className="mt-auto px-2.5 text-2xs text-fg-muted">{copy.duration}</p>
        </aside>

        <div className="relative flex min-h-0 min-w-0 flex-col">
          <button
            type="button"
            onClick={close}
            aria-label={copy.close}
            className="absolute right-3 top-3 z-10 rounded-md border-0 bg-transparent p-2.5 text-fg-muted hover:text-fg"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5 pt-7 sm:px-8">
            <p className="pr-10 text-2xs font-semibold text-fg-muted">
              <span className="sm:hidden">{copy.title} · </span>
              {fill(copy.progress, { step: index + 1, total: steps.length })}
            </p>
            <h3 ref={heading} tabIndex={-1} className="mt-1.5 text-[26px] font-bold leading-tight tracking-tight">
              {copy[step].title}
            </h3>
            <p className="mt-2 text-caption text-fg-muted">{copy[step].lead}</p>
            <div className="mt-4 flex flex-col gap-4">
              {step === 'search' && (
                <SearchStep copy={copy.search} locale={locale} onTry={() => leaveFor(SEARCH_EVENT, { text: '+ ' })} />
              )}
              {step === 'calendar' && (
                <CalendarStep
                  copy={copy.calendar}
                  panel={panel}
                  calendar={state.calendar}
                  feedUrl={feedUrl}
                  busy={busy}
                  failed={failed}
                  onCreate={createFeed}
                  connectionsUrl={links.connections}
                />
              )}
              {step === 'assistant' && (
                <AssistantStep copy={copy.assistant} panel={panel} appNames={appNames} apps={state.apps} mcpUrl={links.mcp} />
              )}
              {step === 'feedback' && (
                <FeedbackStep copy={copy.feedback} later={showsChecklist(state)} onFeedback={() => leaveFor(FEEDBACK_EVENT)} />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 border-t border-border px-6 py-3.5 sm:pl-8">
            <button type="button" onClick={close} className="h-10 rounded-lg border-0 bg-transparent px-1 py-0 text-sm text-fg-muted hover:text-fg">
              {copy.later}
            </button>
            <span className="flex-1" />
            {index > 0 && (
              <button type="button" onClick={() => go(index - 1)} className={TOOL_BUTTON}>
                {copy.back}
              </button>
            )}
            {index < steps.length - 1 ? (
              <button type="button" onClick={() => go(index + 1)} className={PRIMARY_BUTTON}>
                {copy.next}
              </button>
            ) : (
              <button type="button" onClick={close} className={PRIMARY_BUTTON}>
                {copy.finish}
              </button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  )
}
