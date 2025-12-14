# IGNITE Website Architecture

## Clean Architecture Overview

This document describes the clean architecture implemented after removing Strapi CMS. The codebase now follows a clear separation of concerns with content, templates, and logic in dedicated locations.

---

## Directory Structure

```
src/
├── data/                    # Static Content Layer (TASK 2)
│   ├── staticContent.ts     # Homepage, FAQ, Features, Navigation, Footer
│   ├── teamsData.ts         # Team members data
│   ├── questionnaireConfig.ts
│   └── ...
│
├── templates/               # Template Layer (TASK 1)
│   └── emails/              # Email HTML Templates
│       ├── contactFormEmail.ts
│       ├── contactConfirmationEmail.ts
│       ├── subscriptionConfirmationEmail.ts
│       ├── applicationEmail.ts
│       ├── applicationConfirmationEmail.ts
│       └── errorReportEmail.ts
│
├── pages/
│   └── api/                 # Business Logic (uses templates)
│       ├── contact.ts       # Contact form handler
│       ├── subscribe.ts     # Newsletter subscription
│       └── submit.ts        # Application form handler
│
└── components/              # UI Components (use data)
    ├── Hero.astro
    ├── Feature.astro
    └── ...
```

---

## TASK 1: Email Templates (✅ COMPLETED)

### Location: `src/templates/emails/`

All email HTML is now separated from business logic. Each template exports:
- **Subject function**: Returns the email subject line
- **HTML function**: Returns the email body HTML

### Available Templates:

1. **contactFormEmail.ts**
   - `getContactFormSubject(isAdvisoryBoard)`
   - `getContactFormEmailHTML(data: ContactFormData)`

2. **contactConfirmationEmail.ts**
   - `getContactConfirmationSubject(isAdvisoryBoard)`
   - `getContactConfirmationEmailHTML(name, isAdvisoryBoard)`

3. **subscriptionConfirmationEmail.ts**
   - `getSubscriptionConfirmationSubject()`
   - `getSubscriptionConfirmationEmailHTML(firstName, confirmUrl)`

4. **applicationEmail.ts**
   - `getApplicationEmailSubject()`
   - `getApplicationEmailHTML(data, questionLabels)`

5. **applicationConfirmationEmail.ts**
   - `getApplicationConfirmationSubject()`
   - `getApplicationConfirmationEmailHTML(name)`

6. **errorReportEmail.ts**
   - `getErrorReportSubject()`
   - `getErrorReportEmailHTML(errorMessage, context?)`

### How to Edit Email Content

To change email wording or design:

1. Navigate to `src/templates/emails/`
2. Open the relevant template file
3. Edit the HTML or text directly
4. No need to touch API routes or business logic

**Example:**

```typescript
// src/templates/emails/contactConfirmationEmail.ts
export function getContactConfirmationEmailHTML(name?: string) {
  return `
    <div style="...">
      <h2>Thanks for contacting us!</h2>  // ← Edit text here
      <p>Hello ${name}, we'll be in touch soon.</p>
    </div>
  `;
}
```

---

## TASK 2: Static Content Centralization (✅ COMPLETED)

### Location: `src/data/staticContent.ts`

All changeable website content is centralized in data files. No more hunting through Astro components!

### Available Data Structures:

#### **Features** (`features[]`)
- Workshop descriptions
- Service offerings
- Product features

```typescript
export const features = [
  {
    id: 1,
    icon: 'ion:diamond-outline',
    title: 'Workshops & Events',
    description: 'Wir lernen gemeinsam...',
    order: 1
  },
  // ... add or edit features here
];
```

#### **FAQs** (`faqs[]`)
```typescript
export const faqs = [
  {
    id: 1,
    question: 'Was ist IGNITE?',
    answer: '<p>Wir sind...</p>',
    openByDefault: true,
    order: 1
  },
  // ... add or edit FAQs here
];
```

#### **Homepage Content** (`homepage`)
```typescript
export const homepage = {
  heroTitle: 'IGNITE',
  heroSubtitle: 'Dein Gründungsfunken...',
  heroDescription: 'Gründer*innen-Community...',
  heroCTA_Text: 'Mitmachen',
  heroCTA_URL: '/mitmachen',
  // ... edit hero content here
};
```

#### **Navigation** (`navigation`)
```typescript
export const navigation = {
  logoText: 'IGNITE',
  menuItems: [
    { label: 'Startseite', url: '/', order: 1 },
    // ... add or edit menu items here
  ]
};
```

#### **Footer** (`footer`)
```typescript
export const footer = {
  description: 'Startup Initiative an der Leuphana...',
  socialLinks: [
    { platform: 'Instagram', url: '...', icon: '...', order: 1 },
    // ... edit social links here
  ],
  legalLinks: [
    { label: 'Impressum', url: '/impressum', order: 1 },
    // ... edit footer links here
  ]
};
```

#### **Global Config** (`globalConfig`)
```typescript
export const globalConfig = {
  siteName: 'IGNITE Startup Club Lüneburg',
  siteTagline: 'Deine Gründer*innen-Community',
  contactEmail: 'info@ignite-startupclub.de',
  // ... edit global settings here
};
```

### Team Members

**Location:** `src/data/teamsData.ts`

```typescript
export const teamsData: Team[] = [
  {
    name: 'IGNITE Vorstand',
    description: 'Das Team für...',
    members: [
      {
        name: 'Linus Heidemann',
        position: ['Präsident', 'Relations'],
        photo: '/team/linus.jpg',
        description: 'Linus wurde...',
        // ... edit team member info here
      }
    ]
  }
];
```

---

## TASK 3: Cleanup (✅ COMPLETED)

### Removed:
- ✅ `_strapi-content-types/` directory
- ✅ `src/components/AdvisoryBoardStrapi.jsx`
- ✅ `src/components/PartnersStrapi.astro`
- ✅ `src/lib/strapi/` directory
- ✅ `scripts/migrate-to-strapi.js`
- ✅ `scripts/migrate-team-positions.js`
- ✅ `scripts/export-job-positions.js`
- ✅ `scripts/import-team-positions.js`

---

## How to Make Changes

### To Change Email Templates:
1. Go to `src/templates/emails/`
2. Find the relevant template file
3. Edit the HTML/text directly
4. Rebuild: `npm run build`

### To Change Static Content:
1. Go to `src/data/staticContent.ts`
2. Find the section you want to edit (FAQ, Features, Hero, etc.)
3. Edit the text/URLs/configuration
4. Rebuild: `npm run build`

### To Change Team Members:
1. Go to `src/data/teamsData.ts`
2. Add/edit/remove team members from the array
3. Rebuild: `npm run build`

---

## Benefits of This Architecture

✅ **Separation of Concerns**: Content, templates, and logic are cleanly separated

✅ **Easy Updates**: Change content without touching component logic

✅ **Type Safety**: TypeScript interfaces ensure data consistency

✅ **No CMS Overhead**: Fast, static builds without external dependencies

✅ **Version Controlled**: All content changes are tracked in Git

✅ **Developer Friendly**: Clear structure makes onboarding easy

---

## Build & Deploy

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

All tests passing ✅ Build successful ✅
