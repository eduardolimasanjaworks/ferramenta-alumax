/**
 * Controles de zoom para sheets/modais do Calendário.
 * Espelha o CRM: +/- no overlay, scroll interno intocável.
 */
import { useState } from 'react'

const MIN = 0.7
const MAX = 1.25
const STEP = 0.1

export function useModalZoom(initial = 1) {
  const [zoom, setZoom] = useState(initial)
  const zoomIn = () => setZoom((z) => Math.min(MAX, +(z + STEP).toFixed(2)))
  const zoomOut = () => setZoom((z) => Math.max(MIN, +(z - STEP).toFixed(2)))
  const zoomReset = () => setZoom(1)
  return { zoom, zoomIn, zoomOut, zoomReset }
}

export function ModalZoomBar({
  zoom,
  onIn,
  onOut,
  onReset,
}: {
  zoom: number
  onIn: () => void
  onOut: () => void
  onReset: () => void
}) {
  return (
    <div className="modal-zoom-bar" role="toolbar" aria-label="Zoom do painel">
      <button type="button" onClick={onOut} title="Diminuir" aria-label="Zoom out">
        −
      </button>
      <button type="button" onClick={onReset} title="100%" aria-label="Zoom 100%">
        {Math.round(zoom * 100)}%
      </button>
      <button type="button" onClick={onIn} title="Aumentar" aria-label="Zoom in">
        +
      </button>
    </div>
  )
}
