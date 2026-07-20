/**
 * Toolbar do CRM: busca, filtro real, views, zoom e ações.
 */
import { useEffect, useState } from 'react'
import {
  IconArrowUpDown,
  IconDownload,
  IconExpand,
  IconLayoutGrid,
  IconList,
  IconPlus,
  IconRefresh,
  IconRows,
  IconSearch,
  IconSliders,
  IconUpload,
  IconZoomIn,
  IconZoomOut,
} from '@/shared/icons'
import type { ViewMode } from '@/shared/types/views'
import { useCrm } from '../store/crmStore'
import { FiltroPanel } from './FiltroPanel'
import { PipelinesBar } from './PipelinesBar'
import {
  ImportCsvModal,
  useExportarContatosCsv,
} from './ImportExportContatos'

type Props = {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onAbrirTags: () => void
  onAbrirCampos: () => void
}

const VIEW_BTNS: { id: ViewMode; label: string; Icon: typeof IconLayoutGrid }[] =
  [
    { id: 'kanban', label: 'Kanban', Icon: IconLayoutGrid },
    { id: 'list', label: 'Lista', Icon: IconList },
    { id: 'rows', label: 'Linhas', Icon: IconRows },
    { id: 'funnel', label: 'Funil', Icon: IconArrowUpDown },
  ]

export function CrmToolbar({
  viewMode,
  onViewModeChange,
  onAbrirTags,
  onAbrirCampos,
}: Props) {
  const {
    busca,
    setBusca,
    zoomIn,
    zoomOut,
    adicionarColuna,
    sincronizarAtendimento,
    syncAtendimentoEmAndamento,
    pipelineId,
    setPipelineId,
  } = useCrm()
  const [filtroAberto, setFiltroAberto] = useState(false)
  const [importAberto, setImportAberto] = useState(false)
  const exportarCsv = useExportarContatosCsv()

  useEffect(() => {
    if (!filtroAberto) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFiltroAberto(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtroAberto])

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen()
    } else {
      void document.exitFullscreen()
    }
  }

  return (
    <div className="crm-toolbar">
      <div className="search-wrap">
        <IconSearch className="icon-search" />
        <input
          className="input pl-10"
          placeholder="Buscar contatos..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <FiltroPanel
        aberto={filtroAberto}
        onToggle={() => setFiltroAberto((v) => !v)}
        onClose={() => setFiltroAberto(false)}
      />

      <div className="view-modes">
        <div className="view-modes-group" id="crm-view-mode-selector">
          {VIEW_BTNS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`view-mode-btn${viewMode === id ? ' is-active' : ''}`}
              aria-label={label}
              aria-pressed={viewMode === id}
              onClick={() => onViewModeChange(id)}
            >
              <Icon />
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <>
          <button
            type="button"
            className="btn btn-icon"
            title="Diminuir zoom"
            onClick={zoomOut}
          >
            <IconZoomOut />
          </button>
          <button
            type="button"
            className="btn btn-icon"
            title="Aumentar zoom"
            onClick={zoomIn}
          >
            <IconZoomIn />
          </button>
        </>
      ) : null}

      <div className="toolbar-right">
        <PipelinesBar
          pipelineId={pipelineId}
          onChange={(id) => setPipelineId(id)}
        />
        <button
          type="button"
          className="btn btn-icon sm"
          onClick={toggleFullscreen}
          aria-label="Tela cheia"
        >
          <IconExpand />
        </button>

        <button
          type="button"
          className="btn btn-primary"
          title="Nova Coluna"
          onClick={() => adicionarColuna()}
        >
          <IconPlus />
          <span className="btn-label">Nova Coluna</span>
        </button>

        <button
          type="button"
          className="btn btn-outline"
          title="Importar contatos via CSV"
          onClick={() => setImportAberto(true)}
        >
          <IconUpload />
          <span className="btn-label">Importar</span>
        </button>

        <button
          type="button"
          className="btn btn-outline"
          title="Exportar contatos filtrados em CSV"
          onClick={exportarCsv}
        >
          <IconDownload />
          <span className="btn-label">Exportar</span>
        </button>

        <button
          type="button"
          className="btn btn-outline"
          disabled={syncAtendimentoEmAndamento}
          title="Sincronizar contatos do Atendimento"
          onClick={() => void sincronizarAtendimento()}
        >
          <IconRefresh />
          <span className="btn-label">
            {syncAtendimentoEmAndamento ? 'Sincronizando…' : 'Sincronizar'}
          </span>
        </button>

        <button
          type="button"
          className="btn btn-outline"
          title="Tags"
          onClick={onAbrirTags}
        >
          <span className="btn-label">Tags</span>
        </button>

        <button
          type="button"
          className="btn btn-outline"
          title="Campos personalizados"
          onClick={onAbrirCampos}
        >
          <IconSliders />
          <span className="btn-label">Campos</span>
        </button>
      </div>

      <ImportCsvModal
        aberto={importAberto}
        onClose={() => setImportAberto(false)}
      />
    </div>
  )
}
