/**
 * Badge de status da campanha — leitura rápida na lista.
 */
import type { StatusCampanha } from './types'

const LABELS: Record<StatusCampanha, string> = {
  rascunho: 'Rascunho',
  agendada: 'Agendada',
  em_andamento: 'Em andamento',
  pausada: 'Pausada',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

export function StatusBadge({ status }: { status: StatusCampanha }) {
  return <span className={`cp-badge is-${status}`}>{LABELS[status]}</span>
}
