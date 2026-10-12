/**
 * Multi-step application questionnaire (React island on /mitmachen). Posts the collected data to /api/submit.
 * Props: config (questionnaireConfig in the page language, passed by the page). Step views: ./QuestionnaireSteps.jsx. Styles: ./forms.css.
 */
import React, { useState } from 'react'
import { SituationStep, FreeTextStep, PersonalStep, MAX_WORDS, getWordCount } from './QuestionnaireSteps'
import './forms.css'

const INITIAL_DATA = {
  startupInterest: '',
  contribution: '',
  fascination: '',
  name: '',
  lastname: '',
  email: '',
  subscribeNewsletter: false,
  acceptPrivacy: false,
}

const STEPS = ['intro', 'situation', 'contribution', 'fascination', 'personal']

const isFreeTextValid = (text) => !!text.trim() && getWordCount(text) <= MAX_WORDS

export default function Questionnaire({ config }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState(INITIAL_DATA)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((d) => ({ ...d, [name]: value }))
  }

  const handleToggle = (e) => {
    const { name, checked } = e.target
    setData((d) => ({ ...d, [name]: checked }))
  }

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || `Server error (${res.status})`)
      }
      setDone(true)
    } catch (err) {
      console.error('Error submitting application:', err)
      setError(config.ui.error)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <p className="form-success-box" role="status">
        {config.ui.success}
      </p>
    )
  }

  const nextButton = (disabled) => (
    <button type="button" className="form-secondary form-centered" onClick={next} disabled={disabled}>
      {config.ui.next}
    </button>
  )
  const current = STEPS[step]

  return (
    <form id="application-form" onSubmit={handleSubmit} className="form">
      {current === 'intro' && (
        <button type="button" className="form-submit" onClick={next}>
          {config.intro.buttonText}
        </button>
      )}

      {current === 'situation' && (
        <>
          <div className="form-step">
            <SituationStep config={config.situation} value={data.startupInterest} onChange={handleChange} />
          </div>
          {nextButton(!data.startupInterest)}
        </>
      )}

      {(current === 'contribution' || current === 'fascination') && (
        <>
          <div className="form-step">
            <FreeTextStep
              key={current}
              wordsUnit={config.ui.wordsUnit}
              name={current}
              config={config[current]}
              value={data[current]}
              onChange={handleChange}
            />
          </div>
          {nextButton(!isFreeTextValid(data[current]))}
        </>
      )}

      {current === 'personal' && (
        <PersonalStep
          config={config.personal}
          ui={config.ui}
          data={data}
          onChange={handleChange}
          onToggle={handleToggle}
          submitting={submitting}
          error={error}
        />
      )}
    </form>
  )
}
