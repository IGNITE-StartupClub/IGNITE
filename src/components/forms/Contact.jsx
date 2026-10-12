/**
 * Contact form (React island). Posts JSON to /api/contact.
 * Props: copy (contactPage), topics (contactTopics) in the page language, passed by the page so only one language ships
 * to the browser; initialIntent (topic value preselected from the ?intent= URL parameter). Styles: ./forms.css.
 */
import React, { useState, useEffect } from 'react'
import './forms.css'

const INITIAL_DATA = {
  name: '',
  lastname: '',
  email: '',
  message: '',
  topic: '',
  organization: '',
  position: '',
  linkedin: '',
  phone: '',
  expertise: '',
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

export default function ContactForm({ copy: config, topics: contactTopics, initialIntent = '' }) {
  const [data, setData] = useState(INITIAL_DATA)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (initialIntent) {
      setData((d) => ({ ...d, topic: initialIntent }))
    }
  }, [initialIntent])

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((d) => ({ ...d, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()

      if (response.ok) {
        setDone(true)
      } else {
        // The API answers in German, so the page language's message is shown and the server detail is only logged.
        console.error('Contact request failed:', result.message)
        setError(config.errorMessage)
      }
    } catch (err) {
      console.error('Contact request failed:', err)
      setError(config.errorMessage)
    }
  }

  const needsExtraFields = contactTopics.find((t) => t.value === data.topic)?.requiresAdditionalFields

  if (done) {
    const successHTML = data.topic === 'advisory' ? config.successMessageAdvisory : config.successMessage
    return <div className="form-success-box" role="status" dangerouslySetInnerHTML={{ __html: successHTML }} />
  }

  return (
    <form id="contact-form" onSubmit={handleSubmit} className="form">
      <Field label={config.formTopicLabel}>
        <select name="topic" value={data.topic} onChange={handleChange} required className="input">
          <option value="">{config.formTopicPlaceholder}</option>
          {contactTopics.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </select>
      </Field>

      {needsExtraFields && <p className="form-note">{config.advisoryInfoMessage}</p>}

      <div className="form-row">
        <Field label={config.formFirstNameLabel}>
          <input name="name" value={data.name} onChange={handleChange} required className="input" autoComplete="given-name" />
        </Field>
        <Field label={config.formLastNameLabel}>
          <input name="lastname" value={data.lastname} onChange={handleChange} required className="input" autoComplete="family-name" />
        </Field>
      </div>

      <Field label={config.formEmailLabel}>
        <input type="email" name="email" value={data.email} onChange={handleChange} required className="input" autoComplete="email" />
      </Field>

      {needsExtraFields && (
        <>
          <Field label={config.formOrganizationLabel}>
            <input name="organization" value={data.organization} onChange={handleChange} required className="input" autoComplete="organization" />
          </Field>
          <Field label={config.formExpertiseLabel}>
            <textarea
              name="expertise"
              value={data.expertise}
              onChange={handleChange}
              required
              rows={3}
              placeholder={config.formExpertisePlaceholder}
              className="input"
            />
          </Field>
        </>
      )}

      <Field label={config.formMessageLabel}>
        <textarea name="message" value={data.message} onChange={handleChange} required className="input" />
      </Field>

      <p className="form-error" role="alert" aria-live="polite">
        {error}
      </p>

      <button type="submit" className="form-submit">
        {config.submitButtonText}
      </button>
    </form>
  )
}
