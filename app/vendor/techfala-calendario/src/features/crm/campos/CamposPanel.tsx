/**
 * Sheet direito de Campos Personalizados.
 * Aberto pelo botão Campos da toolbar; lista ou formulário.
 */
import { useState } from 'react'
import { IconPlus, IconX } from '@/shared/icons'
import { CampoForm } from './CampoForm'
import { CamposLista } from './CamposLista'
import type { CamposView } from './types'

type Props = { onClose: () => void }

export function CamposPanel({ onClose }: Props) {
  const [view, setView] = useState<CamposView>('lista')

  return (
    <div className="campos-overlay" role="presentation" onClick={onClose}>
      <aside
        className="campos-sheet"
        role="dialog"
        aria-labelledby="custom-fields-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="campos-close"
          aria-label="Fechar"
          onClick={onClose}
        >
          <IconX />
        </button>

        {view === 'lista' ? (
          <>
            <header className="campos-header">
              <h2 id="custom-fields-modal-title" className="campos-title">
                Campos Personalizados
              </h2>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setView('form')}
              >
                <IconPlus />
                Campo
              </button>
            </header>
            <CamposLista />
          </>
        ) : (
          <CampoForm onVoltar={() => setView('lista')} />
        )}
      </aside>
    </div>
  )
}
