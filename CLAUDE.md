# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at localhost:4321
npm run build      # Build for production
npm run preview    # Preview the production build
```

No test suite is configured. There is no lint script — ESLint and Prettier are configured but must be run manually (`npx eslint .` / `npx prettier --write .`).

## Architecture

This is an **Astro 5 site** with **server-side rendering** (output: 'server') deployed to **Vercel**. It uses React for interactive components, Tailwind CSS + SCSS for styling, and MDX for content pages.

### Key architectural layers

**Content (`src/data/`)** — All static, editable website content lives here, not in components:
- `staticContent.ts` — Hero text, FAQs, Features, Navigation, Footer, and global config
- `teamsData.ts` — Team member data (name, position, photo, bio)
- `eventsData.ts` / `questionnaireConfig.ts` / `kpiData.ts` — Domain-specific data

**Email Templates (`src/templates/emails/`)** — HTML email templates are fully separated from API logic. Each file exports a subject function and an HTML function. Edit email copy here, not in API routes.

**API Routes (`src/pages/api/`)** — Server endpoints that handle:
- `submit.ts` — Membership application form: validates input, encrypts all fields with AES-256-GCM, stores encrypted data in **MongoDB**, sends emails via **Resend**, optionally triggers newsletter double opt-in
- `contact.ts` — Contact form, sends emails via Resend
- `subscribe.ts` / `confirm.ts` / `unsubscribe.ts` — Newsletter double opt-in flow using MongoDB `pending_confirmations` collection
- `feedback.ts` — Feedback form

**Content Collections (`src/content/`)** — Markdown-based collections for `events` and `projects`, defined in `src/content.config.mjs`. New content files go in the respective subdirectories.

**Components** — `.astro` components for layout/structural UI; `.jsx` components (React) for interactive features (forms, search, 3D effects, animations). The `LiquidEther`, `Orb`, `SplitText`, and `stakeholder-map` subdirectories contain complex visual/interactive components.

**Layouts (`src/layouts/`)** — `DefaultLayout.astro` wraps all pages; provides SEO meta, fonts, Plausible analytics, and the global animated background dots.

### Path alias

`@` maps to `/src` (configured in `astro.config.mjs` and Vite).

### Required environment variables

The application will throw at startup if any of these are missing:

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Transactional emails (application, contact, confirmation) |
| `RESEND_HOLY_GRAIL` | Newsletter emails (separate Resend key) |
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB` | MongoDB database name |
| `ENCRYPTION_SECRET` | 32-byte hex key for AES-256-GCM encryption of applicant data |
| `EMAIL_RECIPIENT_1` | Primary admin email recipient |
| `EMAIL_RECIPIENT_2` | (Optional) Secondary admin email recipient |
| `AUDIENCE_ID` | Resend audience ID for contact management |
| `SITE_URL` | Public URL for generating confirmation links |

### Icon system

Icons use `astro-icon` with `@iconify-json/ion` and `@iconify-json/mdi` icon sets. Reference icons as e.g. `ion:diamond-outline` or `mdi:github`.

## Project rules

- **Language**: All UI text and content is German.
- **Dark theme**: The site uses a near-black background (`--dark-100: hsl(240, 4%, 9%)`). New UI should match this palette.
- **Component file type**: Use `.astro` for static/structural components and `.jsx`/`.tsx` for interactive React components that need `client:*` directives.
- **Content changes**: Edit copy in `src/data/staticContent.ts` (nav, footer, hero, FAQ, features) or `src/data/teamsData.ts` — not inside components.
- **Navigation items**: Managed in `src/data/staticContent.ts` under `navigation.menuItems` (supports nested `children` for dropdowns).
- **New content collection**: Add definition to `src/content.config.mjs`, create directory under `src/content/<name>/`, add `.md` files there.
- **Shadcn UI components**: Live in `src/components/ui/`. Use `@/lib/utils` for the `cn()` helper (already present at `src/lib/utils.ts`).
- **Self-updating rule**: After every session where something new is learned about this codebase, append it to this CLAUDE.md under "Project rules".
