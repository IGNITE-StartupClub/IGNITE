// The daily mail of the tasks module: the tasks a member was newly assigned to since the last digest, grouped by
// project, each with its deadline and a link into the board. Layout from memberLayout.ts. German, like all mails.

import { escapeHtml } from './escapeHtml';
import { button, closingNote, renderMemberEmail, text } from './memberLayout';

export interface DigestProject {
  title: string;
  url: string;
  tasks: { title: string; due: string }[];
}

const FONT = "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

/** "10.11." for 2026-11-10. */
const shortDay = (day: string): string => `${day.slice(8, 10)}.${day.slice(5, 7)}.`;

export const getTaskDigestSubject = (count: number): string =>
  count === 1 ? 'IGNITE – Du hast eine neue Aufgabe' : `IGNITE – Du hast ${count} neue Aufgaben`;

function projectBlock(project: DigestProject): string {
  const items = project.tasks
    .map(
      (task) =>
        `<li style="margin: 0 0 6px 0;">${escapeHtml(task.title)}${
          task.due ? ` <span style="color: #6e6b78;">– fällig ${shortDay(task.due)}</span>` : ''
        }</li>`,
    )
    .join('');
  return `
    <p style="margin: 24px 0 0 0; font: 600 16px/1.4 ${FONT};"><a href="${escapeHtml(project.url)}" style="color: #16141c; text-decoration: none;">${escapeHtml(project.title)}</a></p>
    <ul style="margin: 8px 0 0 0; padding-left: 20px; font: 400 15px/1.6 ${FONT}; color: #16141c;">${items}</ul>`;
}

export function getTaskDigestEmailHTML(name: string, projects: DigestProject[], myTasksUrl: string): string {
  const count = projects.reduce((sum, project) => sum + project.tasks.length, 0);
  return renderMemberEmail({
    title: getTaskDigestSubject(count),
    preheader: projects.map((project) => project.title).join(', '),
    contentHtml: `
      ${text(`Hallo ${escapeHtml(name)},`)}
      ${text(count === 1 ? 'dir wurde eine neue Aufgabe bei IGNITE zugewiesen.' : 'dir wurden neue Aufgaben bei IGNITE zugewiesen.')}
      ${projects.map(projectBlock).join('')}
      ${button('Meine Aufgaben öffnen', myTasksUrl)}
      ${closingNote('Du bekommst diese Zusammenfassung höchstens einmal am Tag, und nur, wenn du neue Aufgaben hast.')}`,
  });
}
