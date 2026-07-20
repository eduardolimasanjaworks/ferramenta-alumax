/**
 * Board horizontal do Kanban com zoom da toolbar.
 * Agrupa contatos 1x por coluna (evita filter O(n×colunas) a cada paint).
 */
import { useMemo } from 'react'
import { useCrm } from '../store/crmStore'
import { KanbanColumn } from './KanbanColumn'
import type { Contato } from '@/shared/types/crm'

export function KanbanBoard() {
  const { colunasOrdenadas, contatosFiltrados, zoom } = useCrm()

  const porColuna = useMemo(() => {
    const map = new Map<string, Contato[]>()
    for (const c of contatosFiltrados) {
      const list = map.get(c.colunaId)
      if (list) list.push(c)
      else map.set(c.colunaId, [c])
    }
    return map
  }, [contatosFiltrados])

  return (
    <div className="kanban-scroll">
      <div
        className="kanban-board"
        style={{
          transform: `scale(${zoom})`,
          width: `${100 / zoom}%`,
        }}
      >
        {colunasOrdenadas.map((coluna) => (
          <KanbanColumn
            key={coluna.id}
            coluna={coluna}
            contatos={porColuna.get(coluna.id) ?? []}
          />
        ))}
      </div>
    </div>
  )
}
