/**
 * Card de uma tarefa na lista do painel.
 * Clique no card é reservado; check conclui e lixeira remove.
 */
import { IconCalendar, IconCheck, IconTrash } from '@/shared/icons'
import {
  classeBadge,
  formatarVencimento,
  rotuloStatus,
} from './tarefaStatus'
import type { Tarefa } from './types'

type Props = {
  tarefa: Tarefa
  onConcluir: (id: string) => void
  onRemover: (id: string) => void
}

export function TarefaCard({ tarefa, onConcluir, onRemover }: Props) {
  return (
    <div className="tarefa-card">
      <div className="tarefa-card-body">
        <div className="tarefa-card-top">
          <span className="tarefa-card-titulo">{tarefa.titulo}</span>
          <span className={classeBadge(tarefa)}>{rotuloStatus(tarefa)}</span>
        </div>
        {tarefa.descricao ? (
          <p className="tarefa-card-desc">{tarefa.descricao}</p>
        ) : null}
        <div className="tarefa-card-meta">
          <IconCalendar />
          {formatarVencimento(tarefa.vencimento)}
        </div>
      </div>
      <div className="tarefa-card-acoes">
        {tarefa.status !== 'concluida' ? (
          <button
            type="button"
            className="tarefa-acao is-ok"
            title="Marcar como concluída"
            onClick={() => onConcluir(tarefa.id)}
          >
            <IconCheck />
          </button>
        ) : null}
        <button
          type="button"
          className="tarefa-acao is-danger"
          title="Excluir"
          onClick={() => onRemover(tarefa.id)}
        >
          <IconTrash />
        </button>
      </div>
    </div>
  )
}
