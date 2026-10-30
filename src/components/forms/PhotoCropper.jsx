/**
 * Signature photo picker inside SignatureGenerator. Opens an image in the browser, lets the member move and zoom it
 * in a square frame, cuts the visible square to OUTPUT px as JPEG and stores it via /api/members/photo. Only the cut
 * square leaves the browser.
 * Props: copy (memberArea.signature.generator.photo), optional (the "(optional)" label), photo (path of the stored
 * photo or ''), onChange(path).
 * Styles: ./forms.css plus Tailwind utilities.
 */
import React, { useEffect, useRef, useState } from 'react'
import { UserRound } from 'lucide-react'
import { PRIMARY_BUTTON, TOOL_BUTTON } from './memberUi.jsx'

const FRAME = 224 // px, the frame on screen
const OUTPUT = 192 // px, twice the 96 px the signature shows, so it stays sharp on high-density screens
const MAX_ZOOM = 4
const STEP = 8 // px per arrow key press

// Keeps the image covering the whole frame, so no empty edge can end up in the photo.
const clamp = (offset, size) => ({
  x: Math.min(0, Math.max(FRAME - size.w, offset.x)),
  y: Math.min(0, Math.max(FRAME - size.h, offset.y)),
})

const KEY_MOVES = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, -STEP], ArrowDown: [0, STEP] }

export default function PhotoCropper({ copy, optional, photo, onChange }) {
  const [image, setImage] = useState(null) // { el, url, width, height } while cropping
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [status, setStatus] = useState(null) // { message, isError } | null
  const [busy, setBusy] = useState(false)
  const fileInput = useRef(null)
  const dragFrom = useRef(null)

  useEffect(() => () => image && URL.revokeObjectURL(image.url), [image])

  // At zoom 1 the shorter side fills the frame.
  const baseScale = image ? FRAME / Math.min(image.width, image.height) : 1
  const scale = baseScale * zoom
  const size = image ? { w: image.width * scale, h: image.height * scale } : { w: 0, h: 0 }

  const pick = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const url = URL.createObjectURL(file)
    const el = new Image()
    el.onload = () => {
      const fit = FRAME / Math.min(el.naturalWidth, el.naturalHeight)
      setImage({ el, url, width: el.naturalWidth, height: el.naturalHeight })
      setZoom(1)
      setOffset({ x: (FRAME - el.naturalWidth * fit) / 2, y: (FRAME - el.naturalHeight * fit) / 2 })
      setStatus(null)
    }
    el.onerror = () => {
      URL.revokeObjectURL(url)
      setStatus({ message: copy.unreadable, isError: true })
    }
    el.src = url
  }

  const move = (dx, dy) => setOffset((current) => clamp({ x: current.x + dx, y: current.y + dy }, size))

  // Zooms around the frame's centre, so the part in the middle stays in place.
  const changeZoom = (e) => {
    const next = Number(e.target.value)
    const ratio = next / zoom
    const centre = FRAME / 2
    const nextSize = { w: image.width * baseScale * next, h: image.height * baseScale * next }
    setOffset(clamp({ x: centre - (centre - offset.x) * ratio, y: centre - (centre - offset.y) * ratio }, nextSize))
    setZoom(next)
  }

  const startDrag = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragFrom.current = { x: e.clientX, y: e.clientY }
  }
  const drag = (e) => {
    if (!dragFrom.current) return
    move(e.clientX - dragFrom.current.x, e.clientY - dragFrom.current.y)
    dragFrom.current = { x: e.clientX, y: e.clientY }
  }
  const endDrag = () => {
    dragFrom.current = null
  }
  const moveByKey = (e) => {
    const step = KEY_MOVES[e.key]
    if (!step) return
    e.preventDefault()
    move(...step)
  }

  const send = async (method, body) => {
    setBusy(true)
    try {
      const res = await fetch('/api/members/photo', {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body && JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`/api/members/photo answered ${res.status}`)
      const { path } = await res.json()
      onChange(path)
      return true
    } catch (err) {
      console.error(err)
      setStatus({ message: copy.failed, isError: true })
      return false
    } finally {
      setBusy(false)
    }
  }

  const save = async () => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = OUTPUT
    const context = canvas.getContext('2d')
    // JPEG has no transparency; a transparent PNG would otherwise turn black.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, OUTPUT, OUTPUT)
    context.drawImage(image.el, -offset.x / scale, -offset.y / scale, FRAME / scale, FRAME / scale, 0, 0, OUTPUT, OUTPUT)
    if (await send('POST', { image: canvas.toDataURL('image/jpeg', 0.88) })) {
      setImage(null)
      setStatus({ message: copy.saved, isError: false })
    }
  }

  const remove = async () => {
    if (await send('DELETE')) setStatus({ message: copy.removed, isError: false })
  }

  return (
    <div className="field">
      <span className="field-label">
        {copy.label} <span className="text-fg-subtle">{optional}</span>
      </span>
      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="sr-only" tabIndex={-1} aria-hidden="true" />

      {image ? (
        <div className="flex flex-col gap-4">
          <div
            role="group"
            tabIndex={0}
            aria-label={copy.frame}
            onPointerDown={startDrag}
            onPointerMove={drag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={moveByKey}
            className="relative cursor-grab touch-none select-none overflow-hidden rounded-lg bg-bg-subtle outline-offset-2 active:cursor-grabbing"
            style={{ width: FRAME, height: FRAME }}
          >
            <img
              src={image.url}
              alt=""
              draggable={false}
              className="pointer-events-none absolute"
              style={{ left: offset.x, top: offset.y, width: size.w, height: size.h, maxWidth: 'none' }}
            />
            {/* Dims the corners: the round crop most mail programs show; Outlook for Windows shows the full square. */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: '0 0 0 999px rgb(0 0 0 / 0.4)' }} />
          </div>
          <div className="flex flex-col gap-1" style={{ maxWidth: FRAME }}>
            <label htmlFor="signature-photo-zoom" className="field-label">
              {copy.zoom}
            </label>
            <input id="signature-photo-zoom" type="range" min="1" max={MAX_ZOOM} step="0.01" value={zoom} onChange={changeZoom} />
          </div>
          <p className="field-hint text-sm">{copy.cropHint}</p>
          <div className="form-actions">
            <button type="button" className={PRIMARY_BUTTON} onClick={save} disabled={busy}>
              {copy.save}
            </button>
            <button type="button" className={TOOL_BUTTON} onClick={() => setImage(null)} disabled={busy}>
              {copy.cancel}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {photo ? (
            <img src={photo} alt={copy.current} width="56" height="56" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-border-strong text-fg-subtle">
              <UserRound className="h-6 w-6" />
            </span>
          )}
          <button type="button" className={TOOL_BUTTON} onClick={() => fileInput.current.click()} disabled={busy}>
            {photo ? copy.change : copy.upload}
          </button>
          {photo && (
            <button type="button" className={TOOL_BUTTON} onClick={remove} disabled={busy}>
              {copy.remove}
            </button>
          )}
        </div>
      )}
      {!image && <p className="field-hint text-sm">{copy.hint}</p>}
      <div aria-live="polite">{status && <p className={status.isError ? 'form-error' : 'form-success'}>{status.message}</p>}</div>
    </div>
  )
}
