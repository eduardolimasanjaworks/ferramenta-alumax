/**
 * App raiz: só o CRM (Kanban).
 * A sidebar de módulos mortos foi removida — a navegação fica no painel hospedeiro.
 */
import { CrmPage } from '@/features/crm/CrmPage'

export function App() {
  return <CrmPage />
}
