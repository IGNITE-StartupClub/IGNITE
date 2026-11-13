/**
 * The help dialogs of the members area on every page with the member header (MemberHelp.astro): the website feedback.
 * It loads on first use. Others open it through window events (memberHelp.js): the profile menu entry
 * ([data-member-help="feedback"]) and the search when it finds nothing.
 * Props: copy ({ feedback: memberArea.feedback }), areaPaths (page paths for feedbackArea in src/lib/feedback.ts).
 */
import React, { lazy, Suspense, useEffect, useState } from 'react'
import { feedbackArea } from '../../lib/feedback'
import { FEEDBACK_EVENT } from './memberHelp'

const FeedbackDialog = lazy(() => import('./FeedbackDialog.jsx'))

export default function HelpDialogs({ copy, areaPaths }) {
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    let openings = 0
    const openFeedback = ({ area, text } = {}) => {
      const page = feedbackArea(window.location.pathname, areaPaths)
      openings += 1
      setFeedback({ key: openings, area: area ?? page, here: page === 'other' ? null : page, text: text ?? '' })
    }
    const onEvent = (e) => openFeedback(e.detail)
    // Buttons in the profile menu, which is static markup of the header.
    const onClick = (e) => {
      const button = e.target instanceof Element ? e.target.closest('[data-member-help]') : null
      if (!button) return
      button.closest('details')?.removeAttribute('open')
      if (button.dataset.memberHelp === 'feedback') openFeedback()
    }
    window.addEventListener(FEEDBACK_EVENT, onEvent)
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener(FEEDBACK_EVENT, onEvent)
      document.removeEventListener('click', onClick)
    }
  }, [])

  return (
    feedback && (
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
    )
  )
}
