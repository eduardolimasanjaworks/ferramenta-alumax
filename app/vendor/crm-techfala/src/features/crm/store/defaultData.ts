/**
 * Estado inicial do Kanban (3 colunas do dump).
 * Cores: Novos Leads azul, Negociação roxo, Fechamento verde.
 */
import type { Coluna, Contato } from '@/shared/types/crm'

export const COLUNAS_PADRAO: Coluna[] = [
  { id: 'col-novos', titulo: 'Novos Leads', cor: 'rgb(59, 130, 246)', ordem: 0 },
  {
    id: 'col-negociacao',
    titulo: 'Em Negociação',
    cor: 'rgb(139, 92, 246)',
    ordem: 1,
  },
  {
    id: 'col-fechamento',
    titulo: 'Fechamento',
    cor: 'rgb(16, 185, 129)',
    ordem: 2,
  },
]

export const CONTATOS_PADRAO: Contato[] = []

export const CRM_STORAGE_KEY = 'techfala-crm-v1'
export const ZOOM_MIN = 0.7
export const ZOOM_MAX = 1.3
export const ZOOM_STEP = 0.1
