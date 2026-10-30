/**
 * Email signature generator (React island, members area). Builds the signature from the member's input, shows it in
 * a sample mail and copies it as rich text for pasting into Outlook, or as raw HTML.
 * Props: copy (memberArea.signature.generator in the page language), links (social links shown in the signature),
 * defaultEmail (the signed-in member's address, prefilled), photo (path of the member's stored photo or '').
 * Text inputs are remembered in localStorage per browser; the photo lives on the server (PhotoCropper).
 * Styles: ./forms.css plus Tailwind utilities.
 */
import React, { useEffect, useState } from 'react'
import { isComplete, LIVE_ORIGIN, signatureHtml } from '../../lib/emailSignature'
import PhotoCropper from './PhotoCropper.jsx'
import './forms.css'

const STORAGE_KEY = 'ignite-signature'
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

export default function SignatureGenerator({ copy, links, defaultEmail, photo }) {
  const [fields, setFields] = useState({ name: '', role: '', email: defaultEmail, phone: '', photo })
  const [status, setStatus] = useState(null) // { message, isError } | null

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      setFields((current) => ({ ...current, ...Object.fromEntries(FIELDS.filter((key) => saved[key]).map((key) => [key, saved[key]])) }))
    } catch {
      // Unreadable or blocked storage only means the fields start empty.
    }
  }, [])

  const update = (key) => (e) => {
    const next = { ...fields, [key]: e.target.value }
    setFields(next)
    setStatus(null)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(FIELDS.map((name) => [name, next[name]]))))
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
      setStatus({ message: asRichText ? copy.copied : copy.copiedHtml, isError: false })
    } catch (err) {
      console.error(err)
      setStatus({ message: copy.copyFailed, isError: true })
    }
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
    <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <form className="form" onSubmit={(e) => e.preventDefault()}>
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

      <div className="flex min-w-0 flex-col gap-6">
        <div className="overflow-x-auto rounded-xl bg-white p-6 text-[#1a1a1a]" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 14 }}>
          {copy.sampleMail.map((paragraph) => (
            <p key={paragraph} className="mb-4">
              {paragraph}
            </p>
          ))}
          {/* signatureHtml escapes every input and allows only uploaded photo paths (emailSignature.test.ts). */}
          <div dangerouslySetInnerHTML={{ __html: preview }} />
        </div>
        <div className="form-actions items-center">
          <button type="button" className="form-submit" onClick={handleCopy(true)}>
            {copy.copy}
          </button>
          <button type="button" className="form-secondary" onClick={handleCopy(false)}>
            {copy.copyHtml}
          </button>
        </div>
        <div aria-live="polite">
          {status && <p className={status.isError ? 'form-error' : 'form-success'}>{status.message}</p>}
        </div>
      </div>
    </div>
  )
}
