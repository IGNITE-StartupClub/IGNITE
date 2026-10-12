/**
 * Stateless step views for the application questionnaire (used by Questionnaire.jsx).
 * Copy comes from questionnaireConfig in the page language (passed down by Questionnaire.jsx). Styles: ./forms.css.
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

export function FreeTextStep({ name, config, wordsUnit, value, onChange }) {
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
        {wordCount} / {MAX_WORDS} {wordsUnit}
      </span>
    </div>
  )
}

export function PersonalStep({ config, ui, data, onChange, onToggle, submitting, error }) {
  const text = (name, type, autoComplete) => (
    <label className="field">
      <span className="field-label">{config.fields[name].label}</span>
      <input
        type={type}
        name={name}
        value={data[name]}
        onChange={onChange}
        required={config.fields[name].required}
        autoComplete={autoComplete}
        className="input"
      />
    </label>
  )
  return (
    <>
      <div className="form-row">
        {text('name', 'text', 'given-name')}
        {text('lastname', 'text', 'family-name')}
      </div>
      {text('email', 'email', 'email')}

      <label className="choice">
        <input type="checkbox" name="subscribeNewsletter" checked={data.subscribeNewsletter} onChange={onToggle} />
        <span>{config.newsletterConsent}</span>
      </label>
      <label className="choice">
        <input type="checkbox" name="acceptPrivacy" checked={data.acceptPrivacy} onChange={onToggle} required />
        <span>
          {config.privacyBefore} <a href={config.privacyLink.url}>{config.privacyLink.label}</a>
          {config.privacyAfter}
        </span>
      </label>

      <p className="form-error" role="alert">
        {error}
      </p>
      <button type="submit" className="form-submit form-centered" disabled={submitting || !data.acceptPrivacy}>
        {submitting ? ui.submitting : ui.submit}
      </button>
    </>
  )
}
