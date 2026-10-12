/**
 * Stateless step views for the application questionnaire (used by Questionnaire.jsx).
 * Data source: src/data/questionnaireConfig.ts. Styles: ./forms.css.
 */
import React from 'react'
import './forms.css'

export const MAX_WORDS = 500

export const getWordCount = (text) => (text ? text.trim().split(/\s+/).filter(Boolean).length : 0)

export function SituationStep({ config, value, onChange }) {
  return (
    // A div radiogroup instead of <fieldset>: browsers do not let a fieldset's content stretch as a flex item,
    // which the vertically centered options need.
    <div className="fieldset" role="radiogroup" aria-labelledby="situation-legend">
      <p id="situation-legend" className="fieldset-legend">
        {config.legend}
      </p>
      <div className="choices">
        {config.options.map((option) => (
          <label key={option.value} className="choice">
            <input
              type="radio"
              name="startupInterest"
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export function FreeTextStep({ name, config, value, onChange }) {
  const wordCount = getWordCount(value)
  const overLimit = wordCount > MAX_WORDS
  return (
    <div className="field">
      <label className="fieldset-legend" htmlFor={name}>
        {config.label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="input"
        aria-invalid={overLimit}
      />
      <span className={overLimit ? 'form-error' : 'form-note'}>
        {wordCount} / {MAX_WORDS} Wörter
      </span>
    </div>
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
      <button type="submit" className="form-submit form-centered" disabled={submitting || !data.acceptPrivacy}>
        {submitting ? 'Wird gesendet...' : 'Anfrage absenden'}
      </button>
    </>
  )
}
