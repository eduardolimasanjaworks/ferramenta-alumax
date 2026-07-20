/**
 * Agrupa itens da timeline por dia (chave ISO date).
 * Usado pela timeline horizontal.
 */
import type { TimelineItem } from '@/shared/types/crm'
import { rotuloDiaTimeline } from './format'

export type GrupoTimeline = {
  chave: string
  rotulo: string
  itens: TimelineItem[]
}

export function agruparTimeline(itens: TimelineItem[]): GrupoTimeline[] {
  const map = new Map<string, TimelineItem[]>()
  const ordenados = [...itens].sort(
    (a, b) => new Date(a.em).getTime() - new Date(b.em).getTime(),
  )
  for (const item of ordenados) {
    const d = new Date(item.em)
    const chave = Number.isNaN(d.getTime())
      ? item.em
      : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const lista = map.get(chave) ?? []
    lista.push(item)
    map.set(chave, lista)
  }
  return [...map.entries()].map(([chave, group]) => ({
    chave,
    rotulo: rotuloDiaTimeline(group[0].em),
    itens: group,
  }))
}

export function corTipo(tipo: string): string {
  if (tipo === 'lead') return 'teal'
  if (tipo === 'bot') return 'purple'
  if (tipo === 'kanban') return 'sky'
  if (tipo === 'nota') return 'yellow'
  if (tipo === 'tarefa') return 'green'
  if (tipo === 'evento') return 'orange'
  return 'sky'
}
