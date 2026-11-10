// The daily report of server errors (errorReportMail.ts) to the admins who switched it on: one block per group of equal
// errors, the most frequent first, with where, how often, when and the top of the stack. Layout from layout.ts, as an
// internal mail of the website. German, like all mails.

import type { ErrorGroup } from '../../lib/errorReport';
import { escapeHtml } from './escapeHtml';
import { button, fieldHtml, note, paragraph, renderEmail } from './layout';

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const berlinTime = (date: Date): string =>
  new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

export const getErrorSummarySubject = (total: number): string =>
  total === 1 ? 'IGNITE-Website: 1 Serverfehler' : `IGNITE-Website: ${total} Serverfehler`;

function groupBlock(group: ErrorGroup): string {
  const times = group.count === 1 ? berlinTime(group.last) : `${group.count}×, ${berlinTime(group.first)} bis ${berlinTime(group.last)}`;
  const stack = group.stack
    ? `<div style="margin-top: 8px; font: 400 12px/1.5 ${MONO}; color: #555555; white-space: pre-wrap; word-break: break-all;">${escapeHtml(group.stack)}</div>`
    : '';
  return fieldHtml(
    group.context,
    `<strong>${escapeHtml(times)}</strong><br />${escapeHtml(`${group.name}: ${group.message}`)}${stack}`,
  );
}

export function getErrorSummaryEmailHTML(groups: ErrorGroup[], hidden: number, total: number, pageUrl: string): string {
  return renderEmail({
    title: getErrorSummarySubject(total),
    preheader: groups.map((group) => group.context).join(', '),
    audience: 'team',
    contentHtml: [
      paragraph(
        total === 1
          ? 'Seit dem letzten Bericht ist auf der Website ein Fehler aufgetreten.'
          : `Seit dem letzten Bericht sind auf der Website ${total} Fehler aufgetreten.`,
      ),
      ...groups.map(groupBlock),
      hidden ? paragraph(`Dazu kommen ${hidden} weitere Arten von Fehlern, die hier nicht aufgeführt sind.`) : '',
      button('Fehler ansehen', pageUrl),
      note(
        'Du bekommst diesen Bericht, weil du ihn auf der Seite „Systemzustand“ eingeschaltet hast. Dort siehst du alle Fehler und kannst den Bericht wieder ausschalten. Die Einträge werden nach 30 Tagen gelöscht.',
      ),
    ].join(''),
  });
}
