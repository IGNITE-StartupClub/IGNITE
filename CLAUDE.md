# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at localhost:4321
npm run build      # Build for production
npm run preview    # Preview the production build
npm test           # Unit tests (node --test, needs Node >= 22.18 for TypeScript)
```

Tests use Node's built-in runner on `src/**/*.test.ts`; only modules without extensionless local imports can be tested this way. There is no lint script — ESLint and Prettier are configured but must be run manually (`npx eslint .` / `npx prettier --write .`).

## Architecture

This is an **Astro 5 site** with **server-side rendering** (output: 'server') deployed to **Vercel**. It uses React for interactive components, Tailwind CSS + SCSS for styling, and MDX for content pages.

### Key architectural layers

**Content (`src/data/`)** — All static, editable website content lives here, not in components:
- `staticContent.ts` — Hero text, FAQs, Features, Navigation, Footer, and global config
- `teamsData.ts` — Team member data (name, position, photo, bio)
- `eventsData.ts` / `questionnaireConfig.ts` / `kpiData.ts` — Domain-specific data

**Email Templates (`src/templates/emails/`)** — HTML email templates are fully separated from API logic. Each file exports a subject function and an HTML function. Edit email copy here, not in API routes.

**API Routes (`src/pages/api/`)** — Server endpoints that handle:
- `submit.ts` — Membership application form: validates input, encrypts all fields with AES-256-GCM, stores encrypted data in **MongoDB**, sends the team notification and the applicant confirmation (which carries the WhatsApp link) via **Resend**
- `contact.ts` — Contact form, sends emails via Resend
- `community.ts` — Community signup (Community page and footer): validates the address, mails the WhatsApp invite link, no confirmation step. A Mongo TTL collection `community_invites` allows one invite per address and 24 hours (409 on repeat).
- `members/` — Members area: `login.ts` checks email and password and sets the session cookie, `code.ts` mails a one-time code to set a password, `password.ts` sets it with that code, `admin.ts` is the member management for admins, `logout.ts` ends the session
- `cron/` — Scheduled jobs from `vercel.json` (health check, database report, monthly applicants). Each starts with `rejectCron(request)` (`src/lib/cron.ts`), which answers 401 unless the request carries `Authorization: Bearer <CRON_SECRET>`; without `CRON_SECRET` every cron request is refused.

**Content Collections (`src/content/`)** — Markdown-based collections for `events` and `projects`, defined in `src/content.config.mjs`. New content files go in the respective subdirectories.

**Components** — `.astro` components for layout/structural UI; `.jsx` components (React) for interactive features (forms, search, 3D effects, animations). The `LiquidEther`, `Orb`, `SplitText`, and `stakeholder-map` subdirectories contain complex visual/interactive components.

**Layouts (`src/layouts/`)** — `DefaultLayout.astro` wraps all pages; provides SEO meta, fonts, Plausible analytics, and the global animated background dots.

### Path alias

`@` maps to `/src` (configured in `astro.config.mjs` and Vite).

### Required environment variables

The application will throw at startup if any of these are missing:

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | All emails: application, contact, community invite, reports |
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB` | MongoDB database name |
| `ENCRYPTION_SECRET` | 32-byte hex key for AES-256-GCM encryption of applicant data |
| `EMAIL_RECIPIENT_1` | Primary admin email recipient |
| `EMAIL_RECIPIENT_2` | (Optional) Secondary admin email recipient |
| `SITE_URL` | (Optional) Public URL, shown in the database report |
| `CRON_SECRET` | Secret Vercel sends to the cron jobs; without it they all answer 401 |

### Icon system

Icons use `astro-icon` with `@iconify-json/ion` and `@iconify-json/mdi` icon sets. Reference icons as e.g. `ion:diamond-outline` or `mdi:github`.

## Project rules

- **Language**: The site is bilingual. German is the default locale at the root URLs, English lives under `/en/` (Astro `i18n`, `prefixDefaultLocale: false`). Emails and API responses stay German.
- **Adding or changing copy**: Change the German text in `src/data/` and the English counterpart in the matching `*.en.ts` file in the same commit. `getCopy(Astro.currentLocale)` (`src/data/copy.ts`) returns the copy for the current locale; its `Copy` type flags English files that miss an export when you run `tsc`. React islands get their copy as props from the page, they do not import it.
- **Pages**: Each page is implemented once in `src/views/` and rendered by a thin German route in `src/pages/` and an English route in `src/pages/en/`. English slugs that differ (`join`, `contact`, `materials`, `imprint`, `privacy`, `workshops`) are listed in `src/lib/i18n.ts`. MDX pages (legal, workshops, peer-to-peer) exist once per language.
- **News articles**: German in `src/content/projects/`, English translation in `src/content/projects/en/` under the same file name (collection `projectsEn`). `getNews(locale)` in `src/lib/news.ts` reads both.
- **Language toggle**: `LanguageToggle.astro` sits next to `ThemeToggle` in the header and the mobile nav. `DefaultLayout` derives the target and the hreflang links from the URL; pass `alternatePath` when the counterpart has a different path (`null` = no counterpart).
- **Dark theme**: The site uses a near-black background (`--dark-100: hsl(240, 4%, 9%)`). New UI should match this palette.
- **Component file type**: Use `.astro` for static/structural components and `.jsx`/`.tsx` for interactive React components that need `client:*` directives.
- **Content changes**: Edit copy in `src/data/staticContent.ts` / `staticContent.en.ts` (nav, footer, hero, FAQ, features) or `src/data/teamsData.ts` — not inside components.
- **Navigation items**: Managed in `src/data/staticContent.ts` under `navigation.menuItems` (supports nested `children` for dropdowns).
- **New content collection**: Add definition to `src/content.config.mjs`, create directory under `src/content/<name>/`, add `.md` files there.
- **Shadcn UI components**: Live in `src/components/ui/`. Use `@/lib/utils` for the `cn()` helper (already present at `src/lib/utils.ts`).
- **Self-updating rule**: After every session where something new is learned about this codebase, append it to this CLAUDE.md under "Project rules".
- **Events outside Luma**: `/events` shows the upcoming and past events of the Luma calendar (`loadEvents(locale, period)`) in `src/lib/luma.ts`, each merged with hand-listed events from `src/data/externalEvents.ts` (English location in `externalEvents.en.ts`, keyed by id). External events link to their own `registerUrl` instead of the Luma embed and move to the past section after `endAt`.
- **Newsletter = WhatsApp**: There is no email newsletter, no double opt-in and no Resend audience. The WhatsApp community is the newsletter. Copy and emails must not promise email updates. The invite link lives once in `src/templates/emails/links.ts` (`WHATSAPP_INVITE_URL`) and is sent by the community invite mail and the application confirmation.
- **Sending mail from API routes**: The Resend SDK returns `{ error }` instead of throwing. Wrap every send in `assertSent()` (`src/lib/resend.ts`). API responses carry fixed German messages, never `error.message`.
- **Contact address**: `stud.initiative.ignite@leuphana.de` is the only current address. It lives in `globalConfig.contactEmail` (`src/data/staticContent.ts`), which the mail routes use as `replyTo`, because the sending domain `info.ignite-startupclub.de` does not receive mail.
- **Social links**: Instagram is `instagram.com/ignite.lueneburg`, LinkedIn is `linkedin.com/company/ignite-leuphana`. The website uses `socialLinks` in `src/data/staticContent.ts` (+ `.en.ts`), emails use `INSTAGRAM_URL` / `LINKEDIN_URL` in `src/templates/emails/links.ts`. Change both together.
- **Luma requests need a User-Agent**: `api.lu.ma` answers 429 to the default User-Agent of Node's `fetch` and curl. `src/lib/luma.ts` sends its own; keep it when changing the request.
- **Links in news articles**: Use Markdown links (`[Text](/mitmachen)`, English `[Text](/en/join)`). A `<link href>` tag renders as plain, unclickable text. Each article's URL is its lowercased file name (`OpenWeekly2026.md` → `/news/openweekly2026`), so a second article on the same topic needs its own file name and image. Covers are cut to 4:3 on the news cards and 16:9 on the article page, so pick a cover near 4:3; put wide group photos inside the text as `![alt](../../assets/optimized-sources/news/<file>)` (one `../` more from `en/`), which shows them uncropped and as WebP.
- **Members area**: `/mitglieder/` and `/en/members/` are only reachable with a session, except the login page. `src/middleware.ts` guards them, sets `Astro.locals.member` ({ email, role }) and lets only admins open admin pages; new member pages go below these paths with `prerender = false` and get their slug per language in `PAGES` (`src/lib/memberAuth.ts`). The login page is a page of its own (`DefaultLayout bare`: no header, footer or header padding), split into the deep purple `surface-brand` panel (purple in both themes, copy in `memberArea.login.panel`) and the `MemberLoginCard` island on the theme background: email plus password (scrypt hash over an HMAC of the password with a pepper derived from `ENCRYPTION_SECRET`, scheme `scrypt-hmac`, so a database dump alone allows no offline guessing; every attempt is reserved atomically in `reserveLoginAttempt` before the check, five failures lock the account for 15 minutes, one error message for every failure). A first or forgotten password is set with a 6-digit code from `/api/members/code`: valid 10 minutes, 5 entries, stored as an HMAC keyed from `ENCRYPTION_SECRET`, at most 5 codes per address and hour. `?reset` opens the card at the code request. Admins add members on `/mitglieder/verwaltung`, which mails an invitation without a token; every change goes to the `member_audit` collection. The first admin needs no database access: while no admin exists, `/api/members/code` makes an address on `INITIAL_ADMIN_HASHES` (`src/lib/initialAdmins.ts`, SHA-256 of the address because the repository is public) an admin before sending the code. With database access `node scripts/members.mjs add <email> --admin` does the same. Owners ("Hauptadmin", `OWNER_HASHES` in the same file, same hash format) are admins whom no other admin can demote or remove: `/api/members/admin` answers 409 `owner` with the neutral message "Diese Änderung ist nicht möglich." The admin page shows owners as plain admins with the usual actions, and the member summaries carry no owner flag, so neither the list nor the page data reveals who is protected. The local `.env` has no valid `RESEND_API_KEY`, so code mails fail locally; store a known code with a script instead. Sessions are stored only as SHA-256 hashes; setting a password or removing a member ends their sessions. Every endpoint under `/api/members/` needs a session (401 from the middleware) unless it is listed in `PUBLIC_API` (`memberAuth.ts`), so new endpoints, for example for internal contacts, are closed by default. All member pages and endpoints get no-store and anti-framing headers from the middleware. More than 30 failed logins per client address in 15 minutes block that client (`reserveClientAttempt`, addresses stored only as HMAC). `/api/members/code` answers no earlier than 1.5 s, so its timing does not reveal members. The JSON endpoints require `Content-Type: application/json`; Astro's `checkOrigin` only covers form posts and is not active in `astro dev`.
- **Header and ViewTransitions**: `ViewTransitions` (`SiteMeta.astro`) swaps the header on every navigation and module scripts run only once, so header scripts bind element listeners on `astro:page-load` (it also fires on the first load). The pill's hover state is the `data-hovered` attribute, not `:hover`: after a swap `:hover` only returns with the next pointer move, and during the transition the overlay is hit-tested instead of the page. `astro:before-swap` carries hover, highlight and scroll state into the new header.
- **Email signature**: Members build their opt-in Outlook signature on `/mitglieder/signatur` (`/en/members/signature`, `MemberSignaturePage.astro` + `SignatureGenerator.jsx`). The markup comes from `src/lib/emailSignature.ts` (tested): tables with inline styles only, every input escaped. The text inputs are kept as a draft in localStorage under `signatureStorageKey(account)`, one key per account, because members share browsers. Its tables carry `width:auto;table-layout:auto` and the photo `max-width:none` inline, because the site's reset (`table { width: 100%; table-layout: fixed }` in `_reset.scss`, Tailwind's `img { max-width: 100% }`) otherwise stretches the preview and splits photo and text in half. Mail clients do not show SVG, so the logo ships as `public/email/ignite-badge.png`, rendered from `Logo.astro` by `node scripts/email-signature-assets.mjs`. The badge stays public because recipients load it without a session. Copied signatures point images at `https://www.ignite-startupclub.de` (the apex domain redirects to `www`), so a new image only works in pasted signatures after the deploy.
- **Signature photo**: Members upload their photo in `PhotoCropper.jsx`: they move and zoom it in the browser, and only the cut 192 px square goes as a JPEG data URL to `POST /api/members/photo` (`decodePhoto` checks the JPEG markers and `PHOTO_MAX_BYTES`; `DELETE` removes it). Photos live in the `member_photos` collection (Mongo `Binary`), at most one per member. Every upload gets a new random id and deletes the old photo, so `/api/signature-photo/<id>` can be cached as immutable and a replaced photo answers 404. That route is public on purpose (recipients load it without a session) and sits outside `/api/members/`. `signatureHtml` only shows photos whose id passes `isPhotoId`, never external URLs. The admin list shows the same photo next to each member (`memberSummaries`, one query for all photos). Mail clients cannot be trusted with `object-fit`, which is why the crop happens before upload.
- **Invitations carry the inviter's signature**: When an admin copies their signature, `SignatureGenerator` stores the text fields via `POST /api/members/signature` (admins only, `parseSignature`) in `members.signature`; demoting an admin removes it. `sendInvite` always takes the signed-in admin who clicks (the `actor` in `admin.ts`), names them in the mail and closes it with their `signatureHtml` plus photo. Without a stored signature the mail names the admin's address and has no signature.
- **Members area mails**: Code and invitation mails use `renderMemberEmail` (`src/templates/emails/memberLayout.ts`), design A2 from Claude Design: white card with border and shadow on white, purple header with the badge (its background is the header's `#311763`), short footer. All other mails keep `renderEmail` in `layout.ts`. A media query cuts the card padding to 20 px below 480 px, otherwise the inviter's signature overflows on phones. The signature's separator ends in a plain space so its lines can wrap.
- **Header member link**: `MemberLink.astro` (person icon) sits left of the Mitmachen pill and in the mobile nav; Mitmachen stays outermost.
- **Dev server and build**: Running `npm run build` while `astro dev` is running left every React island failing with `jsxDEV is not a function` until the dev server was restarted.
- **Member table**: The admin page (`MemberAdmin.jsx`) is a table with search, role and status filter, CSV export, paging and an actions menu per row. Its pure logic (filter, status, times, CSV with formula escaping) lives in `src/lib/memberTable.ts` (tested). Dates print in `Europe/Berlin` and relative times use the `now` prop from the page, so server render and hydration show the same text. Menus use the browser's `popover` attribute (no Radix); the site's base styles give every `button` a border and padding, so ghost buttons need `border-0`. `recordLogin` stores `lastLoginAt` on each password login; members who logged in before it existed show "–".
