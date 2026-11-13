import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  firstSteps,
  introSteps,
  isOnboardingMark,
  menuBadge,
  onboardingMarks,
  opensIntro,
  showsChecklist,
  showsSearchHint,
  startStep,
  withChange,
  type OnboardingState,
} from './onboarding.ts'

const fresh: OnboardingState = {
  marks: { intro: false, checklist: false, searchHint: false, searchTask: false },
  calendar: false,
  apps: [],
  mayConnect: true,
}

test('onboardingMarks turns the stored dates into flags', () => {
  assert.deepEqual(onboardingMarks(undefined), fresh.marks)
  assert.deepEqual(onboardingMarks({ introSeenAt: new Date(), searchTaskAt: new Date() }), {
    intro: true,
    checklist: false,
    searchHint: false,
    searchTask: true,
  })
  assert.equal(isOnboardingMark('intro'), true)
  assert.equal(isOnboardingMark('introSeenAt'), false)
  assert.equal(isOnboardingMark({ $set: 1 }), false)
})

test('firstSteps checks itself from the real state, in the order of the card', () => {
  assert.deepEqual(firstSteps(fresh), [
    { id: 'calendar', done: false },
    { id: 'search', done: false },
    { id: 'assistant', done: false },
  ])
  const done = { ...fresh, calendar: true, apps: ['claude'], marks: { ...fresh.marks, searchTask: true } }
  assert.deepEqual(
    firstSteps(done).map(({ done: finished }) => finished),
    [true, true, true],
  )
})

test('members who may not connect only get the search step', () => {
  const closed = { ...fresh, mayConnect: false, calendar: true }
  assert.deepEqual(firstSteps(closed), [{ id: 'search', done: false }])
  assert.deepEqual(introSteps(false), ['search', 'feedback'])
  assert.deepEqual(introSteps(true), ['search', 'calendar', 'assistant', 'feedback'])
})

test('the card and its badge show until hidden or done', () => {
  assert.equal(showsChecklist(fresh), true)
  assert.equal(menuBadge(fresh), 3)
  const oneDone = { ...fresh, calendar: true }
  assert.equal(menuBadge(oneDone), 2)
  const hidden = { ...fresh, marks: { ...fresh.marks, checklist: true } }
  assert.equal(showsChecklist(hidden), false)
  assert.equal(menuBadge(hidden), 0)
  const all = { ...fresh, calendar: true, apps: ['chatgpt'], marks: { ...fresh.marks, searchTask: true } }
  assert.equal(showsChecklist(all), false)
  assert.equal(menuBadge(all), 0)
})

test('the dialog opens until seen, the coach mark only after it', () => {
  assert.equal(opensIntro(fresh), true)
  assert.equal(showsSearchHint(fresh), false)
  const seen = withChange(fresh, { mark: 'intro' })
  assert.equal(opensIntro(seen), false)
  assert.equal(showsSearchHint(seen), true)
  assert.equal(showsSearchHint(withChange(seen, { mark: 'searchHint' })), false)
  assert.equal(showsSearchHint(withChange(seen, { mark: 'searchTask' })), false)
})

test('withChange keeps what the change does not name', () => {
  const changed = withChange(fresh, { calendar: true })
  assert.equal(changed.calendar, true)
  assert.deepEqual(changed.apps, [])
  assert.deepEqual(changed.marks, fresh.marks)
  assert.deepEqual(withChange(changed, { apps: ['claude'] }).apps, ['claude'])
  assert.equal(fresh.calendar, false)
})

test('the dialog opens at the first step still to do', () => {
  assert.equal(startStep(fresh), 'search')
  const searched = withChange(fresh, { mark: 'searchTask' })
  assert.equal(startStep(searched), 'calendar')
  assert.equal(startStep(withChange(searched, { calendar: true })), 'assistant')
  assert.equal(startStep(withChange(searched, { calendar: true, apps: ['claude'] })), 'search')
  assert.equal(startStep({ ...searched, mayConnect: false }), 'search')
})
