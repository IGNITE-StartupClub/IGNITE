import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveGuide } from './memberGuide.ts'

const base = '/mitglieder/guide'
const materials = Array.from({ length: 11 }, (_, index) => ({ id: `guide-${index + 1}` }))

test('the root and page numbers are list pages', () => {
  const first = resolveGuide('', materials, base)
  assert.equal(first?.kind, 'list')
  if (first?.kind !== 'list') return
  assert.equal(first.page.data.length, 9)
  assert.deepEqual(first.page.url, {
    current: base,
    prev: undefined,
    next: `${base}/2`,
    first: undefined,
    last: `${base}/2`,
  })

  const second = resolveGuide('2', materials, base)
  assert.equal(second?.kind === 'list' && second.page.data.map((item) => item.id).join(), 'guide-10,guide-11')
  assert.equal(second?.kind === 'list' && second.page.url.prev, base)
})

test('an empty guide still has its first page', () => {
  const empty = resolveGuide(undefined, [], base)
  assert.equal(empty?.kind === 'list' && empty.page.total, 0)
})

test('other segments are materials; unknown ids and pages are null', () => {
  assert.deepEqual(resolveGuide('guide-3', materials, base), { kind: 'material', material: { id: 'guide-3' } })
  assert.equal(resolveGuide('missing', materials, base), null)
  assert.equal(resolveGuide('3', materials, base), null)
  assert.equal(resolveGuide('1', materials, base), null)
  assert.equal(resolveGuide('0', materials, base), null)
})
