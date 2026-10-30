/**
 * Email signature generator (React island, members area). Builds the signature from the member's input, shows it in
 * a sample mail and copies it as rich text for pasting into Outlook, or as raw HTML.
 * Props: copy (memberArea.signature.generator in the page language), links (social links shown in the signature),
 * defaultEmail (the signed-in member's address, prefilled), photo (path of the member's stored photo or ''),
 * saved (the admin's stored signature or null), savesSignature (true for admins: copying stores the signature, which
 * then closes the invitations they send).
 * Text inputs are remembered in localStorage per browser and account (signatureStorageKey) and win over `saved`; the photo lives on the server
 * (PhotoCropper).
 * Styles: ./forms.css plus Tailwind utilities.
 */
import React, { useEffect, useState } from 'react'
import { Check, CircleAlert, Code, Copy, Info } from 'lucide-react'
import { isComplete, LIVE_ORIGIN, signatureHtml, signatureStorageKey } from '../../lib/emailSignature'
import { PRIMARY_BUTTON, TOOL_BUTTON } from './memberUi.jsx'
import PhotoCropper from './PhotoCropper.jsx'
import './forms.css'

// Until 2026-10-30 every account shared this key; dropping it keeps an old draft from showing up under another account.
const LEGACY_STORAGE_KEY = 'ignite-signature'
const FIELDS = ['name', 'role', 'email', 'phone']

async function writeClipboard(html, plain, asRichText) {
  if (asRichText) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      }),
    ])
  } else {
    await navigator.clipboard.writeText(html)
  }
}

// Some browsers and embedded views deny the async Clipboard API; copying a selection still works there.
function copyViaSelection(html, asRichText) {
  let holder
  if (asRichText) {
    holder = document.createElement('div')
    holder.innerHTML = html
  } else {
    holder = document.createElement('textarea')
    holder.value = html
  }
  holder.style.cssText = 'position:fixed;left:-9999px;top:0;'
  document.body.append(holder)
  const range = document.createRange()
  range.selectNodeContents(holder)
  getSelection().removeAllRanges()
  getSelection().addRange(range)
  if (holder instanceof HTMLTextAreaElement) holder.select()
  const copied = document.execCommand('copy')
  getSelection().removeAllRanges()
  holder.remove()
  if (!copied) throw new Error('execCommand("copy") returned false')
}

async function saveSignature({ name, role, email, phone }) {
  try {
    const res = await fetch('/api/members/signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role, email, phone }),
    })
    if (!res.ok) throw new Error(`/api/members/signature answered ${res.status}`)
    return true
  } catch (err) {
    console.error(err)
    return false
  }
}

export default function SignatureGenerator({ copy, links, defaultEmail, photo, saved, savesSignature }) {
  const [fields, setFields] = useState({ name: '', role: '', email: defaultEmail, phone: '', ...saved, photo })
  const [status, setStatus] = useState(null) // { message, isError } | null
  // defaultEmail is the signed-in account's address.
  const storageKey = signatureStorageKey(defaultEmail)

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
      setFields((current) => ({ ...current, ...Object.fromEntries(FIELDS.filter((key) => saved[key]).map((key) => [key, saved[key]])) }))
    } catch {
      // Unreadable or blocked storage only means the fields start empty.
    }
  }, [storageKey])

  const update = (key) => (e) => {
    const next = { ...fields, [key]: e.target.value }
    setFields(next)
    setStatus(null)
    try {
      localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(FIELDS.map((name) => [name, next[name]]))))
    } catch {
      // Storage only remembers the inputs between visits; the generator works without it.
    }
  }

  const preview = signatureHtml(fields, copy.signature, links, '')

  const handleCopy = (asRichText) => async () => {
    if (!isComplete(fields)) {
      setStatus({ message: copy.missing, isError: true })
      return
    }
    const html = signatureHtml(fields, copy.signature, links, LIVE_ORIGIN)
    // One line per table row for clients that only take the plain-text part.
    const plain = new DOMParser().parseFromString(html.replaceAll('</tr>', '</tr>\n'), 'text/html').body.textContent.trim()
    try {
      await writeClipboard(html, plain, asRichText).catch(() => copyViaSelection(html, asRichText))
    } catch (err) {
      console.error(err)
      setStatus({ message: copy.copyFailed, isError: true })
      return
    }
    const copied = asRichText ? copy.copied : copy.copiedHtml
    // Stored after copying: awaiting the request first would end the click's permission to write the clipboard.
    if (savesSignature && !(await saveSignature(fields))) {
      setStatus({ message: `${copied} ${copy.notSaved}`, isError: true })
      return
    }
    setStatus({ message: copied, isError: false })
  }

  const field = (key, type, autoComplete, optional = false) => (
    <div className="field">
      <label htmlFor={`signature-${key}`} className="field-label">
        {copy.labels[key]}
        {optional && <span className="text-fg-subtle"> {copy.optional}</span>}
      </label>
      <input
        id={`signature-${key}`}
        type={type}
        value={fields[key]}
        onChange={update(key)}
        placeholder={copy.placeholders[key]}
        autoComplete={autoComplete}
        required={!optional}
        className="input"
      />
    </div>
  )

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-8">
      <form className="form rounded-card border border-border bg-bg p-5 sm:p-6" onSubmit={(e) => e.preventDefault()}>
        <div>
          <h2 className="text-lg font-semibold">{copy.formHeading}</h2>
          <p className="text-sm text-fg-subtle">{copy.formNote}</p>
        </div>
        {field('name', 'text', 'name')}
        {field('role', 'text', 'organization-title')}
        {field('email', 'email', 'email')}
        {field('phone', 'tel', 'tel', true)}
        <PhotoCropper
          copy={copy.photo}
          optional={copy.optional}
          photo={fields.photo}
          onChange={(path) => setFields((current) => ({ ...current, photo: path }))}
        />
      </form>

      {/* Sticky on wide screens, so the preview stays in view while the form is filled in. */}
      <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-28">
        <figure className="overflow-hidden rounded-card border border-border bg-bg">
          <figcaption className="flex items-center gap-3 border-b border-border px-4 py-3 text-sm font-medium text-fg-muted">
            <span aria-hidden="true" className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
            </span>
            {copy.previewLabel}
          </figcaption>
          <div className="bg-white text-[#1a1a1a]" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 14 }}>
            <div className="border-b border-[#e6e6e6] px-6 py-3 text-[13px] leading-6 text-[#6b6b6b]">
              <p>{copy.sampleTo}</p>
              <p>{copy.sampleSubject}</p>
            </div>
            <div className="overflow-x-auto p-6">
              {copy.sampleMail.map((paragraph) => (
                <p key={paragraph} className="mb-4">
                  {paragraph}
                </p>
              ))}
              {/* signatureHtml escapes every input and allows only uploaded photo paths (emailSignature.test.ts). */}
              <div dangerouslySetInnerHTML={{ __html: preview }} />
            </div>
          </div>
        </figure>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={`${PRIMARY_BUTTON} h-11 px-4`} onClick={handleCopy(true)}>
            <Copy aria-hidden="true" className="h-4 w-4" />
            {copy.copy}
          </button>
          <button type="button" className={`${TOOL_BUTTON} h-11`} onClick={handleCopy(false)}>
            <Code aria-hidden="true" className="h-4 w-4" />
            {copy.copyHtml}
          </button>
          <div aria-live="polite" className="min-w-0 basis-full sm:basis-auto">
            {status && (
              <p className={`flex items-center gap-1.5 ${status.isError ? 'form-error' : 'form-success'}`}>
                {status.isError ? (
                  <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
                ) : (
                  <Check aria-hidden="true" className="h-4 w-4 shrink-0" />
                )}
                {status.message}
              </p>
            )}
          </div>
        </div>
        {savesSignature && (
          <p className="flex gap-3 rounded-lg border border-border bg-bg-subtle px-4 py-3 text-sm text-fg-muted">
            <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            {copy.savesHint}
          </p>
        )}
      </div>
    </div>
  )
}
