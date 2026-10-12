/**
 * Locale-keyed site copy. German (staticContent.ts and friends) is the default; the English files must mirror
 * every export, which the `Copy` type below enforces at typecheck time.
 * Usage in .astro files: `const t = getCopy(Astro.currentLocale)`. React islands do not import this module;
 * pages pass the slice they need as props so only one language ships to the browser.
 */
import { resolveLocale, type Locale } from '../lib/i18n'
import * as deStatic from './staticContent'
import * as enStatic from './staticContent.en'
import { advisoryMembers as deAdvisoryMembers } from './advisoryBoard'
import { advisoryMembers as enAdvisoryMembers } from './advisoryBoard.en'
import { openTeams as deOpenTeams } from './openTeams'
import { openTeams as enOpenTeams } from './openTeams.en'
import { questionnaireConfig as deQuestionnaire } from './questionnaireConfig'
import { questionnaireConfig as enQuestionnaire } from './questionnaireConfig.en'

const de = { ...deStatic, advisoryMembers: deAdvisoryMembers, openTeams: deOpenTeams, questionnaireConfig: deQuestionnaire }
export type Copy = typeof de

const en: Copy = { ...enStatic, advisoryMembers: enAdvisoryMembers, openTeams: enOpenTeams, questionnaireConfig: enQuestionnaire }

const copy: Record<Locale, Copy> = { de, en }

export const getCopy = (locale?: string): Copy => copy[resolveLocale(locale)]
