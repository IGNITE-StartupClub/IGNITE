/**
 * Rules of the onboarding: what the member has seen or done, which first steps are open, and what the start page card,
 * the profile menu, the dialog and the coach mark at the search show. The marks live on the member document
 * (`onboarding`), never in the browser, because members share browsers and use several devices. Calendar and assistant
 * come from the member's calendar link and app connections. No extensionless imports, so node --test loads it; the
 * islands import it too.
 */

export const ONBOARDING_MARKS = ['intro', 'checklist', 'searchHint', 'searchTask', 'tasksTour'] as const
export type OnboardingMark = (typeof ONBOARDING_MARKS)[number]
export const isOnboardingMark = (value: unknown): value is OnboardingMark =>
  ONBOARDING_MARKS.includes(value as OnboardingMark)

/** The field of `members.onboarding` each mark sets, once, to the time it first happened. */
export const MARK_FIELDS = {
  intro: 'introSeenAt',
  checklist: 'checklistHiddenAt',
  searchHint: 'searchHintSeenAt',
  searchTask: 'searchTaskAt',
  tasksTour: 'tasksTourSeenAt',
} as const satisfies Record<OnboardingMark, string>

export type OnboardingDates = Partial<Record<(typeof MARK_FIELDS)[OnboardingMark], Date>>
export type OnboardingMarks = Record<OnboardingMark, boolean>

export const onboardingMarks = (dates: OnboardingDates | undefined): OnboardingMarks =>
  Object.fromEntries(ONBOARDING_MARKS.map((mark) => [mark, !!dates?.[MARK_FIELDS[mark]]])) as OnboardingMarks

/** What the pages know of the member's onboarding, all from the session (findSession). */
export interface OnboardingState {
  marks: OnboardingMarks
  /** The member has a calendar link. Whether a calendar app fetches it, the server does not record. */
  calendar: boolean
  /** The apps connected through the connections (Claude, ChatGPT, local). */
  apps: string[]
  /** Calendar and assistant are open to this member (members.ts mayConnect). */
  mayConnect: boolean
}

export type FirstStepId = 'calendar' | 'search' | 'assistant'
export interface FirstStep {
  id: FirstStepId
  done: boolean
}

/** Whether a step is done, from real data: a calendar link exists, the search made a task, an app is connected. */
export function stepDone(state: OnboardingState, step: FirstStepId): boolean {
  if (step === 'calendar') return state.calendar
  if (step === 'search') return state.marks.searchTask
  return state.apps.length > 0
}

/** Calendar and assistant need the connections, so they only count for members who may connect. */
const needsConnect = (step: FirstStepId): boolean => step !== 'search'

/** The checklist of the start page card, in its order. */
export const firstSteps = (state: OnboardingState): FirstStep[] =>
  (['calendar', 'search', 'assistant'] as const)
    .filter((id) => state.mayConnect || !needsConnect(id))
    .map((id) => ({ id, done: stepDone(state, id) }))

export const openSteps = (steps: FirstStep[]): number => steps.filter(({ done }) => !done).length

/** The card shows until the member hides it or has done every step. */
export const showsChecklist = (state: OnboardingState): boolean =>
  !state.marks.checklist && openSteps(firstSteps(state)) > 0

/** The number on "Erste Schritte" in the profile menu: the open steps while the card shows, else none. */
export const menuBadge = (state: OnboardingState): number => (showsChecklist(state) ? openSteps(firstSteps(state)) : 0)

/** The dialog opens by itself on the start page until the member has seen it once. */
export const opensIntro = (state: OnboardingState): boolean => !state.marks.intro

/**
 * The coach mark at the search icon: once the dialog was seen, so the two do not meet on the first visit, and only
 * until the member dismisses it or has made a task through the search.
 */
export const showsSearchHint = (state: OnboardingState): boolean =>
  state.marks.intro && !state.marks.searchHint && !state.marks.searchTask

/** The speech bubbles on the overview of the tasks page show on the first visit; seen once is enough. */
export const showsTasksTour = (state: OnboardingState): boolean => !state.marks.tasksTour

export type IntroStep = FirstStepId | 'feedback'

/** The steps of the dialog; calendar and assistant only for members who may connect. */
export const introSteps = (mayConnect: boolean): IntroStep[] =>
  (['search', 'calendar', 'assistant', 'feedback'] as const).filter(
    (step) => step === 'feedback' || mayConnect || !needsConnect(step),
  )

/** Where the dialog opens without a step: at the first one still to do, else at the beginning. Feedback is never done. */
export const startStep = (state: OnboardingState): IntroStep =>
  introSteps(state.mayConnect).find((step) => step !== 'feedback' && !stepDone(state, step)) ?? 'search'

/** What a page saw change itself: a mark it saved, a calendar link it made or the apps it read again. */
export interface OnboardingChange {
  mark?: OnboardingMark
  calendar?: boolean
  apps?: string[]
}

/** The state after such a change, so card, badge and hint follow without a reload. */
export function withChange(state: OnboardingState, change: OnboardingChange): OnboardingState {
  return {
    ...state,
    marks: change.mark ? { ...state.marks, [change.mark]: true } : state.marks,
    calendar: change.calendar ?? state.calendar,
    apps: change.apps ?? state.apps,
  }
}
