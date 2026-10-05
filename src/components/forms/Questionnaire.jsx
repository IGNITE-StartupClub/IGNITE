/**
 * Multi-step application questionnaire (React island on /mitmachen). Posts the collected data to /api/submit.
 * Props: initialPosition (unused URL hint, kept for the page contract).
 * Data source: src/data/questionnaireConfig.ts. Step views: ./QuestionnaireSteps.jsx. Styles: ./forms.css.
 */
import React, { useState, useEffect } from 'react'
import { questionnaireConfig as config } from '../../data/questionnaireConfig'
import { DynamicField, TeamStep, SituationStep, PersonalStep, MAX_WORDS } from './QuestionnaireSteps'
import './forms.css'

const INITIAL_DATA = {
  teams: [],
  startupInterest: '',
  selectedCustomQuestion: '',
  customAnswer: '',
  name: '',
  lastname: '',
  email: '',
  subscribeNewsletter: false,
  acceptPrivacy: false,
}

const LAST_STEP = 6

const getWordCount = (text) => (text ? text.trim().split(/\s+/).filter(Boolean).length : 0)

const stepHasQuestions = (stepNum) =>
  [1, 2, 3, 6].includes(stepNum) || Object.keys(config[`step${stepNum}`]?.questions || {}).length > 0

export default function Questionnaire() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState(INITIAL_DATA)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setData((d) => {
      const next = { ...d }
      config.allQuestions.forEach((qId) => {
        if (!(qId in next)) next[qId] = ''
      })
      return next
    })
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((d) => ({ ...d, [name]: value }))
  }

  const handleToggle = (e) => {
    const { name, checked } = e.target
    setData((d) => ({ ...d, [name]: checked }))
  }

  const handleTeamChange = (teamId) => {
    setData((d) => {
      const current = d.teams || []
      const max = config.step2?.maxTeams || 3
      if (current.includes(teamId)) return { ...d, teams: current.filter((t) => t !== teamId) }
      if (current.length >= max) return d
      return { ...d, teams: [...current, teamId] }
    })
  }

  const next = () =>
    setStep((s) => {
      let n = s + 1
      while (n <= LAST_STEP && !stepHasQuestions(n)) n++
      return n
    })

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
        throw new Error(body.message || `Server-Fehler (${res.status})`)
      }
      setDone(true)
    } catch (err) {
      console.error('Error submitting application:', err)
      setError(`Es gab einen Fehler beim Absenden: ${err.message}. Bitte versuche es erneut oder schreib uns direkt an.`)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <p className="form-success-box" role="status">
        Danke für deine Anfrage! Wir freuen uns über dein Interesse und melden uns bald bei dir.
      </p>
    )
  }

  const dynamicQuestions = config[`step${step}`]?.questions || {}
  const dynamicIds = Object.keys(dynamicQuestions)
  const isDynamicValid = !dynamicIds.some((id) => dynamicQuestions[id].required && !data[id]?.trim())
  const wordCount = getWordCount(data.customAnswer)
  const dynamicFields = dynamicIds.map((id) => (
    <DynamicField key={id} qId={id} question={dynamicQuestions[id]} value={data[id]} onChange={handleChange} />
  ))
  const nextButton = (disabled) => (
    <button type="button" className="form-secondary" onClick={next} disabled={disabled}>
      Weiter
    </button>
  )

  return (
    <form id="application-form" onSubmit={handleSubmit} className="form">
      {step === 1 && (
        <button type="button" className="form-submit" onClick={next}>
          {config.step1?.buttonText || 'Jetzt mitmachen'}
        </button>
      )}

      {step === 2 && (
        <>
          <TeamStep config={config.step2} selected={data.teams} onToggle={handleTeamChange} />
          {nextButton(data.teams.length < (config.step2?.minTeams || 2))}
        </>
      )}

      {step === 3 && (
        <>
          <SituationStep config={config.step3} data={data} onChange={handleChange} wordCount={wordCount} />
          {dynamicFields}
          {nextButton(
            !data.startupInterest ||
              data.selectedCustomQuestion === '' ||
              !data.customAnswer.trim() ||
              wordCount > MAX_WORDS ||
              !isDynamicValid,
          )}
        </>
      )}

      {step > 3 && step < LAST_STEP && dynamicIds.length > 0 && (
        <>
          {dynamicFields}
          {nextButton(!isDynamicValid)}
        </>
      )}

      {step === LAST_STEP && (
        <PersonalStep
          config={config.step6}
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
