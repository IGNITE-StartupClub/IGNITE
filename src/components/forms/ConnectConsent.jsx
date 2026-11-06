/**
 * The two buttons of the consent page (MemberConnectPage.astro). Both answers go to the server, which checks the request
 * again and returns the address of the app to continue at.
 * Props: copy (memberArea.connections.consent), query (the authorization request as a query string).
 */
import React, { useState } from 'react'
import { PRIMARY_BUTTON, TOOL_BUTTON } from './memberUi'

export default function ConnectConsent({ copy, query }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const answer = async (action) => {
    setBusy(true)
    setFailed(false)
    try {
      const res = await fetch('/api/members/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, query }),
      })
      const data = await res.json()
      if (res.ok) return window.location.assign(data.redirect)
      console.error(data.message)
    } catch (err) {
      console.error(err)
    }
    setBusy(false)
    setFailed(true)
  }

  return (
    <>
      {failed && (
        <p role="alert" className="m-0 mt-4 text-sm text-danger">
          {copy.failed}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" className={TOOL_BUTTON} disabled={busy} onClick={() => answer('deny')}>
          {copy.deny}
        </button>
        <button type="button" className={PRIMARY_BUTTON} disabled={busy} onClick={() => answer('approve')}>
          {copy.approve}
        </button>
      </div>
    </>
  )
}
