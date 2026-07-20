/**
 * Modal central “Selecionar Agenda”.
 * Lista agendas, abre Nova Agenda ou Configurar.
 */
import { IconPlus, IconX } from '@/shared/icons'
import { useCalendario } from '../store/calendarioStore'
import type { Agenda } from '../types'

type Props = {
  onClose: () => void
  onNova: () => void
  onConfigurar: (agenda: Agenda) => void
}

export function AgendasModal({ onClose, onNova, onConfigurar }: Props) {
  const { agendas } = useCalendario()

  return (
    <div className="cal-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="cal-modal"
        role="dialog"
        aria-label="Selecionar Agenda"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cal-modal-head">
          <h2>Selecionar Agenda</h2>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fechar">
            <IconX />
          </button>
        </header>

        <button type="button" className="btn btn-primary cal-modal-nova" onClick={onNova}>
          <IconPlus />
          Nova Agenda
        </button>

        {agendas.length === 0 ? (
          <div className="cal-modal-empty">
            <p>Selecione uma agenda para configurar</p>
          </div>
        ) : (
          <ul className="cal-agenda-list">
            {agendas.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="cal-agenda-item"
                  onClick={() => onConfigurar(a)}
                >
                  <span className="cal-lista-dot" style={{ background: a.cor }} />
                  <span className="cal-agenda-nome">{a.nome}</span>
                  <span className={`campo-badge${a.ativo ? ' is-ativo' : ''}`}>
                    {a.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
