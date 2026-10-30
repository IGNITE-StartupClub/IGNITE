/**
 * Member management for admins (React island): a table of all members with search, filter, CSV export and paging,
 * an "add member" dialog and an actions menu per row. Posts { action, email, role?, locale } to /api/members/admin and
 * shows the member list the API returns after each action.
 * Props: copy (memberArea.admin.manager), initialMembers (memberSummary objects), currentEmail (the signed-in admin,
 * whose own row has no actions), locale ('de' | 'en'), now (render time in ms, so server and browser print the same
 * relative times). Owners look like any admin here: the API refuses changes to them (409 'owner') with a neutral
 * message, so the list does not reveal who is protected.
 * Menus use the browser's popover API, which handles Escape, outside clicks and focus order.
 * Styles: ./forms.css plus Tailwind utilities.
 */
import React, { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Download, ListFilter, Plus, X } from 'lucide-react'
import { filterMembers, formatDateTime, memberStatus, relativeTime, toCsv } from '../../lib/memberTable'
import { BUTTON_BASE, fill, PRIMARY_BUTTON, SearchField, TOOL_BUTTON } from './memberUi'
import './forms.css'

const ERROR_CODES = [
  'exists',
  'unknown',
  'self',
  'owner',
  'invalid',
  'forbidden',
  'error',
  'mailFailed',
  'addedMailFailed',
]
const PAGE_SIZE = 10

// border-0: the site's base styles give every button a border.
const MENU_ITEM =
  'block w-full border-0 whitespace-nowrap rounded-md px-3 py-2 text-left text-sm hover:bg-bg-subtle focus-visible:bg-bg-subtle'
const STATUS_BADGE = {
  active: 'border-success text-success bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)]',
  invited: 'border-border-strong text-fg-muted',
  locked: 'border-danger text-danger bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)]',
}

function Avatar({ member }) {
  // Decorative: the name or address sits right next to it.
  if (member.photo)
    return (
      <img src={member.photo} alt="" width="40" height="40" className="h-10 w-10 shrink-0 rounded-full object-cover" />
    )
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-strong bg-bg font-medium uppercase text-fg-muted"
    >
      {(member.name || member.email)[0]}
    </span>
  )
}

/** A button that opens a popover below it, right-aligned; flips above when there is no room below. */
function Menu({ label, ariaLabel, className, children }) {
  const id = useId()
  const button = useRef(null)
  const panel = useRef(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const popover = panel.current
    const place = (event) => {
      if (event.newState !== 'open') return
      const anchor = button.current.getBoundingClientRect()
      popover.style.right = `${document.documentElement.clientWidth - anchor.right}px`
      popover.style.top = `${anchor.bottom + 4}px`
    }
    const toggled = (event) => {
      setOpen(event.newState === 'open')
      if (event.newState !== 'open') return
      const anchor = button.current.getBoundingClientRect()
      if (anchor.bottom + 4 + popover.offsetHeight > window.innerHeight)
        popover.style.top = `${anchor.top - 4 - popover.offsetHeight}px`
    }
    popover.addEventListener('beforetoggle', place)
    popover.addEventListener('toggle', toggled)
    return () => {
      popover.removeEventListener('beforetoggle', place)
      popover.removeEventListener('toggle', toggled)
    }
  }, [])

  // The popover is fixed to the viewport, so it would drift away from its button on scroll.
  useEffect(() => {
    if (!open) return
    const close = () => panel.current.hidePopover()
    window.addEventListener('scroll', close, { capture: true, passive: true })
    return () => window.removeEventListener('scroll', close, { capture: true })
  }, [open])

  return (
    <>
      <button
        ref={button}
        type="button"
        popoverTarget={id}
        aria-expanded={open}
        aria-label={ariaLabel}
        className={className}
      >
        {label}
      </button>
      <div
        ref={panel}
        id={id}
        popover="auto"
        className="fixed inset-auto m-0 min-w-40 rounded-lg border border-border bg-bg p-1 text-fg shadow-lg"
      >
        {children(() => panel.current.hidePopover())}
      </div>
    </>
  )
}

function RadioGroup({ legend, name, value, options, onChange }) {
  return (
    <fieldset className="fieldset gap-2 p-2">
      <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-fg-muted">{legend}</legend>
      {options.map(([option, label]) => (
        <label key={option} className="choice">
          <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} />
          {label}
        </label>
      ))}
    </fieldset>
  )
}

export default function MemberAdmin({ copy, initialMembers, currentEmail, locale, now }) {
  const [members, setMembers] = useState(initialMembers)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // result code from the API
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(false)
  const dialog = useRef(null)

  const visible = filterMembers(members, query, roleFilter, statusFilter)
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  // Removing the last member of the last page, or a narrower filter, can leave `page` past the end.
  const currentPage = Math.min(page, pages)
  const pageMembers = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const filtering = roleFilter !== 'all' || statusFilter !== 'all'

  const run = async (body) => {
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/members/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, locale }),
      })
      const data = await res.json()
      if (data.members) setMembers(data.members)
      if (res.status >= 500) console.error(data.message)
      setResult(data.code in copy.results ? data.code : 'error')
      return res.ok
    } catch (err) {
      console.error(err)
      setResult('error')
      return false
    } finally {
      setBusy(false)
    }
  }

  const openDialog = () => {
    setResult(null)
    setAdding(true)
    dialog.current.showModal()
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (await run({ action: 'add', email, role })) {
      setEmail('')
      setRole('member')
      dialog.current.close()
    }
  }

  const handleRemove = (address) => {
    if (window.confirm(copy.confirmRemove.replace('{email}', address))) run({ action: 'remove', email: address })
  }

  const roleLabel = (member) => copy.roles[member.role]
  const lastLogin = (member) =>
    member.lastLoginAt ? relativeTime(member.lastLoginAt, now, locale) : member.hasPassword ? '–' : copy.never

  const exportCsv = () => {
    const { columns } = copy
    const rows = visible.map((member) => [
      member.email,
      member.name,
      roleLabel(member),
      copy.status[memberStatus(member)],
      member.lastLoginAt ? formatDateTime(member.lastLoginAt, locale) : '',
      formatDateTime(member.addedAt, locale),
    ])
    const csv = toCsv(
      [[copy.emailLabel, columns.name, columns.role, columns.status, columns.lastLogin, columns.addedAt], ...rows],
      locale,
    )
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    link.download = `${copy.exportFile}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    // Safari drops the download when the URL is revoked in the same task as the click.
    setTimeout(() => URL.revokeObjectURL(link.href), 0)
  }

  const resultMessage = result && (
    <p className={ERROR_CODES.includes(result) ? 'form-error' : 'form-success'}>{copy.results[result]}</p>
  )
  const headClass = 'whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-fg-muted'

  return (
    <section aria-labelledby="members-heading" className="flex flex-col gap-4">
      <h2 id="members-heading" className="text-display-sm">
        {copy.listHeading} ({members.length})
      </h2>

      <div className="overflow-hidden rounded-card border border-border bg-bg">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <SearchField
            label={copy.search}
            value={query}
            onChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
          />
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Menu
              className={filtering ? `${BUTTON_BASE} border-accent text-accent hover:bg-bg-subtle` : TOOL_BUTTON}
              label={
                <>
                  <ListFilter aria-hidden="true" className="h-4 w-4" />
                  {copy.filter}
                </>
              }
            >
              {() => (
                <div className="flex gap-6 p-2">
                  <RadioGroup
                    legend={copy.columns.role}
                    name="role-filter"
                    value={roleFilter}
                    options={[
                      ['all', copy.all],
                      ['admin', copy.roles.admin],
                      ['member', copy.roles.member],
                    ]}
                    onChange={(value) => {
                      setRoleFilter(value)
                      setPage(1)
                    }}
                  />
                  <RadioGroup
                    legend={copy.columns.status}
                    name="status-filter"
                    value={statusFilter}
                    options={[
                      ['all', copy.all],
                      ...['active', 'invited', 'locked'].map((status) => [status, copy.status[status]]),
                    ]}
                    onChange={(value) => {
                      setStatusFilter(value)
                      setPage(1)
                    }}
                  />
                </div>
              )}
            </Menu>
            <button type="button" className={TOOL_BUTTON} onClick={exportCsv} disabled={visible.length === 0}>
              <Download aria-hidden="true" className="h-4 w-4" />
              {copy.export}
            </button>
            <button type="button" className={PRIMARY_BUTTON} onClick={openDialog}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              {copy.addHeading}
            </button>
          </div>
        </div>

        {/* Inside the card, so the answer to a row action shows near the rows. */}
        <div aria-live="polite">
          {!adding && result && <div className="border-b border-border px-4 py-3">{resultMessage}</div>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] table-auto text-left text-sm">
            <thead className="bg-bg-subtle">
              <tr>
                <th scope="col" className={headClass}>
                  {copy.columns.member}
                </th>
                <th scope="col" className={headClass}>
                  {copy.columns.role}
                </th>
                <th scope="col" className={headClass}>
                  {copy.columns.lastLogin}
                </th>
                <th scope="col" className={headClass}>
                  {copy.columns.status}
                </th>
                <th scope="col" className={headClass}>
                  {copy.columns.addedAt}
                </th>
                <th scope="col" className={headClass}>
                  {copy.columns.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {pageMembers.map((member) => {
                const status = memberStatus(member)
                const isSelf = member.email === currentEmail
                const youMark = isSelf && <span className="font-normal text-fg-muted"> ({copy.you})</span>
                return (
                  <tr key={member.email} className="border-t border-border transition-colors hover:bg-bg-subtle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar member={member} />
                        <div className="min-w-0">
                          <p className="break-words font-medium text-fg">
                            {member.name || member.email}
                            {youMark}
                          </p>
                          {member.name && <p className="break-words text-fg-muted">{member.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-fg-muted">{roleLabel(member)}</td>
                    <td
                      className="whitespace-nowrap px-4 py-3 font-medium text-fg"
                      title={member.lastLoginAt ? formatDateTime(member.lastLoginAt, locale) : undefined}
                    >
                      {lastLogin(member)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[status]}`}
                      >
                        {copy.status[status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-fg-muted">
                      {formatDateTime(member.addedAt, locale)}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="text-fg-muted">–</span>
                      ) : (
                        <Menu
                          ariaLabel={copy.actionsFor.replace('{email}', member.email)}
                          className="inline-flex h-8 items-center gap-1 rounded-md border-0 px-3 text-xs font-medium hover:bg-bg aria-expanded:bg-bg"
                          label={
                            <>
                              {copy.columns.actions}
                              <ChevronDown aria-hidden="true" className="h-4 w-4" />
                            </>
                          }
                        >
                          {(close) => (
                            <>
                              {!member.hasPassword && (
                                <button
                                  type="button"
                                  className={MENU_ITEM}
                                  disabled={busy}
                                  onClick={() => {
                                    close()
                                    run({ action: 'invite', email: member.email })
                                  }}
                                >
                                  {copy.invite}
                                </button>
                              )}
                              <button
                                type="button"
                                className={MENU_ITEM}
                                disabled={busy}
                                onClick={() => {
                                  close()
                                  run({
                                    action: 'role',
                                    email: member.email,
                                    role: member.role === 'admin' ? 'member' : 'admin',
                                  })
                                }}
                              >
                                {member.role === 'admin' ? copy.makeMember : copy.makeAdmin}
                              </button>
                              <button
                                type="button"
                                className={`${MENU_ITEM} text-danger`}
                                disabled={busy}
                                onClick={() => {
                                  close()
                                  handleRemove(member.email)
                                }}
                              >
                                {copy.remove}
                              </button>
                            </>
                          )}
                        </Menu>
                      )}
                    </td>
                  </tr>
                )
              })}
              {pageMembers.length === 0 && (
                <tr className="border-t border-border">
                  <td colSpan={6} className="px-4 py-10 text-center text-fg-muted">
                    {copy.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-fg-muted">
          <p>
            {fill(copy.pageInfo, {
              from: visible.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0,
              to: (currentPage - 1) * PAGE_SIZE + pageMembers.length,
              total: visible.length,
            })}
          </p>
          {pages > 1 && (
            <nav aria-label={copy.listHeading} className="flex items-center gap-1">
              <button
                type="button"
                className={`${TOOL_BUTTON} w-10 justify-center px-0 disabled:opacity-40`}
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                aria-label={copy.previousPage}
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              </button>
              {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  type="button"
                  className={`${number === currentPage ? PRIMARY_BUTTON : TOOL_BUTTON} w-10 justify-center px-0`}
                  aria-current={number === currentPage ? 'page' : undefined}
                  aria-label={copy.page.replace('{page}', number)}
                  onClick={() => setPage(number)}
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                className={`${TOOL_BUTTON} w-10 justify-center px-0 disabled:opacity-40`}
                disabled={currentPage === pages}
                onClick={() => setPage(currentPage + 1)}
                aria-label={copy.nextPage}
              >
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </nav>
          )}
        </div>
      </div>

      <dialog
        ref={dialog}
        aria-labelledby="add-member-heading"
        onClose={() => setAdding(false)}
        // A click on the backdrop lands on the dialog element itself.
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="w-[min(34rem,calc(100vw-2rem))] rounded-card border border-border bg-bg p-0 text-fg backdrop:bg-black/60"
      >
        <form onSubmit={handleAdd} className="form p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id="add-member-heading" className="text-display-sm">
              {copy.addHeading}
            </h2>
            <button
              type="button"
              className="rounded-md border-0 p-1 text-fg-muted hover:text-fg"
              onClick={() => dialog.current.close()}
              aria-label={copy.close}
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <div className="field">
            <label htmlFor="admin-email" className="field-label">
              {copy.emailLabel}
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={copy.emailPlaceholder}
              className="input"
              disabled={busy}
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label htmlFor="admin-role" className="field-label">
              {copy.roleLabel}
            </label>
            <select
              id="admin-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input"
              disabled={busy}
            >
              <option value="member">{copy.roles.member}</option>
              <option value="admin">{copy.roles.admin}</option>
            </select>
          </div>
          <div aria-live="polite">{adding && resultMessage}</div>
          <button type="submit" className="form-submit" disabled={busy}>
            {busy ? copy.busy : copy.add}
          </button>
        </form>
      </dialog>
    </section>
  )
}
