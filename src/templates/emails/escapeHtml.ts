// Escapes untrusted text (form input, error messages) before it is interpolated into email HTML,
// so it cannot inject markup or links.
const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => entities[char])
