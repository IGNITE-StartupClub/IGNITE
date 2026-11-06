/**
 * Team choice of the members start page: shown until a member has a team and again from the profile menu (`changing`).
 * Saves name and team through /api/members/profile, then loads the start page, which shows the dashboard.
 * Props: copy (memberArea.home.teamChoice), welcome, name (greeting), teams ([{ id, name, text, icon }]),
 * current ({ firstName, lastName, team }), changing, homeUrl.
 */
import React, { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { NAME_MAX } from '../../lib/tasks'

const FIELD = 'flex min-w-0 max-w-[280px] flex-[1_1_200px] flex-col gap-1.5'
const INPUT =
  'min-h-12 rounded-xl border border-border bg-card px-3.5 text-sm text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'
const BUTTON = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-button px-6 text-sm font-semibold'

function TeamCard({ team, selected, onPick }) {
  return (
    <label
      className={`relative flex min-h-[216px] cursor-pointer flex-col gap-4 rounded-card border bg-card p-5 text-fg transition-[transform,border-color,box-shadow] duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        selected ? 'border-primary shadow-[0_0_0_1px_var(--color-primary)]' : 'border-border hover:border-border-strong'
      }`}
    >
      <input type="radio" name="team" value={team.id} checked={selected} onChange={onPick} className="sr-only" />
      <img src={team.icon} alt="" width="52" height="52" className="block rounded-full" />
      <span className="flex flex-col gap-1.5">
        <span className="text-lg font-semibold leading-tight tracking-tight">{team.name}</span>
        <span className="text-sm text-fg-muted">{team.text}</span>
      </span>
      {selected && (
        <span aria-hidden="true" className="absolute right-4 top-4 inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-primary text-primary-fg">
          <Check className="h-[15px] w-[15px]" strokeWidth={3} />
        </span>
      )}
    </label>
  )
}

export default function TeamChoice({ copy, welcome, name, teams, current, changing, homeUrl }) {
  const [team, setTeam] = useState(current.team)
  const [firstName, setFirstName] = useState(current.firstName)
  const [lastName, setLastName] = useState(current.lastName)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFailed(false)
    try {
      const res = await fetch('/api/members/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, team }),
      })
      if (!res.ok) throw new Error(`Profile not saved: ${res.status}`)
      window.location.assign(homeUrl)
    } catch (err) {
      console.error(err)
      setFailed(true)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-10">
      <div className="flex flex-col gap-2.5">
        <h1 id="page-title" className="text-display-sm hyphens-none">
          {welcome}, <em>{name}</em>
        </h1>
        <p className="text-lg text-fg-muted">{changing ? copy.changeLead : copy.lead}</p>
      </div>

      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="sr-only">{copy.legend}</legend>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr))]">
          {teams.map((entry) => (
            <TeamCard key={entry.id} team={entry} selected={entry.id === team} onPick={() => setTeam(entry.id)} />
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-end gap-4 border-t border-border pt-6">
        <label className={FIELD}>
          <span className="text-[13px] font-medium text-fg-muted">{copy.firstName}</span>
          <input
            className={INPUT}
            required
            maxLength={NAME_MAX}
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </label>
        <label className={FIELD}>
          <span className="text-[13px] font-medium text-fg-muted">{copy.lastName}</span>
          <input
            className={INPUT}
            required
            maxLength={NAME_MAX}
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </label>
        <p className="flex-[1_1_220px] self-center pt-[22px] text-[13px] text-fg-muted">{changing ? '' : copy.hint}</p>
        {changing && (
          <a href={homeUrl} className={`${BUTTON} border border-border-strong text-fg hover:bg-bg-subtle`}>
            {copy.cancel}
          </a>
        )}
        {team ? (
          <button type="submit" disabled={saving} className={`${BUTTON} border-0 bg-primary text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-60`}>
            {changing ? copy.save : copy.start}
            {!changing && <ArrowRight aria-hidden="true" className="h-[18px] w-[18px]" />}
          </button>
        ) : (
          <button type="button" disabled className={`${BUTTON} border border-border bg-card text-fg-muted`}>
            {copy.pick}
          </button>
        )}
      </div>
      {failed && (
        <p role="alert" className="-mt-6 text-sm text-danger">
          {copy.error}
        </p>
      )}
    </form>
  )
}
