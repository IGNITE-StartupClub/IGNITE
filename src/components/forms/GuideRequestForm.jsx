/**
 * Guide request (React island on /materialien and /en/materials): pick one or more knowledge packages, enter name,
 * address and optional details, and post JSON to /api/guide, which mails the team and sends a confirmation.
 * Props: copy (guidePage), packages (guidePackages), locale, all in the page language. Styles: ./forms.css, ./guide.css.
 */
import React, { useId, useState } from 'react'
import { Coins, LayoutGrid, Lightbulb, Megaphone, Presentation, Scale, Users, Check } from 'lucide-react'
import './forms.css'
import './guide.css'

const ICONS = { lightbulb: Lightbulb, layout: LayoutGrid, scale: Scale, coins: Coins, presentation: Presentation, users: Users, megaphone: Megaphone }

const INITIAL = {
  name: '',
  email: '',
  occupation: '',
  company: '',
  field: '',
  university: '',
  program: '',
  whatsapp: false,
  consent: false,
  website: '',
}

function Field({ label, optional, children }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {optional && <span className="field-hint"> {optional}</span>}
      </span>
      {children}
    </label>
  )
}

export default function GuideRequestForm({ copy, packages, locale }) {
  const [selected, setSelected] = useState([])
  const [data, setData] = useState(INITIAL)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [packageError, setPackageError] = useState(false)
  const ids = { packages: useId(), packageError: useId() }

  const toggle = (id) => {
    setPackageError(false)
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const change = (e) => {
    const { name, value, type, checked } = e.target
    setData((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  // Radios cannot be unticked, but the answer is optional: a second click on the chosen one clears it.
  const chooseOccupation = (value) => setData((current) => ({ ...current, occupation: current.occupation === value ? '' : value }))

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (selected.length === 0) {
      setPackageError(true)
      document.getElementById(ids.packages)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    setStatus('sending')
    try {
      const response = await fetch('/api/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, packages: selected, locale }),
      })
      if (response.ok) {
        setStatus('done')
        return
      }
      // The API answers in German, so the page shows its own message per status.
      setError(copy.errors[response.status] ?? copy.errors.default)
    } catch (err) {
      console.error('Guide request failed:', err)
      setError(copy.errors.default)
    }
    setStatus('idle')
  }

  if (status === 'done') {
    const chosen = packages.filter((item) => selected.includes(item.id))
    return (
      <div className="form-success-box guide-success" role="status">
        <h2>{copy.success.title.replace('{name}', data.name.split(' ')[0])}</h2>
        <p>{copy.success.text}</p>
        <ul className="guide-success-list">
          {chosen.map((item) => (
            <li key={item.id}>
              <Check aria-hidden="true" size={18} /> {item.title}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <form className="guide" onSubmit={submit}>
      <fieldset className="guide-packages" id={ids.packages} aria-describedby={packageError ? ids.packageError : undefined}>
        <legend className="guide-title">{copy.packagesHeading}</legend>
        <p className="guide-meta">
          <span>{copy.packagesHint}</span>
          <span className="guide-count" aria-live="polite">
            {copy.selectedCount.replace('{n}', selected.length).replace('{total}', packages.length)}
          </span>
        </p>

        <div className="guide-grid">
          {packages.map((item) => {
            const Icon = ICONS[item.icon] ?? Lightbulb
            const checked = selected.includes(item.id)
            return (
              <label key={item.id} className="guide-card" data-checked={checked || undefined}>
                <input type="checkbox" className="guide-card-input" checked={checked} onChange={() => toggle(item.id)} />
                <span className="guide-card-icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <span className="guide-card-box" aria-hidden="true">
                  {checked && <Check size={14} strokeWidth={3} />}
                </span>
                <span className="guide-card-title">{item.title}</span>
                <span className="guide-card-subtitle">{item.subtitle}</span>
              </label>
            )
          })}
        </div>
        {packageError && (
          <p className="form-error" id={ids.packageError} role="alert">
            {copy.noPackageError}
          </p>
        )}
      </fieldset>

      <div className="guide-details">
        <h2 className="guide-title">{copy.detailsHeading}</h2>
        <div className="form">
          <Field label={copy.nameLabel}>
            <input name="name" value={data.name} onChange={change} required maxLength={120} className="input" autoComplete="name" />
          </Field>
          <Field label={copy.emailLabel}>
            <input type="email" name="email" value={data.email} onChange={change} required maxLength={254} className="input" autoComplete="email" />
          </Field>

          <fieldset className="fieldset">
            <legend className="field-label">
              {copy.occupationLabel}
              <span className="field-hint"> {copy.optional}</span>
            </legend>
            <div className="guide-toggle">
              {Object.entries(copy.occupations).map(([value, label]) => (
                <label key={value} className="guide-toggle-option">
                  <input
                    type="radio"
                    name="occupation"
                    value={value}
                    checked={data.occupation === value}
                    onChange={() => chooseOccupation(value)}
                    onClick={() => data.occupation === value && chooseOccupation(value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {data.occupation === 'work' && (
            <div className="form-row">
              <Field label={copy.companyLabel} optional={copy.optional}>
                <input name="company" value={data.company} onChange={change} maxLength={150} className="input" autoComplete="organization" />
              </Field>
              <Field label={copy.fieldLabel} optional={copy.optional}>
                <input name="field" value={data.field} onChange={change} maxLength={150} className="input" placeholder={copy.fieldPlaceholder} autoComplete="organization-title" />
              </Field>
            </div>
          )}
          {data.occupation === 'study' && (
            <div className="form-row">
              <Field label={copy.universityLabel} optional={copy.optional}>
                <input name="university" value={data.university} onChange={change} maxLength={150} className="input" placeholder={copy.universityPlaceholder} />
              </Field>
              <Field label={copy.programLabel} optional={copy.optional}>
                <input name="program" value={data.program} onChange={change} maxLength={150} className="input" placeholder={copy.programPlaceholder} />
              </Field>
            </div>
          )}

          {/* Hidden from people and screen readers; bots fill it and are dropped by the API. */}
          <div className="guide-trap" aria-hidden="true">
            <label>
              Website
              <input name="website" value={data.website} onChange={change} tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <div className="guide-choices">
            <label className="choice">
              <input type="checkbox" name="whatsapp" checked={data.whatsapp} onChange={change} />
              <span>{copy.whatsappLabel}</span>
            </label>
            <label className="choice">
              <input type="checkbox" name="consent" checked={data.consent} onChange={change} required />
              <span>
                {copy.consentLabel}{' '}
                <a href={copy.privacyHref} className="guide-link">
                  {copy.privacyLink}
                </a>
              </span>
            </label>
          </div>

          <p className="form-error" role="alert" aria-live="polite">
            {error}
          </p>

          <button type="submit" className="form-submit guide-submit" disabled={status === 'sending'}>
            {status === 'sending' ? copy.sending : copy.submit}
          </button>
        </div>
      </div>
    </form>
  )
}
