/**
 * Filtra e ordena a lista do painel de Tarefas.
 * Mantém a lógica fora do JSX para manutenção fácil.
 */

import { isVencida } from './tarefaStatus'
import type { Tarefa, TarefaFiltro, TarefaOrdenacao } from './types'

export function filtrarTarefas(
  lista: Tarefa[],
  filtro: TarefaFiltro,
  ordenacao: TarefaOrdenacao,
): Tarefa[] {
  let out = lista
  if (filtro === 'pendentes') {
    out = lista.filter((t) => t.status !== 'concluida' && !isVencida(t))
  } else if (filtro === 'concluidas') {
    out = lista.filter((t) => t.status === 'concluida')
  } else if (filtro === 'vencidas') {
    out = lista.filter((t) => isVencida(t))
  }

  return [...out].sort((a, b) => {
    if (ordenacao === 'titulo') {
      return a.titulo.localeCompare(b.titulo, 'pt-BR')
    }
    return (a.vencimento || '').localeCompare(b.vencimento || '')
  })
}
