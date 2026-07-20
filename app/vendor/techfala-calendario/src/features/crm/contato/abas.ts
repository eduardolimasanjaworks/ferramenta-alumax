/**
 * Definição das abas da área interna do contato.
 * Sem Automações (removida a pedido).
 */

export type AbaContatoId =
  | 'dados'
  | 'personalizados'
  | 'tags'
  | 'arquivos'
  | 'tarefas'
  | 'notas'
  | 'eventos'
  | 'interacoes'
  | 'timeline'

export const ABAS_CONTATO: { id: AbaContatoId; label: string }[] = [
  { id: 'dados', label: 'Dados' },
  { id: 'personalizados', label: 'Dados personalizados' },
  { id: 'tags', label: 'Tags' },
  { id: 'arquivos', label: 'Arquivos' },
  { id: 'tarefas', label: 'Tarefas' },
  { id: 'notas', label: 'Notas' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'interacoes', label: 'Interações' },
  { id: 'timeline', label: 'Timeline' },
]
