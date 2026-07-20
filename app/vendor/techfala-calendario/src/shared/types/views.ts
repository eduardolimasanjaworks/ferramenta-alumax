/**
 * Tipos das visualizações do CRM (kanban, linhas, lista, funil).
 * Isola o modo de view do restante do domínio.
 */
export type ViewMode = 'kanban' | 'rows' | 'list' | 'funnel'

export const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'kanban', label: 'Kanban' },
  { id: 'list', label: 'Lista' },
  { id: 'rows', label: 'Linhas' },
  { id: 'funnel', label: 'Funil' },
]
