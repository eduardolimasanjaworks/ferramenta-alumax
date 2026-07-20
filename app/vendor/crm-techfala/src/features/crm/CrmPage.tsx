/**
 * Página CRM: toolbar + visualização ativa + painéis laterais.
 * Alterna views; abre Contato, Tags e Campos Personalizados.
 */
import { useState } from 'react'
import type { ViewMode } from '@/shared/types/views'
import { CrmProvider, useCrm } from './store/crmStore'
import { CrmToolbar } from './components/CrmToolbar'
import { KanbanBoard } from './components/KanbanBoard'
import { ContatoPanel } from './contato/ContatoPanel'
import { CamposPanel } from './campos/CamposPanel'
import { CamposProvider } from './campos/camposStore'
import { TagsPanel } from './tags/TagsPanel'
import { TagsProvider } from './tags/tagsStore'
import { UsuariosProvider } from './usuarios/usuariosStore'
import { RowsView } from './views/RowsView'
import { ListView } from './views/ListView'
import { FunnelView } from './views/FunnelView'

function CrmBoard({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'list') return <ListView />
  if (viewMode === 'rows') return <RowsView />
  if (viewMode === 'funnel') return <FunnelView />
  return <KanbanBoard />
}

function CrmShell() {
  const { carregando, erro } = useCrm()
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [tagsAberto, setTagsAberto] = useState(false)
  const [camposAberto, setCamposAberto] = useState(false)

  return (
    <div className="crm-page">
      {erro ? (
        <div className="crm-banner crm-banner-erro" role="alert">
          {erro}
        </div>
      ) : null}
      {carregando ? (
        <div className="crm-banner">Carregando CRM…</div>
      ) : null}
      <CrmToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAbrirTags={() => {
          setCamposAberto(false)
          setTagsAberto(true)
        }}
        onAbrirCampos={() => {
          setTagsAberto(false)
          setCamposAberto(true)
        }}
      />
      <CrmBoard viewMode={viewMode} />
      <ContatoPanel />
      {tagsAberto ? <TagsPanel onClose={() => setTagsAberto(false)} /> : null}
      {camposAberto ? (
        <CamposPanel onClose={() => setCamposAberto(false)} />
      ) : null}
    </div>
  )
}

export function CrmPage() {
  return (
    <CrmProvider>
      <UsuariosProvider>
        <TagsProvider>
          <CamposProvider>
            <CrmShell />
          </CamposProvider>
        </TagsProvider>
      </UsuariosProvider>
    </CrmProvider>
  )
}
