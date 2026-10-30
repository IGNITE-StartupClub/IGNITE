// Renders the PNG images of the email signature (public/email/).
// Mail clients do not show SVG, so the logo has to ship as PNG.
// Run again after a logo change: node scripts/email-signature-assets.mjs
import { readFile, mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const BRAND_DEEP = '#311763'
const SCALE = 2 // rendered at 2x for sharp display on high-DPI screens

const logoSource = await readFile(new URL('../src/components/Logo.astro', import.meta.url), 'utf8')
const logoPaths = [...logoSource.matchAll(/<path d="([^"]+)"/g)].map((match) => match[1])
if (logoPaths.length === 0) throw new Error('No <path> found in src/components/Logo.astro')

// Display size of the badge in the signature, in CSS pixels.
const badge = { width: 152, height: 44, logoWidth: 120 }
const logoViewBox = { width: 1265, height: 321 }
const logoHeight = (badge.logoWidth * logoViewBox.height) / logoViewBox.width

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${badge.width * SCALE}" height="${badge.height * SCALE}" viewBox="0 0 ${badge.width} ${badge.height}">
  <rect width="${badge.width}" height="${badge.height}" rx="10" fill="${BRAND_DEEP}"/>
  <svg x="${(badge.width - badge.logoWidth) / 2}" y="${(badge.height - logoHeight) / 2}" width="${badge.logoWidth}" height="${logoHeight}" viewBox="0 0 ${logoViewBox.width} ${logoViewBox.height}">
    ${logoPaths.map((d) => `<path d="${d}" fill="#ffffff"/>`).join('\n    ')}
  </svg>
</svg>`

const outDir = new URL('../public/email/', import.meta.url)
await mkdir(outDir, { recursive: true })
const outFile = new URL('ignite-badge.png', outDir)
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outFile.pathname)
console.log(`Wrote ${outFile.pathname}`)
