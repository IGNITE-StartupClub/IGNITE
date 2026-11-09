// Renders the small WebP images the members area shows in place of the brand kit's downloads (public/brand/display/).
// The downloads stay full size (team icons 512 px, 36-49 KB each), but the pages show them at 42-52 px or in a
// preview tile of at most about 400 x 200 CSS px, so each page loaded several times the bytes it displayed.
// Run again after a brand file changes: node scripts/brand-display-assets.mjs
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'
import { brandGroups, DISPLAY_DIR } from '../src/data/brandKit.ts'

const brandDir = new URL('../public/brand/', import.meta.url)
const outDir = new URL(`${DISPLAY_DIR}/`, brandDir)
await mkdir(outDir, { recursive: true })

// Team icons: 52 px at most beside a name, about 100 px in the brand kit's five-column grid, so 192 px stays sharp on
// high-DPI screens. Everything else fits a preview tile at twice its size.
const TEAM_ICON = { width: 192, height: 192 }
const PREVIEW = { width: 800, height: 400 }

for (const { id, assets } of brandGroups) {
  for (const asset of assets) {
    if (!asset.preview.startsWith(`${DISPLAY_DIR}/`)) continue
    const source = asset.files.find(({ format }) => format !== 'SVG')
    if (!source) throw new Error(`${asset.id}: no PNG or JPG to render a preview from`)
    const box = id === 'teams' ? TEAM_ICON : PREVIEW
    const target = new URL(asset.preview, brandDir)
    const info = await sharp(new URL(source.file, brandDir).pathname)
      .resize({ ...box, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 88, alphaQuality: 100, effort: 6 })
      .toFile(target.pathname)
    console.log(`${asset.preview}: ${info.width} x ${info.height}, ${info.size} B`)
  }
}

