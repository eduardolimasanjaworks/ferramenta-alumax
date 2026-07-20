/**
 * Sheet direito de Tarefas: overlay + lista | form | calendário.
 * Aberto pelo botão Tarefas da toolbar do CRM.
 */
import { useState } from 'react'
import {
  IconArrowUpDown,
  IconCalendarDays,
  IconChevronDown,
  IconPlus,
  IconX,
} from '@/shared/icons'
import { TarefaForm } from './TarefaForm'
import { TarefasCalendario } from './TarefasCalendario'
import { TarefasLista } from './TarefasLista'
import type { TarefaOrdenacao, TarefasView } from './types'

type Props = { onClose: () => void }

export function TarefasPanel({ onClose }: Props) {
  const [view, setView] = useState<TarefasView>('lista')
  const [ordenacao, setOrdenacao] = useState<TarefaOrdenacao>('vencimento')
  const largo = view === 'calendario'

  return (
    <div className="tarefas-overlay" role="presentation" onClick={onClose}>
      <aside
        className={`tarefas-sheet${largo ? ' is-wide' : ''}`}
        role="dialog"
        aria-labelledby="task-panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="tarefas-close"
          aria-label="Fechar"
          onClick={onClose}
        >
          <IconX />
        </button>

        {view === 'lista' ? (
          <>
            <header className="tarefas-header">
              <h2 id="task-panel-title" className="tarefas-title">
                Tarefas
              </h2>
              <div className="tarefas-header-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  title="Ver calendário"
                  onClick={() => setView('calendario')}
                >
                  <IconCalendarDays />
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setView('form')}
                >
                  <IconPlus />
                  Tarefa
                </button>
                <label className="tarefas-sort">
                  <IconArrowUpDown />
                  <select
                    value={ordenacao}
                    onChange={(e) =>
                      setOrdenacao(e.target.value as TarefaOrdenacao)
                    }
                    aria-label="Ordenar por"
                  >
                    <option value="vencimento">Vencimento</option>
                    <option value="titulo">Título</option>
                  </select>
                  <IconChevronDown />
                </label>
              </div>
            </header>
            <TarefasLista ordenacao={ordenacao} />
          </>
        ) : null}

        {view === 'form' ? (
          <TarefaForm onVoltar={() => setView('lista')} />
        ) : null}

        {view === 'calendario' ? (
          <TarefasCalendario onLista={() => setView('lista')} />
        ) : null}
      </aside>
    </div>
  )
}
