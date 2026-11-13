/**
 * Window events between the member islands. The profile menu (Header.astro), the search (a persisted island), the start
 * page card (FirstStepsCard.jsx) and the help dialogs (HelpDialogs.jsx) live apart, so they talk through events instead
 * of props.
 */

/** Opens the website feedback. detail: { area?, text? }, without an area the dialog takes the current page's. */
export const FEEDBACK_EVENT = 'ignite:feedback'
/** Opens the search field with a text. detail: { text } */
export const SEARCH_EVENT = 'ignite:search'
/** Opens the onboarding dialog. detail: { step? } (an IntroStep of onboarding.ts), without one at startStep. */
export const ONBOARDING_EVENT = 'ignite:onboarding'
/** The member's onboarding changed on this page. detail: an OnboardingChange (onboarding.ts). */
export const ONBOARDING_CHANGE = 'ignite:onboarding-change'

export const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(name, { detail }))

/** Stores an onboarding mark on the account, then tells the other islands. Throws when the server refuses. */
export async function saveMark(mark) {
  const res = await fetch('/api/members/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mark }),
  })
  if (!res.ok) throw new Error(`Onboarding mark ${mark} not saved: ${res.status}`)
  emit(ONBOARDING_CHANGE, { mark })
}
