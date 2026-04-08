import React, { useState, useEffect } from 'react'
import { teams } from '../data/teams.js'
import { questionnaireConfig } from '../data/questionnaireConfig'

const CUSTOM_QUESTIONS = [
  'Erkläre eine wichtige und nicht offensichtliche Sache, die du in den letzten Monaten gelernt hast. Warum ist sie wichtig?',
  'Was glaubst du über die Zukunft, was andere nicht glauben?',
  'Was ist das schwierigste Problem, das du bisher lösen musstest?',
]

export default function Questionnaire({ initialPosition = '' }) {
  const startStep = 1
  const [step, setStep] = useState(startStep)
  const [config] = useState(questionnaireConfig)
  const [loading] = useState(false)

  // Initialize state dynamically based on config
  const [data, setData] = useState(() => {
    return {
      teams: [],
      startupInterest: '',
      selectedCustomQuestion: '',
      customAnswer: '',
      name: '',
      lastname: '',
      email: '',
      subscribeNewsletter: false,
      acceptPrivacy: false, // <-- Neu: Pflichtfeld für Datenschutz
    }
  })

  // Update data state when config loads for dynamic questions
  useEffect(() => {
    if (config && config.allQuestions) {
      setData((d) => {
        const newData = { ...d }
        config.allQuestions.forEach((qId) => {
          if (!(qId in newData)) newData[qId] = ''
        })
        return newData
      })
    }
  }, [config])

  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((d) => ({ ...d, [name]: value }))
  }

  const handleTeamChange = (teamId) => {
    setData((d) => {
      const currentTeams = d.teams || []
      const maxTeams = config?.step2?.maxTeams || 3
      if (currentTeams.includes(teamId)) {
        return { ...d, teams: currentTeams.filter((t) => t !== teamId) }
      } else {
        if (currentTeams.length >= maxTeams) return d
        return { ...d, teams: [...currentTeams, teamId] }
      }
    })
  }

  // Function to check if a step has questions
  const stepHasQuestions = (stepNum) => {
    if (!config) return true
    if ([1, 2, 3, 6].includes(stepNum)) return true
    // Generic check for intermediate dynamic steps (like 4 and 5)
    return Object.keys(config[`step${stepNum}`]?.questions || {}).length > 0
  }

  // Smart next function that skips empty steps
  const next = () => {
    setStep((s) => {
      let nextStep = s + 1
      while (nextStep <= 6 && !stepHasQuestions(nextStep)) {
        nextStep++
      }
      return nextStep
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

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
    } catch (error) {
      console.error('Error submitting application:', error)
      alert(
        `Es gab einen Fehler beim Absenden: ${error.message}\n\nBitte versuche es erneut oder schreib uns direkt an.`,
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Helper: Count words
  const getWordCount = (text) => {
    return text ? text.trim().split(/\s+/).filter(Boolean).length : 0
  }
  const currentWordCount = getWordCount(data.customAnswer)

  // Helper: Render dynamic fields
  const renderDynamicField = (qId, question) => (
    <label key={qId}>
      {question.label}
      {question.fieldType === 'select' ? (
        <select name={qId} value={data[qId] || ''} onChange={handleChange} required={question.required}>
          <option value="">{question.placeholder || 'Bitte wählen...'}</option>
          {(question.options || []).map((opt, idx) => (
            <option key={idx} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : ['text', 'email'].includes(question.fieldType) ? (
        <input
          type={question.fieldType}
          name={qId}
          value={data[qId] || ''}
          onChange={handleChange}
          required={question.required}
          placeholder={question.placeholder || ''}
        />
      ) : (
        <textarea
          name={qId}
          value={data[qId] || ''}
          onChange={handleChange}
          required={question.required}
          rows={question.rows || 4}
          placeholder={question.placeholder || ''}
        />
      )}
    </label>
  )

  if (loading || !config) return <p>Lädt Fragebogen...</p>
  if (done) return <p>Danke für deine Anfrage! Wir freuen uns über dein Interesse und melden uns bald bei dir.</p>

  // Identify dynamic questions for current step (used for Steps 3, 4, 5)
  const currentDynamicQuestions = config[`step${step}`]?.questions || {}
  const hasDynamicQuestions = Object.keys(currentDynamicQuestions).length > 0
  const isDynamicValid = !Object.keys(currentDynamicQuestions).some(
    (qId) => currentDynamicQuestions[qId].required && !data[qId]?.trim()
  )

  return (
    <form id="application-form" onSubmit={handleSubmit} className="questionnaire">
      
      {/* Schritt 1: Intro-Button */}
      {step === 1 && (
        <button type="button" className="button secondary" onClick={next}>
          {config.step1?.buttonText || 'Jetzt mitmachen'}
        </button>
      )}

      {/* Schritt 2: Team-Auswahl (2-3 Teams) */}
      {step === 2 && (
        <>
          <div>
            <label style={{ marginBottom: '1rem' }}>{config.step2?.label || 'Wähle 2-3 Teams:'}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {teams.map((team) => (
                <label key={team.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexDirection: 'row' }}>
                  <input
                    type="checkbox"
                    checked={data.teams.includes(team.id)}
                    onChange={() => handleTeamChange(team.id)}
                    style={{ flexShrink: 0, cursor: 'pointer' }}
                  />
                  <span style={{ paddingLeft: '0.75rem', fontSize: '1.2rem', fontWeight: '600', lineHeight: '1.3' }}>
                    {team.team}
                  </span>
                </label>
              ))}
            </div>
            {data.teams.length < (config.step2?.minTeams || 2) && (
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--neutral-100)' }}>
                {config.step2?.hintTooFew || 'Bitte wähle mindestens 2 Teams aus.'}
              </p>
            )}
            {data.teams.length === (config.step2?.maxTeams || 3) && (
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--neutral-100)' }}>
                {config.step2?.hintMaximum || 'Du hast die maximale Anzahl erreicht.'}
              </p>
            )}
          </div>
          <button type="button" className="button secondary" onClick={next} disabled={data.teams.length < (config.step2?.minTeams || 2)}>
            Weiter
          </button>
        </>
      )}

      {/* Schritt 3: Startup-Interesse & Custom Questions */}
      {step === 3 && (
        <>
          <fieldset style={{ border: 'none', padding: 0 }}>
            <h3 style={{ fontWeight: 500, marginBottom: '0.75rem', textAlign: 'left' }}>
              {config.step3?.legend || 'Was beschreibt deine Situation am besten?'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
              {(config.step3?.options || []).map((option) => (
                <label key={option.value} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexDirection: 'row' }}>
                  <input
                    type="radio"
                    name="startupInterest"
                    value={option.value}
                    checked={data.startupInterest === option.value}
                    onChange={handleChange}
                    style={{ flexShrink: 0 }}
                  />
                  <span style={{ paddingLeft: '0.75rem' }}>{option.label}</span>
                </label>
              ))}
            </div>

            {/* Custom Question Implementation */}
            <h3 style={{ fontWeight: 500, marginBottom: '0.25rem', textAlign: 'left' }}>Wähle eine Frage</h3>
            <legend style={{ fontWeight: 400, marginBottom: '1rem', textAlign: 'left', color: 'var(--neutral-700)' }}>
              Diese Fragen helfen uns, dich kennenzulernen. (Beantworte eine)
            </legend>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {CUSTOM_QUESTIONS.map((q, idx) => {
                const isSelected = data.selectedCustomQuestion === String(idx);
                const hasText = !!data.customAnswer.trim();
                const isDisabled = hasText && !isSelected;

                return (
                  <label 
                    key={idx} 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'row', 
                      alignItems: 'flex-start', 
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.5 : 1
                    }}
                  >
                    <input
                      type="radio"
                      name="selectedCustomQuestion"
                      value={idx}
                      checked={isSelected}
                      onChange={handleChange}
                      disabled={isDisabled}
                      style={{ marginTop: '0.25rem', flexShrink: 0 }}
                    />
                    <span style={{ paddingLeft: '0.75rem', fontWeight: 400 }}>{q}</span>
                  </label>
                )
              })}
            </div>

            {data.selectedCustomQuestion !== '' && (
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '1rem' }}>
                <textarea
                  name="customAnswer"
                  value={data.customAnswer}
                  onChange={handleChange}
                  placeholder={CUSTOM_QUESTIONS[Number(data.selectedCustomQuestion)]}
                  rows={6}
                  style={{
                    borderColor: currentWordCount > 500 ? 'red' : 'var(--neutral-400)'
                  }}
                />
                <span style={{ 
                  alignSelf: 'flex-end', 
                  fontSize: '0.85rem', 
                  marginTop: '0.25rem',
                  color: currentWordCount > 500 ? 'red' : 'var(--neutral-500)'
                }}>
                  {currentWordCount} / 500 Wörter
                </span>
              </div>
            )}
          </fieldset>

          {/* Render extra step 3 questions dynamically if any exist in config */}
          {hasDynamicQuestions && Object.keys(currentDynamicQuestions).map((qId) => 
            renderDynamicField(qId, currentDynamicQuestions[qId])
          )}

          <button
            type="button"
            className="button secondary"
            onClick={next}
            disabled={
              !data.startupInterest ||
              data.selectedCustomQuestion === '' ||
              !data.customAnswer.trim() ||
              currentWordCount > 500 ||
              !isDynamicValid
            }
          >
            Weiter
          </button>
        </>
      )}

      {/* Generic Step Rendering for intermediate dynamic steps (Step 4, 5, etc.) */}
      {step > 3 && step < 6 && hasDynamicQuestions && (
        <>
          {Object.keys(currentDynamicQuestions).map((qId) => 
            renderDynamicField(qId, currentDynamicQuestions[qId])
          )}
          <button type="button" className="button secondary" onClick={next} disabled={!isDynamicValid}>
            Weiter
          </button>
        </>
      )}

      {/* Schritt 6: Persönliche Daten */}
      {step === 6 && (
        <>
          <label>
            {config.step6?.fields?.name?.label || 'Vorname'}
            <input type="text" name="name" value={data.name} onChange={handleChange} required={config.step6?.fields?.name?.required !== false} />
          </label>
          <label>
            {config.step6?.fields?.lastname?.label || 'Nachname'}
            <input type="text" name="lastname" value={data.lastname} onChange={handleChange} required={config.step6?.fields?.lastname?.required !== false} />
          </label>
          <label>
            {config.step6?.fields?.email?.label || 'E-Mail'}
            <input type="email" name="email" value={data.email} onChange={handleChange} required={config.step6?.fields?.email?.required !== false} />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexDirection: 'row', marginTop: '1rem' }}>
            <input
              type="checkbox"
              name="subscribeNewsletter"
              checked={data.subscribeNewsletter}
              onChange={(e) => setData((d) => ({ ...d, subscribeNewsletter: e.target.checked }))}
              style={{ flexShrink: 0, cursor: 'pointer' }}
            />
            <span style={{ paddingLeft: '0.75rem', fontSize: '1rem', fontWeight: '400' }}>
              Ich möchte den IGNITE Newsletter abonnieren und über Events & Workshops informiert werden
            </span>
          </label>

          {/* Neues Pflichtfeld: Datenschutz */}
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexDirection: 'row', marginTop: '0.5rem' }}>
            <input
              type="checkbox"
              name="acceptPrivacy"
              checked={data.acceptPrivacy}
              onChange={(e) => setData((d) => ({ ...d, acceptPrivacy: e.target.checked }))}
              required
              style={{ flexShrink: 0, cursor: 'pointer' }}
            />
            <span style={{ paddingLeft: '0.75rem', fontSize: '1rem', fontWeight: '400' }}>
              Ich akzeptiere die Datenschutzbestimmungen. *
            </span>
          </label>

          {/* Submit Button mit Disable-Logik für Datenschutz */}
          <button 
            type="submit" 
            className="button secondary" 
            style={{ marginTop: '1rem' }}
            disabled={submitting || !data.acceptPrivacy}
          >
            {submitting ? 'Wird gesendet...' : 'Anfrage absenden'}
          </button>
        </>
      )}

      <style>{`
        .questionnaire {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md, 1rem);
        }
        label {
          display: flex;
          flex-direction: column;
          font-weight: 500;
        }
        select,
        textarea,
        input[type="text"],
        input[type="email"] {
          margin-top: 0.25rem;
          padding: 0.75rem;
          border: 1px solid var(--neutral-400);
          border-radius: var(--radius-sm, 4px);
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        input[type="text"]:focus,
        input[type="email"]:focus {
          border-color: var(--primary-400);
          outline: none;
          box-shadow: 0 0 0 3px rgba(140, 57, 116, 0.2);
        }

        input::placeholder,
        textarea::placeholder {
          color: var(--neutral-700);
          opacity: 1;
          font-style: italic;
          font-size: 0.95rem;
        }

        input[type="checkbox"],
        input[type="radio"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: var(--primary-400, #8c3974);
          border: 2px solid var(--neutral-400);
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        input[type="radio"] {
          border-radius: 50%;
        }

        input[type="checkbox"]:checked,
        input[type="radio"]:checked {
          background-color: var(--primary-400);
          border-color: var(--primary-300);
          box-shadow: 0 0 0 3px rgba(140, 57, 116, 0.2);
        }

        input[type="checkbox"]:hover:not(:disabled),
        input[type="radio"]:hover:not(:disabled) {
          border-color: var(--primary-400);
        }

        textarea {
          font-family: inherit;
          resize: vertical;
          min-height: 120px;
          font-size: 1rem;
          line-height: 1.6;
          padding: 0.75rem;
        }

        textarea:focus {
          border-color: var(--primary-400);
          outline: none;
          box-shadow: 0 0 0 3px rgba(140, 57, 116, 0.2);
        }

        fieldset {
          margin: 0;
        }

        legend {
          padding: 0;
        }

        .questionnaire select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-color: var(--neutral-100);
          border: 1px solid var(--neutral-400);
          border-radius: var(--radius-md, 8px);
          padding: 0.5rem 2.5rem 0.5rem 0.75rem;
          font-size: var(--text-base, 1rem);
          color: var(--neutral-900);
          transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23333444' viewBox='0 0 16 16'%3E%3Cpath d='M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1rem;
        }

        .questionnaire select:hover:not(:disabled),
        .questionnaire select:focus {
          border-color: var(--primary-400);
          box-shadow: 0 0 0 3px rgba(102,51,153,0.2);
          outline: none;
        }

        .questionnaire select:disabled {
          background-color: var(--neutral-200);
          color: var(--neutral-500);
          cursor: not-allowed;
        }

        @media (prefers-color-scheme: light) {
          input, textarea {
            color: black;
          }
        }
      `}</style>
    </form>
  )
}