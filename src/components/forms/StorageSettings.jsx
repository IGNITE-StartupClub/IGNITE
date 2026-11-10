/**
 * The SharePoint links of the Ablage page on the member management page (React island): the whole site, one folder
 * per team and up to GENERAL_MAX named folders for everyone. Saving posts the whole set to /api/members/storage, which
 * takes only Leuphana SharePoint links; the browser checks the same pattern first.
 * Props: copy (memberArea.admin.storage), initialFolders (storageFolders.ts), teams ({ [teamId]: name }).
 */
import React, { useId, useState } from 'react'
import { X } from 'lucide-react'
import { GENERAL_MAX, FOLDER_NAME_MAX } from '../../lib/storageFolders'
import { SHAREPOINT_PATTERN, TEAM_IDS } from '../../lib/tasks'
import { fill, PRIMARY_BUTTON, TOOL_BUTTON } from './memberUi'

const PLACEHOLDER = 'https://leuphanalg.sharepoint.com/…'

function LinkInput({ id, label, value, onChange }) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        type="url"
        inputMode="url"
        className="input"
        pattern={SHAREPOINT_PATTERN}
        placeholder={PLACEHOLDER}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export default function StorageSettings({ copy, initialFolders, teams }) {
  const [folders, setFolders] = useState(initialFolders)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // 'saved', 'invalid' or 'error'
  const id = useId()

  const change = (next) => {
    setFolders(next)
    setResult(null)
  }
  const setTeam = (team) => (url) => change({ ...folders, teams: { ...folders.teams, [team]: url } })
  const setGeneral = (index, key) => (value) =>
    change({ ...folders, general: folders.general.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry)) })

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setResult(null)
    // A row left blank on both sides is no folder; the server refuses rows with only one of them.
    const general = folders.general.filter((entry) => entry.name.trim() || entry.url.trim())
    try {
      const res = await fetch('/api/members/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...folders, general }),
      })
      const data = await res.json()
      if (data.folders) setFolders(data.folders)
      if (!res.ok) console.error(data.message)
      setResult(res.ok ? 'saved' : res.status === 400 ? 'invalid' : 'error')
    } catch (err) {
      console.error(err)
      setResult('error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby={`${id}-heading`} className="rounded-card border border-border bg-bg p-5">
      <h2 id={`${id}-heading`} className="text-xs font-medium uppercase tracking-wider text-fg-muted">
        {copy.heading}
      </h2>
      <p className="mt-2 max-w-text text-sm text-fg-muted">{copy.text}</p>
      <form onSubmit={save} className="mt-4 flex flex-col gap-6">
        <LinkInput id={`${id}-root`} label={copy.root} value={folders.root} onChange={(root) => change({ ...folders, root })} />

        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 p-0 font-medium">{copy.teamsHeading}</legend>
          <div className="grid gap-x-4 sm:grid-cols-2">
            {TEAM_IDS.map((team) => (
              <LinkInput key={team} id={`${id}-${team}`} label={teams[team]} value={folders.teams[team]} onChange={setTeam(team)} />
            ))}
          </div>
        </fieldset>

        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 p-0 font-medium">{copy.generalHeading}</legend>
          <ul role="list" className="m-0 flex list-none flex-col gap-3 p-0">
            {folders.general.map((entry, index) => (
              <li key={index} className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
                <div className="field">
                  <label htmlFor={`${id}-general-${index}-name`} className="field-label">
                    {copy.name}
                  </label>
                  <input
                    id={`${id}-general-${index}-name`}
                    className="input"
                    maxLength={FOLDER_NAME_MAX}
                    required={!!entry.url.trim()}
                    value={entry.name}
                    onChange={(e) => setGeneral(index, 'name')(e.target.value)}
                  />
                </div>
                <LinkInput id={`${id}-general-${index}-url`} label={copy.url} value={entry.url} onChange={setGeneral(index, 'url')} />
                <button
                  type="button"
                  className={`${TOOL_BUTTON} h-11 w-11 justify-center p-0`}
                  aria-label={entry.name.trim() ? fill(copy.remove, { name: entry.name.trim() }) : copy.removeUnnamed}
                  onClick={() => change({ ...folders, general: folders.general.filter((_, i) => i !== index) })}
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          {folders.general.length < GENERAL_MAX && (
            <button
              type="button"
              className={`${TOOL_BUTTON} mt-3 h-9`}
              onClick={() => change({ ...folders, general: [...folders.general, { name: '', url: '' }] })}
            >
              {copy.add}
            </button>
          )}
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={`${PRIMARY_BUTTON} h-10`} disabled={busy}>
            {copy.save}
          </button>
          <p aria-live="polite" className={`m-0 text-sm ${result && result !== 'saved' ? 'text-danger' : 'text-fg-muted'}`}>
            {result && copy[result]}
          </p>
        </div>
      </form>
    </section>
  )
}
