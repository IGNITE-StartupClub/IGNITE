/**
 * Stateless step views for the application questionnaire (used by Questionnaire.jsx).
 * Data sources: src/data/openTeams.ts, src/data/questionnaireConfig.ts. Styles: ./forms.css.
 */
import React from 'react'
import { openTeams } from '../../data/openTeams'
import './forms.css'

export const CUSTOM_QUESTIONS = [
  'Erkläre eine wichtige und nicht offensichtliche Sache, die du in den letzten Monaten gelernt hast. Warum ist sie wichtig?',
  'Was glaubst du über die Zukunft, was andere nicht glauben?',
  'Was ist das schwierigste Problem, das du bisher lösen musstest und wie hast du es gelöst?',
]

export const MAX_WORDS = 500

export function DynamicField({ qId, question, value, onChange }) {
  const common = { name: qId, value: value || '', onChange, required: question.required, className: 'input' }
  return (
    <label className="field">
      <span className="field-label">{question.label}</span>
      {question.fieldType === 'select' ? (
        <select {...common}>
          <option value="">{question.placeholder || 'Bitte wählen...'}</option>
          {(question.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : ['text', 'email'].includes(question.fieldType) ? (
        <input type={question.fieldType} placeholder={question.placeholder || ''} {...common} />
      ) : (
        <textarea rows={question.rows || 4} placeholder={question.placeholder || ''} {...common} />
      )}
    </label>
  )
}

export function TeamStep({ config, selected, onToggle }) {
  const min = config?.minTeams || 2
  const max = config?.maxTeams || 3
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{config?.label || 'Wähle 2-3 Teams:'}</legend>
      {openTeams.map((team) => (
        <label key={team.id} className="choice">
          <input type="checkbox" checked={selected.includes(team.id)} onChange={() => onToggle(team.id)} />
          <span>{team.team}</span>
        </label>
      ))}
      <p className="form-note" aria-live="polite">
        {selected.length < min && (config?.hintTooFew || 'Bitte wähle mindestens 2 Teams aus.')}
        {selected.length === max && (config?.hintMaximum || 'Du hast die maximale Anzahl erreicht.')}
      </p>
    </fieldset>
  )
}

export function SituationStep({ config, data, onChange, wordCount }) {
  const overLimit = wordCount > MAX_WORDS
  return (
    <>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">{config?.legend || 'Was beschreibt deine Situation am besten?'}</legend>
        {(config?.options || []).map((option) => (
          <label key={option.value} className="choice">
            <input
              type="radio"
              name="startupInterest"
              value={option.value}
              checked={data.startupInterest === option.value}
              onChange={onChange}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Wähle eine Frage</legend>
        <p className="form-note">Diese Fragen helfen uns, dich kennenzulernen. Beantworte eine davon.</p>
        {CUSTOM_QUESTIONS.map((q) => {
          const isSelected = data.selectedCustomQuestion === q
          const isDisabled = !!data.customAnswer.trim() && !isSelected
          return (
            <label key={q} className={isDisabled ? 'choice choice-disabled' : 'choice'}>
              <input
                type="radio"
                name="selectedCustomQuestion"
                value={q}
                checked={isSelected}
                onChange={onChange}
                disabled={isDisabled}
              />
              <span>{q}</span>
            </label>
          )
        })}
      </fieldset>

      {data.selectedCustomQuestion !== '' && (
        <div className="field">
          <label className="field-label" htmlFor="customAnswer">
            Deine Antwort
          </label>
          <textarea
            id="customAnswer"
            name="customAnswer"
            value={data.customAnswer}
            onChange={onChange}
            placeholder={data.selectedCustomQuestion}
            rows={6}
            className="input"
            aria-invalid={overLimit}
          />
          <span className={overLimit ? 'form-error' : 'form-note'}>
            {wordCount} / {MAX_WORDS} Wörter
          </span>
        </div>
      )}
    </>
  )
}

export function PersonalStep({ config, data, onChange, onToggle, submitting, error }) {
  const fields = config?.fields || {}
  const text = (name, type, fallback, autoComplete) => (
    <label className="field">
      <span className="field-label">{fields[name]?.label || fallback}</span>
      <input
        type={type}
        name={name}
        value={data[name]}
        onChange={onChange}
        required={fields[name]?.required !== false}
        autoComplete={autoComplete}
        className="input"
      />
    </label>
  )
  return (
    <>
      <div className="form-row">
        {text('name', 'text', 'Vorname', 'given-name')}
        {text('lastname', 'text', 'Nachname', 'family-name')}
      </div>
      {text('email', 'email', 'E-Mail', 'email')}

      <label className="choice">
        <input type="checkbox" name="subscribeNewsletter" checked={data.subscribeNewsletter} onChange={onToggle} />
        <span>Ich möchte den IGNITE Newsletter abonnieren und über Events und Workshops informiert werden.</span>
      </label>
      <label className="choice">
        <input type="checkbox" name="acceptPrivacy" checked={data.acceptPrivacy} onChange={onToggle} required />
        <span>
          Ich akzeptiere die <a href="/datenschutz">Datenschutzbestimmungen</a>. (Pflichtfeld)
        </span>
      </label>

      <p className="form-error" role="alert">
        {error}
      </p>
      <button type="submit" className="form-submit" disabled={submitting || !data.acceptPrivacy}>
        {submitting ? 'Wird gesendet...' : 'Anfrage absenden'}
      </button>
    </>
  )
}
