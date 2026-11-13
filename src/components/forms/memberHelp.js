/**
 * Window events between the member islands. The profile menu (Header.astro), the search (a persisted island) and the
 * help dialogs (HelpDialogs.jsx) live apart, so they talk through events instead of props.
 */

/** Opens the website feedback. detail: { area?, text? }, without an area the dialog takes the current page's. */
export const FEEDBACK_EVENT = 'ignite:feedback'

export const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(name, { detail }))
