import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GENERAL_MAX, parseStorageFolders, storedFolders } from './storageFolders.ts'

const SITE = 'https://leuphanalg.sharepoint.com/sites/IGNITE_zg0pjl'
const folder = (name: string) => `${SITE}/Shared%20Documents/${name}`

test('storedFolders fills what admins have not entered yet', () => {
  assert.deepEqual(storedFolders(undefined), {
    root: '',
    teams: { 'ignite-relations': '', 'ignite-marketing': '', 'ignite-hr': '', 'ignite-finance-legal': '', 'ignite-infrastructure': '' },
    general: [],
  })
  const partial = storedFolders({ root: SITE, teams: { 'ignite-marketing': folder('100') } as never })
  assert.equal(partial.root, SITE)
  assert.equal(partial.teams['ignite-marketing'], folder('100'))
  assert.equal(partial.teams['ignite-hr'], '')
})

test('parseStorageFolders takes SharePoint links for the whole site, each team and named folders for everyone', () => {
  const parsed = parseStorageFolders({
    root: ` ${SITE} `,
    teams: { 'ignite-marketing': folder('100'), 'ignite-hr': '' },
    general: [{ name: ' Ankündigungen ', url: folder('000') }],
  })
  assert.deepEqual(parsed, {
    root: SITE,
    teams: { ...storedFolders(undefined).teams, 'ignite-marketing': folder('100') },
    general: [{ name: 'Ankündigungen', url: folder('000') }],
  })
})

test('parseStorageFolders refuses foreign links, unknown teams, unnamed folders and long lists', () => {
  const many = Array.from({ length: GENERAL_MAX + 1 }, (_, index) => ({ name: `Ordner ${index}`, url: folder(String(index)) }))
  for (const bad of [
    null,
    [],
    { root: 'https://example.com' },
    { teams: { 'ignite-podcast': folder('1') } },
    { teams: { 'ignite-hr': 'https://example.com' } },
    { general: [{ name: '', url: folder('1') }] },
    { general: [{ name: 'Ohne Link', url: '' }] },
    { general: [{ name: 'x'.repeat(61), url: folder('1') }] },
    { general: many },
    { general: 'Ankündigungen' },
    { extra: true },
  ]) {
    assert.equal(parseStorageFolders(bad), null, JSON.stringify(bad))
  }
})
