/**
 * Regras de status visual da tarefa (vencida vs pendente/concluída).
 * Usado nos badges da lista e no filtro “Vencidas”.
 */

import type { Tarefa, TarefaStatus } from './types'

/** Compara só a data (YYYY-MM-DD) com o dia de hoje local. */
export function isVencida(t: Tarefa, hoje = new Date()): boolean {
  if (t.status === 'concluida') return false
  if (!t.vencimento) return false
  const [y, m, d] = t.vencimento.split('-').map(Number)
  if (!y || !m || !d) return false
  const due = new Date(y, m - 1, d)
  const start = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  return due < start
}

export function rotuloStatus(t: Tarefa): string {
  if (isVencida(t)) return 'Vencida'
  if (t.status === 'concluida') return 'Concluída'
  if (t.status === 'em_andamento') return 'Em andamento'
  return 'Pendente'
}

export function classeBadge(t: Tarefa): string {
  if (isVencida(t)) return 'tarefa-badge is-vencida'
  if (t.status === 'concluida') return 'tarefa-badge is-ok'
  if (t.status === 'em_andamento') return 'tarefa-badge is-andamento'
  return 'tarefa-badge is-pendente'
}

export function formatarVencimento(isoDate: string): string {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.split('-')
  if (!y || !m || !d) return isoDate
  return `${d}/${m}/${y}`
}

export const STATUS_OPCOES: { value: TarefaStatus; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluída' },
]
