/**
 * The help dialogs of the members area on every page with the member header (MemberHelp.astro): the website feedback
 * and the onboarding "Erste Schritte" (OnboardingDialog.jsx). Each loads on first use. Others open them through window
 * events (memberHelp.js): the profile menu entries ([data-member-help="feedback" | "onboarding"]), the search when it
 * finds nothing, and the start page card. On the start page of a member who has not seen the onboarding, FirstSteps.astro
 * leaves a marker ([data-onboarding-autostart]) and the dialog opens by itself.
 * The island keeps the onboarding state current (ONBOARDING_CHANGE) for the dialog and for the number on the profile
 * menu entry ([data-onboarding-badge]), which is static markup of the header.
 * Props: copy ({ feedback, onboarding, connections, apps, menuBadge }), areaPaths (page paths for feedbackArea in
 * src/lib/feedback.ts), onboarding (OnboardingState of the session), links ({ mcp, connections }), locale.
 */
import React, { lazy, Suspense, useEffect, useState } from 'react'
import { feedbackArea } from '../../lib/feedback'
import { menuBadge, startStep, withChange } from '../../lib/onboarding'
import { FEEDBACK_EVENT, ONBOARDING_CHANGE, ONBOARDING_EVENT } from './memberHelp'
import { fill } from './memberUi'

const FeedbackDialog = lazy(() => import('./FeedbackDialog.jsx'))
const OnboardingDialog = lazy(() => import('./OnboardingDialog.jsx'))

// The header swap remounts this island on every navigation, but the module stays. A page rendered before the mark
// `intro` was stored still carries the marker, so the dialog opens by itself at most once per document.
let introOpened = false

export default function HelpDialogs({ copy, areaPaths, onboarding, links, locale }) {
  const [feedback, setFeedback] = useState(null)
  const [intro, setIntro] = useState(null)
  const [state, setState] = useState(onboarding)

  useEffect(() => {
    let openings = 0
    const openFeedback = ({ area, text } = {}) => {
      const page = feedbackArea(window.location.pathname, areaPaths)
      openings += 1
      setFeedback({ key: openings, area: area ?? page, here: page === 'other' ? null : page, text: text ?? '' })
    }
    const openOnboarding = (step) => {
      introOpened = true
      openings += 1
      setIntro({ key: openings, step })
    }
    const onFeedback = (e) => openFeedback(e.detail)
    const onOnboarding = (e) => openOnboarding(e.detail.step)
    const onChange = (e) => setState((current) => withChange(current, e.detail))
    // Buttons in the profile menu, which is static markup of the header.
    const onClick = (e) => {
      const button = e.target instanceof Element ? e.target.closest('[data-member-help]') : null
      if (!button) return
      button.closest('details')?.removeAttribute('open')
      if (button.dataset.memberHelp === 'feedback') openFeedback()
      if (button.dataset.memberHelp === 'onboarding') openOnboarding()
    }
    window.addEventListener(FEEDBACK_EVENT, onFeedback)
    window.addEventListener(ONBOARDING_EVENT, onOnboarding)
    window.addEventListener(ONBOARDING_CHANGE, onChange)
    document.addEventListener('click', onClick)
    if (!introOpened && document.querySelector('[data-onboarding-autostart]')) openOnboarding()
    return () => {
      window.removeEventListener(FEEDBACK_EVENT, onFeedback)
      window.removeEventListener(ONBOARDING_EVENT, onOnboarding)
      window.removeEventListener(ONBOARDING_CHANGE, onChange)
      document.removeEventListener('click', onClick)
    }
  }, [])

  // The header renders the number only while steps are open; it can only go down until the next page.
  useEffect(() => {
    const count = menuBadge(state)
    for (const badge of document.querySelectorAll('[data-onboarding-badge]')) {
      badge.hidden = count === 0
      badge.textContent = fill(copy.menuBadge, { count })
    }
  }, [state])

  return (
    <>
      {feedback && (
        <Suspense fallback={null}>
          <FeedbackDialog
            key={feedback.key}
            copy={copy.feedback}
            area={feedback.area}
            here={feedback.here}
            text={feedback.text}
            onClose={() => setFeedback(null)}
          />
        </Suspense>
      )}
      {intro && (
        <Suspense fallback={null}>
          <OnboardingDialog
            key={intro.key}
            copy={copy.onboarding}
            panel={copy.connections}
            appNames={copy.apps}
            state={state}
            start={intro.step ?? startStep(state)}
            links={links}
            locale={locale}
            onClose={() => setIntro(null)}
          />
        </Suspense>
      )}
    </>
  )
}
