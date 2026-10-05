/** Tailwind maps utilities onto the semantic tokens in src/styles/global.css. */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--color-bg)',
          subtle: 'var(--color-bg-subtle)',
          inverted: 'var(--color-bg-inverted)',
        },
        fg: {
          DEFAULT: 'var(--color-fg)',
          muted: 'var(--color-fg-muted)',
          subtle: 'var(--color-fg-subtle)',
          inverted: 'var(--color-fg-inverted)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          fg: 'var(--color-primary-fg)',
        },
        card: 'var(--color-card)',
        logo: 'var(--color-logo)',
        brand: {
          deep: 'var(--color-brand-deep)',
          bright: 'var(--color-brand-bright)',
          secondary: 'var(--color-brand-secondary)',
        },
        accent: 'var(--color-accent-text)',
        emphasis: 'var(--color-emphasis)',
        focus: 'var(--color-focus)',
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        sans: 'var(--font-sans)',
        accent: 'var(--font-accent)',
      },
      fontSize: {
        sm: ['var(--text-sm)', { lineHeight: '1.5' }],
        base: ['var(--text-base)', { lineHeight: 'var(--leading-body)' }],
        lead: ['var(--text-lead)', { lineHeight: '1.4' }],
        faq: ['var(--text-faq)', { lineHeight: '1.2' }],
        xl: ['var(--text-xl)', { lineHeight: '1.2' }],
        'display-sm': ['var(--text-display-sm)', { lineHeight: 'var(--leading-display)' }],
        'display-md': ['var(--text-display-md)', { lineHeight: 'var(--leading-display)' }],
        hero: ['var(--text-hero)', { lineHeight: '1.05' }],
        'display-lg': ['var(--text-display-lg)', { lineHeight: '1.05' }],
        wordmark: ['var(--text-wordmark)', { lineHeight: '0.8' }],
      },
      spacing: {
        'section-sm': 'var(--space-section-sm)',
        'section-md': 'var(--space-section-md)',
        'section-lg': 'var(--space-section-lg)',
        gutter: 'var(--space-gutter)',
        header: 'var(--header-height)',
      },
      maxWidth: {
        prose: 'var(--container-text)',
        text: 'var(--container-text)',
        wide: 'var(--container-wide)',
      },
      borderRadius: {
        card: 'var(--radius-card)',
        button: 'var(--radius-button)',
      },
      letterSpacing: {
        display: 'var(--tracking-display)',
      },
    },
  },
  plugins: [],
}
