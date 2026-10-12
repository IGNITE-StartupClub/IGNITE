// Shared layout for every transactional mail. Table based and inline styled, because mail clients ignore
// <style> blocks, flexbox and `margin: auto`. Callers pass already escaped HTML for `content`;
// field() and message() escape their input themselves.

import { escapeHtml } from './escapeHtml';
import { globalConfig } from '../../data/staticContent';

const BRAND = '#8C3974';
const FONT = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

export const paragraph = (html: string): string =>
  `<p style="margin: 0 0 16px 0; font: 400 16px/1.6 ${FONT}; color: #333333;">${html}</p>`;

export const link = (label: string, url: string): string =>
  `<a href="${escapeHtml(url)}" style="color: ${BRAND}; text-decoration: none; font-weight: 600;">${escapeHtml(label)}</a>`;

export const list = (itemsHtml: string[]): string =>
  `<ul style="margin: 0 0 16px 0; padding-left: 20px; font: 400 16px/1.7 ${FONT}; color: #333333;">${itemsHtml
    .map((item) => `<li>${item}</li>`)
    .join('')}</ul>`;

export const button = (label: string, url: string): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 24px auto;">
    <tr>
      <td bgcolor="${BRAND}" style="border-radius: 6px; background-color: ${BRAND};">
        <a href="${escapeHtml(url)}" style="display: inline-block; padding: 12px 24px; font: 600 16px/1.2 ${FONT}; color: #ffffff; text-decoration: none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;

// One labelled value per row, label above value, so long answers stay readable on a phone.
export const fieldHtml = (label: string, valueHtml: string): string => `
  <div style="padding: 12px 0; border-top: 1px solid #ececf0;">
    <div style="font: 600 12px/1.4 ${FONT}; color: #777777; text-transform: uppercase; letter-spacing: 0.04em;">${escapeHtml(label)}</div>
    <div style="margin-top: 4px; font: 400 16px/1.6 ${FONT}; color: #1a1a1a; white-space: pre-wrap; word-break: break-word;">${valueHtml}</div>
  </div>`;

export const field = (label: string, value: string): string => fieldHtml(label, escapeHtml(value));

export const note = (html: string): string =>
  `<p style="margin: 16px 0 0 0; padding-top: 16px; border-top: 1px solid #ececf0; font: 400 13px/1.5 ${FONT}; color: #777777;">${html}</p>`;

interface EmailOptions {
  title: string;
  preheader: string;
  contentHtml: string;
  // 'visitor' mails offer the contact address, 'team' mails say where they came from.
  audience: 'visitor' | 'team';
}

export function renderEmail({ title, preheader, contentHtml, audience }: EmailOptions): string {
  const footer =
    audience === 'visitor'
      ? `IGNITE Startup Club Lüneburg · Leuphana Universität Lüneburg<br />Fragen? Schreib uns an <a href="mailto:${escapeHtml(globalConfig.contactEmail)}" style="color: #777777;">${escapeHtml(globalConfig.contactEmail)}</a>.`
      : 'Automatische Nachricht der IGNITE-Website.';

  return `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f4f6;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; font-size: 1px; line-height: 1px;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f4f6" style="background-color: #f4f4f6;">
      <tr>
        <td align="center" style="padding: 24px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px;">
            <tr>
              <td style="padding: 0 4px 16px 4px; font: 700 18px/1 ${FONT}; color: ${BRAND};">IGNITE <span style="font-weight: 400; color: #777777;">Startup Club Lüneburg</span></td>
            </tr>
            <tr>
              <td bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #e6e6ea; border-radius: 8px; padding: 32px;">
                <h1 style="margin: 0 0 20px 0; font: 700 24px/1.3 ${FONT}; color: #1a1a1a;">${escapeHtml(title)}</h1>
                ${contentHtml}
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 4px 0 4px; font: 400 13px/1.5 ${FONT}; color: #777777;">${footer}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
