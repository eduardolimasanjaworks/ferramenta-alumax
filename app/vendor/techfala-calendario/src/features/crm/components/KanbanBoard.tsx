/**
 * Board horizontal do Kanban com zoom da toolbar.
 */
import { useCrm } from '../store/crmStore'
import { KanbanColumn } from './KanbanColumn'

export function KanbanBoard() {
  const { colunasOrdenadas, contatosFiltrados, zoom } = useCrm()

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
            contatos={contatosFiltrados.filter((c) => c.colunaId === coluna.id)}
          />
        ))}
      </div>
    </div>
  )
}
