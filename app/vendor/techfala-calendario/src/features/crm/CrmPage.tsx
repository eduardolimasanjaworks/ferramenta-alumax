/**
 * Página CRM: toolbar + visualização ativa + painéis laterais.
 * Alterna views; abre Contato, Tarefas e Campos Personalizados.
 */
import { useState } from 'react'
import type { ViewMode } from '@/shared/types/views'
import { CrmProvider } from './store/crmStore'
import { CrmToolbar } from './components/CrmToolbar'
import { KanbanBoard } from './components/KanbanBoard'
import { ContatoPanel } from './contato/ContatoPanel'
import { CamposPanel } from './campos/CamposPanel'
import { CamposProvider } from './campos/camposStore'
import { TarefasPanel } from './tarefas/TarefasPanel'
import { TarefasProvider } from './tarefas/tarefasStore'
import { RowsView } from './views/RowsView'
import { ListView } from './views/ListView'
import { FunnelView } from './views/FunnelView'

function CrmBoard({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'list') return <ListView />
  if (viewMode === 'rows') return <RowsView />
  if (viewMode === 'funnel') return <FunnelView />
  return <KanbanBoard />
}

export function CrmPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [tarefasAberto, setTarefasAberto] = useState(false)
  const [camposAberto, setCamposAberto] = useState(false)

  return (
    <CrmProvider>
      <TarefasProvider>
        <CamposProvider>
          <div className="crm-page">
            <CrmToolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onAbrirTarefas={() => setTarefasAberto(true)}
              onAbrirCampos={() => setCamposAberto(true)}
            />
            <CrmBoard viewMode={viewMode} />
            <ContatoPanel />
            {tarefasAberto ? (
              <TarefasPanel onClose={() => setTarefasAberto(false)} />
            ) : null}
            {camposAberto ? (
              <CamposPanel onClose={() => setCamposAberto(false)} />
            ) : null}
          </div>
        </CamposProvider>
      </TarefasProvider>
    </CrmProvider>
  )
}
