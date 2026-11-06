/**
 * Keeps an island current within Vercel's limits, see src/lib/liveUpdates.ts. `refresh` runs at most every REFRESH_MS,
 * and only while the page is visible and someone uses it; moving the pointer or coming back to the tab asks at once if
 * the last check is old enough. It returns false when the session ended, which stops the checks for good.
 */
import { useEffect, useRef } from 'react'
import { REFRESH_MS, refreshDue } from '../../lib/liveUpdates'

// Compares clocks only, so ticking more often than REFRESH_MS sends no extra requests.
const TICK_MS = 5_000
const USE_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart']

export function useLiveRefresh(refresh) {
  const latest = useRef(refresh)
  latest.current = refresh

  useEffect(() => {
    // The page just brought fresh data.
    let lastCheck = Date.now()
    let lastUse = lastCheck
    let stopped = false
    const check = async () => {
      const now = Date.now()
      if (stopped || !refreshDue({ now, lastCheck, lastUse, hidden: document.hidden })) return
      lastCheck = now
      try {
        stopped = (await latest.current()) === false
      } catch (err) {
        console.error(err)
      }
    }
    const used = () => {
      lastUse = Date.now()
      check()
    }
    const timer = setInterval(check, TICK_MS)
    for (const type of USE_EVENTS) window.addEventListener(type, used, { passive: true })
    document.addEventListener('visibilitychange', used)
    return () => {
      clearInterval(timer)
      for (const type of USE_EVENTS) window.removeEventListener(type, used)
      document.removeEventListener('visibilitychange', used)
    }
  }, [])
}

/** The answer to an island's regular check, null when the session ended. */
export async function fetchNews(path, revision) {
  const res = await fetch(`${path}?revision=${encodeURIComponent(revision)}`)
  if (res.status === 401) return null
  if (!res.ok) throw new Error(`Refresh of ${path} failed with ${res.status}`)
  return res.json()
}
