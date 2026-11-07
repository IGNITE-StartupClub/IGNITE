// Renders the home screen icons of the installable app (public/apple-touch-icon.png, public/app-icons/).
// Design of the brand kit's app icon (public/brand/ignite-app-icon.png): white mark on the purple gradient,
// rocket and gradient showing through. The mark comes from public/favicon.svg, so a logo change there carries over.
// Run again after a logo change: node scripts/app-icons.mjs
import { mkdir, readFile } from 'node:fs/promises'
import sharp from 'sharp'

const markSource = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8')
const markPaths = [...markSource.matchAll(/<path d="([^"]+)"/g)].map((match) => match[1])
if (markPaths.length === 0) throw new Error('No <path> found in public/favicon.svg')
const markViewBox = markSource.match(/viewBox="([^"]+)"/)?.[1]
if (!markViewBox) throw new Error('No viewBox found in public/favicon.svg')

// Share of the icon the mark covers. 0.85 matches the brand kit's app icon. Maskable icons get cropped to a circle
// or squircle by Android, which only guarantees a centred circle of 80 % diameter, so the mark stays well inside it.
const FULL = 0.85
const MASKABLE = 0.66

function iconSvg(size, markShare) {
  const mark = size * markShare
  const offset = (size - mark) / 2
  // The gradient runs from the top right (bright) to the bottom left (deep), measured on the brand kit's app icon.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0.675" y1="-0.161" x2="0.325" y2="1.161">
      <stop stop-color="#6429D6"/>
      <stop offset="1" stop-color="#341570"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <svg x="${offset}" y="${offset}" width="${mark}" height="${mark}" viewBox="${markViewBox}">
    ${markPaths.map((d) => `<path d="${d}" fill="#ffffff"/>`).join('\n    ')}
  </svg>
</svg>`
}

const icons = [
  // iOS rounds the corners itself and shows transparency as black, so the touch icon is square and opaque.
  { file: '../public/apple-touch-icon.png', size: 180, markShare: FULL },
  { file: '../public/app-icons/icon-192.png', size: 192, markShare: FULL },
  { file: '../public/app-icons/icon-512.png', size: 512, markShare: FULL },
  { file: '../public/app-icons/maskable-192.png', size: 192, markShare: MASKABLE },
  { file: '../public/app-icons/maskable-512.png', size: 512, markShare: MASKABLE },
]

await mkdir(new URL('../public/app-icons/', import.meta.url), { recursive: true })
for (const { file, size, markShare } of icons) {
  const out = new URL(file, import.meta.url)
  await sharp(Buffer.from(iconSvg(size, markShare)))
    .flatten({ background: '#341570' })
    .png({ compressionLevel: 9 })
    .toFile(out.pathname)
  console.log(`Wrote ${out.pathname} (${size} px)`)
}
