/**
 * Lista do painel: chips de filtro + cards.
 * Ordenação fica no cabeçalho do TarefasPanel (como no dump).
 */
import { useMemo, useState } from 'react'
import { filtrarTarefas } from './filtrarTarefas'
import { TarefaCard } from './TarefaCard'
import { useTarefas } from './tarefasStore'
import type { TarefaFiltro, TarefaOrdenacao } from './types'

const FILTROS: { id: TarefaFiltro; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'pendentes', label: 'Pendentes' },
  { id: 'concluidas', label: 'Concluídas' },
  { id: 'vencidas', label: 'Vencidas' },
]

type Props = { ordenacao: TarefaOrdenacao }

export function TarefasLista({ ordenacao }: Props) {
  const { tarefas, concluir, remover } = useTarefas()
  const [filtro, setFiltro] = useState<TarefaFiltro>('todas')

  const lista = useMemo(
    () => filtrarTarefas(tarefas, filtro, ordenacao),
    [tarefas, filtro, ordenacao],
  )

  return (
    <>
      <div className="tarefas-filtros">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`btn btn-pill${filtro === f.id ? ' is-active' : ''}`}
            onClick={() => setFiltro(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="tarefas-lista-scroll">
        {lista.length === 0 ? (
          <p className="tarefas-vazio">Nenhuma tarefa neste filtro.</p>
        ) : (
          lista.map((t) => (
            <TarefaCard
              key={t.id}
              tarefa={t}
              onConcluir={concluir}
              onRemover={remover}
            />
          ))
        )}
      </div>
    </>
  )
}
