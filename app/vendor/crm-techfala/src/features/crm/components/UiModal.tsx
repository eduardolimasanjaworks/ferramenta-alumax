/**
 * Modal base do CRM — overlay + painel com scroll e zoom.
 * Nunca usa window.prompt; corpo rola e cabe em mobile.
 */
import type { ReactNode } from 'react'
import { ModalZoomBar, useModalZoom } from '@/shared/ui/ModalZoom'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

export function UiModal({ title, onClose, children, wide }: Props) {
  const { zoom, zoomIn, zoomOut, zoomReset } = useModalZoom()
  return (
    <div
      className="ui-modal-overlay"
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        className={`ui-modal${wide ? ' is-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ui-modal-title"
        style={{ transform: `scale(${zoom})` }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ui-modal-head">
          <h2 id="ui-modal-title">{title}</h2>
          <div className="ui-modal-head-tools">
            <ModalZoomBar
              zoom={zoom}
              onIn={zoomIn}
              onOut={zoomOut}
              onReset={zoomReset}
            />
            <button
              type="button"
              className="btn btn-ghost btn-icon sm"
              aria-label="Fechar"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </header>
        <div className="ui-modal-body">{children}</div>
      </div>
    </div>
  )
}
