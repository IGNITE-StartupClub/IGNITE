/**
 * Files of the brand kit on the members area's branding page (MemberBrandingPage.astro). They live in public/brand
 * and are public on purpose, like the email badge: logos are meant to be passed on. Names and texts per language
 * are in memberArea.branding (staticContent.ts + .en), keyed by id.
 * The files come from the IGNITE Figma file. The logo PNGs share one transparent source, recoloured, so all three
 * have the same shape and clear space as the SVGs.
 */
import type { memberArea } from './staticContent'

export type BrandAssetId = keyof (typeof memberArea)['branding']['assets'] & string

export interface BrandAsset {
  id: BrandAssetId
  /** Background of the preview tile: the logo colour decides whether it needs a light or a dark one. */
  tone: 'light' | 'dark'
  /** Shown on the page; SVG where there is one, because it is the smallest file. */
  preview: string
  files: { format: 'SVG' | 'PNG' | 'JPG'; file: string; detail?: string }[]
}

const svgAndPng = (id: BrandAssetId, tone: BrandAsset['tone'], pngDetail: string): BrandAsset => ({
  id,
  tone,
  preview: `ignite-${id}.svg`,
  files: [
    { format: 'SVG', file: `ignite-${id}.svg` },
    { format: 'PNG', file: `ignite-${id}.png`, detail: pngDetail },
  ],
})

const png = (id: BrandAssetId, tone: BrandAsset['tone'], detail: string): BrandAsset => ({
  id,
  tone,
  preview: `ignite-${id}.png`,
  files: [{ format: 'PNG', file: `ignite-${id}.png`, detail }],
})

export const BRAND_PATH = '/brand/'

export const brandGroups: { id: 'logo' | 'mark' | 'social' | 'teams'; assets: BrandAsset[] }[] = [
  {
    id: 'logo',
    assets: [
      svgAndPng('logo-purple', 'light', '2400 px'),
      svgAndPng('logo-black', 'light', '2400 px'),
      svgAndPng('logo-white', 'dark', '2400 px'),
    ],
  },
  {
    id: 'mark',
    assets: [
      svgAndPng('mark-purple', 'light', '1024 px'),
      svgAndPng('mark-gradient', 'light', '1024 px'),
      svgAndPng('mark-black', 'light', '1024 px'),
      svgAndPng('mark-white', 'dark', '1024 px'),
    ],
  },
  {
    id: 'social',
    assets: [
      png('app-icon', 'light', '512 px'),
      png('profile-space-dark', 'dark', '768 px'),
      png('profile-space-light', 'light', '773 px'),
      {
        id: 'linkedin-banner',
        tone: 'dark',
        preview: 'ignite-linkedin-banner.jpg',
        files: [{ format: 'JPG', file: 'ignite-linkedin-banner.jpg', detail: '2670 × 417 px' }],
      },
    ],
  },
  {
    id: 'teams',
    assets: (
      [
        'team-board',
        'team-community',
        'team-events',
        'team-events-alt',
        'team-finance',
        'team-marketing',
        'team-message',
        'team-organisation',
        'team-podcast',
        'team-relations',
      ] as const
    ).map((id) => png(id, 'light', '512 px')),
  },
]
