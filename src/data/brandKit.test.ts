import assert from 'node:assert/strict'
import { existsSync, statSync } from 'node:fs'
import { test } from 'node:test'
import { BRAND_PATH, brandGroups, teamIconPath, type TeamIcon } from './brandKit.ts'

const publicFile = (path: string) => new URL(`../../public${path}`, import.meta.url)

test('every preview and download of the brand kit exists in public/brand', () => {
  for (const { assets } of brandGroups) {
    for (const asset of assets) {
      for (const file of [asset.preview, ...asset.files.map(({ file }) => file)]) {
        assert.ok(existsSync(publicFile(BRAND_PATH + file)), `${asset.id}: ${file} is missing`)
      }
    }
  }
})

test('raster previews are the small WebP copies, not the downloads', () => {
  for (const { assets } of brandGroups) {
    for (const { id, preview, files } of assets) {
      if (preview.endsWith('.svg')) continue
      assert.match(preview, /^display\/.+\.webp$/, id)
      const download = files.find(({ format }) => format !== 'SVG')!
      assert.ok(
        statSync(publicFile(BRAND_PATH + preview)).size < statSync(publicFile(BRAND_PATH + download.file)).size,
        `${id}: preview is not smaller than its download`,
      )
    }
  }
})

test('team icons shown beside team names exist as display copies', () => {
  const icons: TeamIcon[] = ['board', 'community', 'finance', 'marketing', 'organisation', 'relations']
  for (const icon of icons) {
    const path = teamIconPath(icon)
    assert.equal(path, `/brand/display/ignite-team-${icon}.webp`)
    assert.ok(existsSync(publicFile(path)), `${path} is missing`)
  }
})
