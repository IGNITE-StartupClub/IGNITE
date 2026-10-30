// Layout of the members area mails (code and invitation), design "A2" from Claude Design: a white card with a thin
// border and a soft shadow on white, a purple header bar with the badge, a short footer below the card.
// Table based and inline styled like layout.ts. Outlook for Windows ignores border-radius and box-shadow and shows a
// plain bordered card, which is fine. Callers pass already escaped HTML.

import { escapeHtml } from './escapeHtml';
import { INSTAGRAM_URL, LINKEDIN_URL } from './links';
import { globalConfig } from '../../data/staticContent';
import { BADGE_PATH, LIVE_ORIGIN } from '../../lib/emailSignature';

const PURPLE = '#311763';
const FONT = "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

export const text = (html: string): string =>
  `<p style="margin: 12px 0 0 0; font: 400 15px/1.6 ${FONT}; color: #4a4754;">${html}</p>`;

export const steps = (itemsHtml: string[]): string =>
  `<ol style="margin: 20px 0 0 0; padding-left: 20px; font: 400 15px/1.6 ${FONT}; color: #16141c;">${itemsHtml
    .map((item) => `<li style="padding-left: 6px; margin-bottom: 8px;">${item}</li>`)
    .join('')}</ol>`;

export const codeBox = (code: string): string => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 28px;">
    <tr>
      <td bgcolor="#fafafb" style="background-color: #fafafb; border: 1px solid #e4e4e8; border-radius: 6px; padding: 22px 24px; font: 600 34px/1 ${FONT}; letter-spacing: 0.22em; color: ${PURPLE};">${escapeHtml(code)}</td>
    </tr>
  </table>`;

export const button = (label: string, url: string): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 28px;">
    <tr>
      <td bgcolor="${PURPLE}" style="border-radius: 6px; background-color: ${PURPLE};">
        <a href="${escapeHtml(url)}" style="display: inline-block; padding: 12px 22px; font: 600 15px/20px ${FONT}; color: #ffffff; text-decoration: none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;

export const finePrint = (html: string): string =>
  `<p style="margin: 12px 0 0 0; font: 400 13px/1.5 ${FONT}; color: #6e6b78;">${html}</p>`;

export const closingNote = (html: string): string =>
  `<p style="margin: 36px 0 0 0; padding-top: 20px; border-top: 1px solid #ededf0; font: 400 13px/1.55 ${FONT}; color: #6e6b78;">${html}</p>`;

const footerLink = (label: string, url: string): string =>
  `<a href="${escapeHtml(url)}" style="color: ${PURPLE}; text-decoration: none;">${escapeHtml(label)}</a>`;

interface MemberEmailOptions {
  title: string;
  preheader: string;
  contentHtml: string;
}

export function renderMemberEmail({ title, preheader, contentHtml }: MemberEmailOptions): string {
  const links = [
    footerLink('Website', LIVE_ORIGIN),
    footerLink('Instagram', INSTAGRAM_URL),
    footerLink('LinkedIn', LINKEDIN_URL),
  ].join('&nbsp;&nbsp;&nbsp;');

  // The badge has the header's purple as its background, so only the white logo shows.
  return `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${escapeHtml(title)}</title>
    <style>
      /* Phones: less padding, and the inviter's signature (emailSignature.ts) puts its photo above the text instead of
         squeezing the text into a narrow column. Clients without media queries keep the desktop layout. */
      @media (max-width: 480px) {
        .member-pad { padding-left: 20px !important; padding-right: 20px !important; }
        .sig-photo, .sig-text { display: block !important; }
        .sig-photo { padding: 0 0 14px 0 !important; }
        .sig-photo img { width: 72px !important; height: 72px !important; border-radius: 36px !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #ffffff;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; font-size: 1px; line-height: 1px;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background-color: #ffffff;">
      <tr>
        <td align="center" style="padding: 32px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px;">
            <tr>
              <td bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #e6e4ec; border-radius: 10px; box-shadow: 0 1px 2px rgba(22, 20, 28, 0.06), 0 12px 32px rgba(49, 23, 99, 0.10);">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td class="member-pad" bgcolor="${PURPLE}" style="background-color: ${PURPLE}; border-radius: 9px 9px 0 0; padding: 22px 40px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td><a href="${LIVE_ORIGIN}" style="text-decoration: none;"><img src="${LIVE_ORIGIN}${BADGE_PATH}" width="110" height="32" alt="IGNITE" style="display: block; width: 110px; height: 32px; border: 0;" /></a></td>
                          <td style="padding: 0 14px;"><div style="width: 0; height: 18px; border-left: 1px solid #5e4a8c;"></div></td>
                          <td style="font: 400 14px/1 ${FONT}; color: #cfc6ee;">Mitgliederbereich</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td class="member-pad" style="padding: 44px 40px 40px 40px;">
                      <h1 style="margin: 0; font: 600 24px/1.3 ${FONT}; letter-spacing: -0.01em; color: #16141c;">${escapeHtml(title)}</h1>
                      ${contentHtml}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="member-pad" style="padding: 24px 40px 0 40px; font: 400 12px/1.7 ${FONT}; color: #7d7a87;">
                <div>IGNITE Startup Club · Leuphana Universität Lüneburg</div>
                <div>${links}</div>
                <div>Fragen? ${footerLink(globalConfig.contactEmail, `mailto:${globalConfig.contactEmail}`)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
