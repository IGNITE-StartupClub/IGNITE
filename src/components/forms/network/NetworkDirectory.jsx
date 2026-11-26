/**
 * The Netzwerk of the members area (React island on both tabs): everyone around IGNITE as cards, alphabetical by first
 * name, with the name search, team, function and group filters at hand and study programme, tag categories,
 * relationship, organisation and "Ansprechbar für" under "Weitere Filter". Active filters show as removable chips.
 * Grouping by team or group only rearranges the matches.
 * Profiles open as a window over the overview (concept section 5): hovering a card shows it after a short delay and
 * keeps it while the pointer is on the card or the window; a click (or a tap, without hover) pins it as a modal dialog
 * until it is closed with the cross, Escape or the backdrop. The pinned profile and an open organisation are the URL
 * hash (#<id>), each a history entry, so Back closes them; #profil opens the own profile form (link in the profile
 * menu). Posts { action, ... } to /api/members/network and shows the state it answers; useLiveRefresh fetches changes
 * of others while the page is in use.
 * Props: copy (memberArea.network.directory), photoCopy and optional (PhotoCropper's copy), initialState
 * (networkState without revision), initialRevision, viewer ({ id, role, position }), view ('people' | 'orgs'),
 * teams ([{ id, name, division }]), paths ({ people, orgs }), locale, today (YYYY-MM-DD in Berlin).
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Plus, SlidersHorizontal, Tags, UserRound, X } from 'lucide-react'
import {
  byName,
  distinctValues,
  filterPeople,
  filtersActive,
  groupPeople,
  GROUPINGS,
  isDue,
  monthLabel,
  NO_FILTERS,
  OPEN_FOR,
  PERSON_KINDS,
  RELATIONS,
  TAG_CATEGORIES,
} from '../../../lib/network'
import { fetchNews, useLiveRefresh } from '../useLiveRefresh'
import { Chip, fill, PRIMARY_BUTTON, SearchField, TOOL_BUTTON } from '../memberUi'
import { Avatar, FilterMenu, RemovableChip, SOFT_BADGE, STRONG_BADGE } from './networkUi'
import ProfileView, { ProfileActions } from './ProfileView.jsx'
import PersonForm from './PersonForm.jsx'
import { OrgBody, OrgCard, OrgForm, TagAdmin } from './OrgViews.jsx'
import '../forms.css'

const ERROR_CODES = ['invalid', 'unknown', 'forbidden', 'duplicate', 'error']
const HOVER_OPEN_MS = 400
const HOVER_SWITCH_MS = 180
const HOVER_CLOSE_MS = 280
const OWN_PROFILE = 'profil'
const PREVIEW_WIDTH = 760

const nameOfPerson = (person) => [person.firstName, person.lastName].filter(Boolean).join(' ')

/** Filters from the address: ?gruppe=alumni, ?ansicht=team, ?beziehung=partner (links from the former tabs). */
function filtersFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const kind = params.get('gruppe')
  const grouping = params.get('ansicht')
  const relation = params.get('beziehung')
  return {
    kinds: PERSON_KINDS.includes(kind) ? [kind] : [],
    grouping: GROUPINGS.includes(grouping) ? grouping : null,
    relations: RELATIONS.includes(relation) ? [relation] : [],
  }
}

/** The card line under the name: team for members, position and organisation for the others. */
function cardLines(person, lookups, copy) {
  const org = person.organizationId ? lookups.orgs[person.organizationId]?.name : ''
  if (person.kind === 'member') {
    const team = person.position === 'board' ? copy.positions.board : (lookups.teams[person.team]?.name ?? '')
    return [team, person.major]
  }
  const work = [person.headline, org].filter(Boolean).join(' · ')
  if (person.kind === 'alumni') {
    const years = person.igniteFrom || person.igniteTo ? `IGNITE ${[person.igniteFrom, person.igniteTo].filter(Boolean).join('–')}` : ''
    return [work, years || person.city]
  }
  return [work, person.city]
}

function PersonCard({ person, ctx, onEnter, onLeave, onPin }) {
  const { copy, lookups, today } = ctx
  const name = nameOfPerson(person)
  const [first, second] = cardLines(person, lookups, copy)
  const lead = person.kind === 'member' && (person.position === 'board' || person.position === 'teamlead')
  const due = person.kind !== 'member' && isDue(person, today)
  return (
    <button
      type="button"
      data-person={person.id}
      aria-label={fill(copy.openProfile, { name })}
      aria-haspopup="dialog"
      onPointerEnter={(e) => onEnter(person.id, e)}
      onPointerLeave={onLeave}
      onClick={() => onPin(person.id)}
      className="relative flex h-full w-full flex-col gap-3 rounded-card border border-border bg-bg p-4 text-left transition-colors hover:border-border-strong hover:bg-bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <span className="flex items-start gap-3">
        <Avatar name={name} photo={person.photo} size={52} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{name}</span>
          {first && <span className="block truncate text-sm text-fg-muted">{first}</span>}
          {second && <span className="block truncate text-sm text-fg-muted">{second}</span>}
        </span>
      </span>
      <span className="mt-auto flex flex-wrap items-end gap-1.5">
        {person.self && <span className={STRONG_BADGE}>{copy.profile.self}</span>}
        {lead && <span className={STRONG_BADGE}>{copy.positions[person.position]}</span>}
        {person.kind !== 'member' && <span className={SOFT_BADGE}>{copy.kinds[person.kind]}</span>}
        {(person.relations ?? []).slice(0, 2).map((relation) => (
          <span key={relation} className={SOFT_BADGE}>
            {copy.relations[relation]}
          </span>
        ))}
        {due && <span className="inline-flex rounded-full border border-danger px-2 py-0.5 text-xs text-danger">{copy.filters.due}</span>}
        {person.kind === 'member' && person.memberSince && (
          <span className="ml-auto text-xs text-fg-subtle">{fill(copy.since, { date: monthLabel(person.memberSince) })}</span>
        )}
      </span>
    </button>
  )
}

/** The hover preview beside its card; it measures itself once shown, so it never leaves the window. */
function Preview({ anchor, children, onEnter, onLeave, label }) {
  const ref = useRef(null)
  const [style, setStyle] = useState(() => ({ visibility: 'hidden', left: 0, top: 0, width: Math.min(PREVIEW_WIDTH, document.documentElement.clientWidth - 32) }))
  useLayoutEffect(() => {
    const vw = document.documentElement.clientWidth
    const vh = window.innerHeight
    const width = Math.min(PREVIEW_WIDTH, vw - 32)
    let left = anchor.right + 12
    if (left + width > vw - 16) left = anchor.left - 12 - width
    if (left < 16) left = Math.max(16, (vw - width) / 2)
    const height = ref.current.offsetHeight
    const top = Math.max(16, Math.min(anchor.top, vh - height - 16))
    setStyle({ left, top, width })
  }, [anchor])
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      style={style}
      className="fixed z-40 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-card border border-border-strong bg-bg p-6 text-fg shadow-2xl"
    >
      {children}
    </div>
  )
}

export default function NetworkDirectory({ copy, photoCopy, optional, initialState, initialRevision, viewer, view, teams, paths, locale, today }) {
  const [data, setData] = useState(initialState)
  const [filters, setFilters] = useState(NO_FILTERS)
  const [grouping, setGrouping] = useState('alpha')
  const [moreFilters, setMoreFilters] = useState(false)
  const [orgQuery, setOrgQuery] = useState('')
  const [orgRelations, setOrgRelations] = useState([])
  const [route, setRoute] = useState('')
  const [preview, setPreview] = useState(null) // { id, anchor }
  const [editing, setEditing] = useState(null) // { key, person, kind, initialOrg }
  const [editingOrg, setEditingOrg] = useState(null) // { key, org }
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const revision = useRef(initialRevision)
  const sent = useRef(0)
  const timers = useRef({ open: 0, close: 0 })
  const profileDialog = useRef(null)
  const orgDialog = useRef(null)
  const personForm = useRef(null)
  const orgForm = useRef(null)
  const tagAdmin = useRef(null)
  const active = viewer.position !== 'alumni'

  const lookups = useMemo(() => {
    const people = Object.fromEntries(data.people.map((person) => [person.id, { ...person, name: nameOfPerson(person) }]))
    return {
      people,
      orgs: Object.fromEntries(data.orgs.map((org) => [org.id, org])),
      tags: Object.fromEntries(data.tags.map((tag) => [tag.id, tag])),
      teams: Object.fromEntries(teams.map((team) => [team.id, team])),
    }
  }, [data, teams])

  // The address only exists in the browser, so its filters apply after hydration.
  useEffect(() => {
    const fromUrl = filtersFromUrl()
    if (fromUrl.kinds.length) setFilters((current) => ({ ...current, kinds: fromUrl.kinds }))
    if (fromUrl.grouping) setGrouping(fromUrl.grouping)
    if (fromUrl.relations.length) setOrgRelations(fromUrl.relations)
  }, [])

  // ---- Routing: the hash names the pinned profile or the open organisation.
  useEffect(() => {
    const read = () => setRoute(decodeURIComponent(window.location.hash.slice(1)))
    read()
    window.addEventListener('popstate', read)
    return () => window.removeEventListener('popstate', read)
  }, [])

  const go = (id) => {
    if (id) {
      // Astro's router needs its own state in every entry, so the entry spreads it.
      window.history.pushState({ ...window.history.state, networkPanel: true }, '', `#${encodeURIComponent(id)}`)
    } else if (window.history.state?.networkPanel) {
      return window.history.back()
    } else {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    }
    setRoute(id ?? '')
  }

  const pinnedId = lookups.people[route] ? route : null
  const orgId = lookups.orgs[route] ? route : null
  const me = data.people.find((person) => person.self)

  useEffect(() => {
    const dialog = profileDialog.current
    if (pinnedId && !dialog.open) dialog.showModal()
    if (!pinnedId && dialog.open) dialog.close()
  }, [pinnedId])

  useEffect(() => {
    const dialog = orgDialog.current
    if (orgId && !dialog.open) dialog.showModal()
    if (!orgId && dialog.open) dialog.close()
  }, [orgId])

  // #profil from the profile menu opens the own form once, then the address goes back to the page.
  useEffect(() => {
    if (route !== OWN_PROFILE || !me) return
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    setRoute('')
    startEdit(me)
  }, [route, me])

  useEffect(() => {
    if (editing) personForm.current?.showModal()
  }, [editing?.key])
  useEffect(() => {
    if (editingOrg) orgForm.current?.showModal()
  }, [editingOrg?.key])

  // ---- Hover preview.
  const clear = (name) => window.clearTimeout(timers.current[name])
  const enterCard = (id, event) => {
    if (event.pointerType !== 'mouse' || pinnedId) return
    clear('close')
    clear('open')
    const anchor = event.currentTarget.getBoundingClientRect()
    if (preview?.id === id) return
    timers.current.open = window.setTimeout(() => setPreview({ id, anchor }), preview ? HOVER_SWITCH_MS : HOVER_OPEN_MS)
  }
  const leave = () => {
    clear('open')
    clear('close')
    timers.current.close = window.setTimeout(() => setPreview(null), HOVER_CLOSE_MS)
  }
  const enterPreview = () => clear('close')

  useEffect(() => {
    if (!preview) return
    const close = (e) => (e.type === 'scroll' || e.key === 'Escape') && setPreview(null)
    window.addEventListener('keydown', close)
    window.addEventListener('scroll', close, { passive: true })
    return () => {
      window.removeEventListener('keydown', close)
      window.removeEventListener('scroll', close)
    }
  }, [preview])

  const pin = (id) => {
    clear('open')
    clear('close')
    setPreview(null)
    if (route !== id) go(id)
  }

  // ---- Server.
  const receive = (next) => {
    const { revision: nextRevision, code, id, message, ...state } = next
    if (state.people) setData(state)
    if (nextRevision) revision.current = nextRevision
  }

  const run = async (body, { quiet = false, onError, closeProfile, closeOrg } = {}) => {
    sent.current += 1
    setBusy(true)
    if (!quiet) setResult(null)
    try {
      const res = await fetch('/api/members/network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const answer = await res.json()
      receive(answer)
      if (res.status >= 500) console.error(answer.message)
      const code = answer.code in copy.results ? answer.code : 'error'
      if (!res.ok) {
        onError?.(code)
        if (!onError) setResult(code)
        return null
      }
      if (!quiet) setResult(code)
      if (closeProfile || closeOrg) go(null)
      return answer
    } catch (err) {
      console.error(err)
      onError?.('error')
      if (!onError) setResult('error')
      return null
    } finally {
      setBusy(false)
    }
  }

  useLiveRefresh(async () => {
    if (busy) return
    const request = ++sent.current
    const answer = await fetchNews('/api/members/network', revision.current)
    if (!answer) return false
    if (answer.people && request === sent.current) receive(answer)
  })

  const startEdit = (person, kind, initialOrg) => {
    setResult(null)
    setEditing({ key: Date.now(), person: person ?? null, kind: kind ?? person?.kind ?? null, initialOrg: initialOrg ?? '' })
  }

  const ctx = {
    copy,
    lookups,
    viewer,
    locale,
    today,
    run,
    busy,
    tags: data.tags,
    orgs: data.orgs,
    teams,
    photoCopy,
    optional,
    people: data.people.map((person) => ({
      id: person.id,
      name: nameOfPerson(person),
      line: cardLines(person, lookups, copy).filter(Boolean).join(' · '),
      kind: person.kind,
      account: person.account,
      memberId: person.id.startsWith('m-') ? person.id.slice(2) : null,
    })),
    onOpenPerson: (id) => pin(id),
    onOpenOrg: (id) => go(id),
    // The header shows the photo too; it follows with the next page load.
    onPhoto: (path) => setData((state) => ({ ...state, people: state.people.map((person) => (person.self ? { ...person, photo: path } : person)) })),
  }

  // ---- Filtering.
  const context = useMemo(
    () => ({
      tagLabels: Object.fromEntries(data.tags.map((tag) => [tag.id, tag.label])),
      orgNames: Object.fromEntries(data.orgs.map((org) => [org.id, org.name])),
      today,
    }),
    [data, today],
  )
  const shown = useMemo(() => filterPeople(data.people, filters, context), [data.people, filters, context])
  const groups = useMemo(() => groupPeople(shown, grouping, teams.map((team) => team.id)), [shown, grouping, teams])

  const usage = useMemo(() => {
    const counts = {}
    for (const item of [...data.people, ...data.orgs]) for (const tag of item.tags ?? []) counts[tag] = (counts[tag] ?? 0) + 1
    return counts
  }, [data])
  const countBy = (pickValues) => {
    const counts = {}
    for (const person of data.people) for (const value of pickValues(person)) if (value) counts[value] = (counts[value] ?? 0) + 1
    return counts
  }
  const options = useMemo(() => {
    const teamCounts = countBy((person) => (person.kind === 'member' ? [person.team] : []))
    const positionCounts = countBy((person) => (person.kind === 'member' ? [person.position] : []))
    const relationCounts = countBy((person) => person.relations ?? [])
    const orgCounts = countBy((person) => [person.organizationId])
    const openForCounts = countBy((person) => person.openFor ?? [])
    const majorCounts = countBy((person) => [person.major])
    return {
      team: teams.map((team) => ({ value: team.id, label: team.name, count: teamCounts[team.id] ?? 0 })),
      position: ['member', 'teamlead', 'board'].map((value) => ({ value, label: copy.positions[value], count: positionCounts[value] ?? 0 })),
      major: distinctValues(data.people, (person) => person.major).map((value) => ({ value, label: value, count: majorCounts[value] })),
      relation: RELATIONS.filter((value) => relationCounts[value]).map((value) => ({ value, label: copy.relations[value], count: relationCounts[value] })),
      organization: data.orgs.filter((org) => orgCounts[org.id]).map((org) => ({ value: org.id, label: org.name, count: orgCounts[org.id] })),
      openFor: OPEN_FOR.filter((value) => openForCounts[value]).map((value) => ({ value, label: copy.openFor[value], count: openForCounts[value] })),
      tags: Object.fromEntries(
        TAG_CATEGORIES.map((category) => [
          category,
          data.tags.filter((tag) => tag.category === category && usage[tag.id]).map((tag) => ({ value: tag.id, label: tag.label, count: usage[tag.id] })),
        ]),
      ),
    }
  }, [data, teams, usage, copy])

  const setFilter = (key) => (value) => setFilters((current) => ({ ...current, [key]: value }))
  const setTagFilter = (category) => (value) => setFilters((current) => ({ ...current, tags: { ...current.tags, [category]: value } }))

  /** Every active filter value as a chip that removes it. */
  const activeChips = [
    ...filters.kinds.map((value) => ({ key: `k-${value}`, label: copy.kindsPlural[value], remove: () => setFilter('kinds')(filters.kinds.filter((v) => v !== value)) })),
    ...filters.teams.map((value) => ({ key: `t-${value}`, label: lookups.teams[value]?.name ?? value, remove: () => setFilter('teams')(filters.teams.filter((v) => v !== value)) })),
    ...filters.positions.map((value) => ({ key: `p-${value}`, label: copy.positions[value], remove: () => setFilter('positions')(filters.positions.filter((v) => v !== value)) })),
    ...filters.majors.map((value) => ({ key: `m-${value}`, label: value, remove: () => setFilter('majors')(filters.majors.filter((v) => v !== value)) })),
    ...filters.relations.map((value) => ({ key: `r-${value}`, label: copy.relations[value], remove: () => setFilter('relations')(filters.relations.filter((v) => v !== value)) })),
    ...filters.organizations.map((value) => ({ key: `o-${value}`, label: lookups.orgs[value]?.name ?? '…', remove: () => setFilter('organizations')(filters.organizations.filter((v) => v !== value)) })),
    ...filters.openFor.map((value) => ({ key: `f-${value}`, label: copy.openFor[value], remove: () => setFilter('openFor')(filters.openFor.filter((v) => v !== value)) })),
    ...Object.entries(filters.tags).flatMap(([category, values]) =>
      (values ?? []).map((value) => ({ key: `g-${value}`, label: lookups.tags[value]?.label ?? '…', remove: () => setTagFilter(category)(values.filter((v) => v !== value)) })),
    ),
    ...(filters.dueOnly ? [{ key: 'due', label: copy.filters.due, remove: () => setFilter('dueOnly')(false) }] : []),
  ]

  const pinned = pinnedId && data.people.find((person) => person.id === pinnedId)
  const previewed = preview && data.people.find((person) => person.id === preview.id)
  const openOrg = orgId && data.orgs.find((org) => org.id === orgId)
  const orgPeople = (id) =>
    data.people
      .filter((person) => person.organizationId === id)
      .sort(byName)
      .map((person) => ({ id: person.id, name: nameOfPerson(person), headline: person.headline, photo: person.photo }))

  const resultMessage = result && (
    <p role="status" className={ERROR_CODES.includes(result) ? 'form-error' : 'form-success'}>
      {copy.results[result]}
    </p>
  )

  // ---- Organisations tab.
  const orgNeedle = orgQuery.trim().toLocaleLowerCase('de')
  const shownOrgs = data.orgs.filter(
    (org) =>
      (!orgRelations.length || org.relations.some((relation) => orgRelations.includes(relation))) &&
      (!orgNeedle || [org.name, org.city, org.about, org.partnership].some((value) => value?.toLocaleLowerCase('de').includes(orgNeedle))),
  )

  const actions = (
    <div className="flex flex-wrap gap-2">
      {me && (
        <button type="button" className={TOOL_BUTTON} onClick={() => startEdit(me)}>
          <UserRound aria-hidden="true" className="h-4 w-4" />
          {copy.myProfile}
        </button>
      )}
      {active && view === 'people' && (
        <button type="button" className={PRIMARY_BUTTON} onClick={() => startEdit(null)}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          {copy.add}
        </button>
      )}
      {active && view === 'orgs' && (
        <button type="button" className={PRIMARY_BUTTON} onClick={() => setEditingOrg({ key: Date.now(), org: null })}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          {copy.addOrg}
        </button>
      )}
      {viewer.role === 'admin' && (
        <button type="button" className={TOOL_BUTTON} onClick={() => tagAdmin.current.showModal()}>
          <Tags aria-hidden="true" className="h-4 w-4" />
          {copy.manageTags}
        </button>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      {view === 'people' ? (
        <>
          <div className="flex flex-col gap-3 rounded-card border border-border bg-bg p-4">
            <div className="flex flex-wrap items-center gap-3">
              <SearchField label={copy.search} value={filters.query} onChange={setFilter('query')} />
              <label className="flex items-center gap-2 text-sm">
                <span className="text-fg-muted">{copy.groupings.label}</span>
                <select value={grouping} onChange={(e) => setGrouping(e.target.value)} className="h-10 rounded-lg border border-border-strong bg-bg-subtle px-2 text-sm">
                  {GROUPINGS.map((value) => (
                    <option key={value} value={value}>
                      {copy.groupings[value]}
                    </option>
                  ))}
                </select>
              </label>
              {actions}
            </div>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label={copy.filters.group}>
              {PERSON_KINDS.map((kind) => (
                <Chip key={kind} pressed={filters.kinds.includes(kind)} onClick={() => setFilter('kinds')(filters.kinds.includes(kind) ? filters.kinds.filter((v) => v !== kind) : [...filters.kinds, kind])}>
                  {copy.kindsPlural[kind]}
                </Chip>
              ))}
              <span aria-hidden="true" className="mx-1 h-6 w-px bg-border" />
              <FilterMenu label={copy.filters.team} options={options.team} selected={filters.teams} onChange={setFilter('teams')} copy={copy.filters} />
              <FilterMenu label={copy.filters.position} options={options.position} selected={filters.positions} onChange={setFilter('positions')} copy={copy.filters} />
              <button type="button" aria-expanded={moreFilters} onClick={() => setMoreFilters(!moreFilters)} className="inline-flex h-9 items-center gap-1.5 rounded-full border-0 px-3 text-sm text-fg-muted hover:text-fg">
                <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
                {moreFilters ? copy.filters.fewer : copy.filters.more}
              </button>
            </div>
            {moreFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <FilterMenu label={copy.filters.major} options={options.major} selected={filters.majors} onChange={setFilter('majors')} copy={copy.filters} />
                {TAG_CATEGORIES.map((category) => (
                  <FilterMenu
                    key={category}
                    label={copy.tagCategories[category]}
                    options={options.tags[category]}
                    selected={filters.tags[category] ?? []}
                    onChange={setTagFilter(category)}
                    copy={copy.filters}
                  />
                ))}
                <FilterMenu label={copy.filters.relation} options={options.relation} selected={filters.relations} onChange={setFilter('relations')} copy={copy.filters} />
                <FilterMenu label={copy.filters.organization} options={options.organization} selected={filters.organizations} onChange={setFilter('organizations')} copy={copy.filters} />
                <FilterMenu label={copy.filters.openFor} options={options.openFor} selected={filters.openFor} onChange={setFilter('openFor')} copy={copy.filters} />
                {active && (
                  <Chip pressed={filters.dueOnly} onClick={() => setFilter('dueOnly')(!filters.dueOnly)}>
                    {copy.filters.due}
                  </Chip>
                )}
              </div>
            )}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2" aria-label={copy.filters.active} role="group">
                {activeChips.map((chip) => (
                  <RemovableChip key={chip.key} label={chip.label} removeLabel={fill(copy.filters.remove, { label: chip.label })} onRemove={chip.remove} />
                ))}
                <button type="button" onClick={() => setFilters({ ...NO_FILTERS, query: filters.query })} className="rounded-md border-0 px-2 py-1 text-sm text-accent-text hover:underline">
                  {copy.filters.reset}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-fg-muted" aria-live="polite">
              {fill(copy.count, { shown: shown.length, total: data.people.length })}
            </p>
            {resultMessage}
          </div>

          {shown.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-card border border-dashed border-border-strong p-6">
              <p className="text-sm text-fg-muted">{copy.empty}</p>
              {filtersActive(filters) && (
                <button type="button" className={TOOL_BUTTON} onClick={() => setFilters(NO_FILTERS)}>
                  <X aria-hidden="true" className="h-4 w-4" />
                  {copy.filters.reset}
                </button>
              )}
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.key} aria-label={group.key === 'all' ? undefined : (copy.groupNames[group.key] ?? lookups.teams[group.key]?.name)}>
                {group.key !== 'all' && (
                  <h2 className="mb-3 text-[20px] font-semibold">
                    {copy.groupNames[group.key] ?? lookups.teams[group.key]?.name ?? group.key}{' '}
                    <span className="text-sm font-normal text-fg-muted">({group.people.length})</span>
                  </h2>
                )}
                <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {group.people.map((person) => (
                    <li key={person.id}>
                      <PersonCard person={person} ctx={ctx} onEnter={enterCard} onLeave={leave} onPin={pin} />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-card border border-border bg-bg p-4">
            <div className="flex flex-wrap items-center gap-3">
              <SearchField label={copy.searchOrgs} value={orgQuery} onChange={setOrgQuery} />
              {actions}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label={copy.filters.relation}>
              {RELATIONS.filter((relation) => data.orgs.some((org) => org.relations.includes(relation))).map((relation) => (
                <Chip
                  key={relation}
                  pressed={orgRelations.includes(relation)}
                  onClick={() => setOrgRelations(orgRelations.includes(relation) ? orgRelations.filter((v) => v !== relation) : [...orgRelations, relation])}
                >
                  {copy.relations[relation]}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-fg-muted" aria-live="polite">
              {fill(copy.countOrgs, { shown: shownOrgs.length, total: data.orgs.length })}
            </p>
            {resultMessage}
          </div>
          {shownOrgs.length === 0 ? (
            <p className="rounded-card border border-dashed border-border-strong p-6 text-sm text-fg-muted">{data.orgs.length ? copy.emptyOrgs : copy.emptyAllOrgs}</p>
          ) : (
            <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {shownOrgs.map((org) => (
                <li key={org.id}>
                  <OrgCard org={org} count={orgPeople(org.id).length} copy={copy} onOpen={(id) => go(id)} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {previewed && !pinned && (
        <Preview anchor={preview.anchor} onEnter={enterPreview} onLeave={leave} label={fill(copy.profile.label, { name: nameOfPerson(previewed) })}>
          <ProfileView person={previewed} ctx={{ ...ctx, pinned: false }} headingId="network-preview-heading" />
        </Preview>
      )}

      <dialog
        ref={profileDialog}
        aria-labelledby="network-profile-heading"
        onClose={() => pinnedId && go(null)}
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="w-[min(60rem,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] rounded-card border border-border bg-bg p-0 text-fg backdrop:bg-black/60"
      >
        {pinned && (
          <div className="relative p-6">
            <button
              type="button"
              aria-label={copy.profile.close}
              onClick={() => profileDialog.current.close()}
              className="absolute right-4 top-4 rounded-md border-0 p-1 text-fg-muted hover:text-fg"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
            <ProfileView
              person={pinned}
              ctx={{ ...ctx, pinned: true }}
              headingId="network-profile-heading"
              actions={<ProfileActions person={pinned} ctx={ctx} onEdit={() => startEdit(pinned)} />}
            />
            {resultMessage && <div className="mt-3">{resultMessage}</div>}
          </div>
        )}
      </dialog>

      <dialog
        ref={orgDialog}
        aria-labelledby="network-org-heading"
        onClose={() => orgId && go(null)}
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="w-[min(48rem,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] rounded-card border border-border bg-bg p-0 text-fg backdrop:bg-black/60"
      >
        {openOrg && (
          <div className="relative p-6">
            <button type="button" aria-label={copy.profile.close} onClick={() => orgDialog.current.close()} className="absolute right-4 top-4 rounded-md border-0 p-1 text-fg-muted hover:text-fg">
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
            <OrgBody
              org={openOrg}
              people={orgPeople(openOrg.id)}
              ctx={ctx}
              headingId="network-org-heading"
              onEdit={() => setEditingOrg({ key: Date.now(), org: openOrg })}
              onAddPerson={() => startEdit(null, 'external', openOrg.id)}
            />
          </div>
        )}
      </dialog>

      {editing && (
        <PersonForm
          key={editing.key}
          dialogRef={personForm}
          person={editing.person}
          kind={editing.kind}
          initialOrg={editing.initialOrg}
          ctx={ctx}
          onClose={() => setEditing(null)}
          onSaved={(id) => {
            setEditing(null)
            if (id && id !== pinnedId && !editing.person?.self) pin(id)
          }}
        />
      )}
      {editingOrg && (
        <OrgForm
          key={editingOrg.key}
          dialogRef={orgForm}
          org={editingOrg.org}
          ctx={ctx}
          onClose={() => setEditingOrg(null)}
          onSaved={(id) => {
            setEditingOrg(null)
            if (id && id !== orgId) go(id)
          }}
        />
      )}
      {viewer.role === 'admin' && <TagAdmin dialogRef={tagAdmin} ctx={ctx} usage={usage} />}
    </div>
  )
}
