/**
 * Member management for admins (React island). Posts { action, email, role?, locale } to /api/members/admin and
 * shows the member list the API returns after each action.
 * Props: copy (memberArea.admin.manager), initialMembers (memberSummary objects), currentEmail (the signed-in admin,
 * whose own row has no actions), locale ('de' | 'en'). Owners show as such and offer no role change or removal.
 * Styles: ./forms.css plus Tailwind utilities.
 */
import React, { useState } from 'react'
import './forms.css'

const ERROR_CODES = ['exists', 'unknown', 'self', 'owner', 'invalid', 'forbidden', 'error', 'mailFailed', 'addedMailFailed']

export default function MemberAdmin({ copy, initialMembers, currentEmail, locale }) {
  const [members, setMembers] = useState(initialMembers)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // result code from the API

  const run = async (body) => {
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/members/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, locale }),
      })
      const data = await res.json()
      if (data.members) setMembers(data.members)
      if (res.status >= 500) console.error(data.message)
      setResult(data.code in copy.results ? data.code : 'error')
      return res.ok
    } catch (err) {
      console.error(err)
      setResult('error')
      return false
    } finally {
      setBusy(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (await run({ action: 'add', email, role })) {
      setEmail('')
      setRole('member')
    }
  }

  const handleRemove = (address) => {
    if (window.confirm(copy.confirmRemove.replace('{email}', address))) run({ action: 'remove', email: address })
  }

  const statusOf = (member) => (member.locked ? 'locked' : member.hasPassword ? 'active' : 'invited')

  return (
    <div className="flex flex-col gap-12">
      <form onSubmit={handleAdd} className="form">
        <h2 className="text-display-sm">{copy.addHeading}</h2>
        <div className="form-row">
          <div className="field">
            <label htmlFor="admin-email" className="field-label">
              {copy.emailLabel}
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={copy.emailPlaceholder}
              className="input"
              disabled={busy}
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label htmlFor="admin-role" className="field-label">
              {copy.roleLabel}
            </label>
            <select id="admin-role" value={role} onChange={(e) => setRole(e.target.value)} className="input" disabled={busy}>
              <option value="member">{copy.roles.member}</option>
              <option value="admin">{copy.roles.admin}</option>
            </select>
          </div>
        </div>
        <button type="submit" className="form-submit" disabled={busy}>
          {busy ? copy.busy : copy.add}
        </button>
      </form>

      <div aria-live="polite">
        {result && <p className={ERROR_CODES.includes(result) ? 'form-error' : 'form-success'}>{copy.results[result]}</p>}
      </div>

      <section aria-labelledby="members-heading" className="flex flex-col gap-4">
        <h2 id="members-heading" className="text-display-sm">
          {copy.listHeading} ({members.length})
        </h2>
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {members.map((member) => (
            <li key={member.email} className="flex flex-col gap-3 py-4">
              <div className="min-w-0">
                <p className="break-words font-medium">
                  {member.email}
                  {member.email === currentEmail && <span className="text-fg-muted"> ({copy.you})</span>}
                </p>
                <p className="text-sm text-fg-muted">
                  {member.owner ? copy.owner : copy.roles[member.role]} · {copy.status[statusOf(member)]}
                </p>
              </div>
              {member.email !== currentEmail && (
                <div className="flex flex-wrap gap-2">
                  {!member.hasPassword && (
                    <button type="button" className="form-secondary" disabled={busy} onClick={() => run({ action: 'invite', email: member.email })}>
                      {copy.invite}
                    </button>
                  )}
                  {!member.owner && (
                    <>
                      <button
                        type="button"
                        className="form-secondary"
                        disabled={busy}
                        onClick={() => run({ action: 'role', email: member.email, role: member.role === 'admin' ? 'member' : 'admin' })}
                      >
                        {member.role === 'admin' ? copy.makeMember : copy.makeAdmin}
                      </button>
                      <button type="button" className="form-secondary" disabled={busy} onClick={() => handleRemove(member.email)}>
                        {copy.remove}
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
