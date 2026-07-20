/**
 * Painel lateral “Editar Contato” — largo, redimensionável e responsivo.
 * Arraste a borda esquerda para ajustar a largura.
 */
import { useState } from 'react'
import { IconX } from '@/shared/icons'
import { ModalZoomBar, useModalZoom } from '@/shared/ui/ModalZoom'
import { useCrm } from '../store/crmStore'
import { ABAS_CONTATO, type AbaContatoId } from './abas'
import { usePanelWidth } from './usePanelWidth'
import { AbaArquivos } from './AbaArquivos'
import { AbaDados } from './AbaDados'
import { AbaInteracoes } from './AbaInteracoes'
import { AbaNotas } from './AbaNotas'
import { AbaPersonalizados } from './AbaPersonalizados'
import { AbaTags } from './AbaTags'
import { AbaTarefas } from './AbaTarefas'
import { AbaTimeline } from './AbaTimeline'

export function ContatoPanel() {
  const { contatoAberto, fecharContato, removerContato, flushContatoPendentes } =
    useCrm()
  const [aba, setAba] = useState<AbaContatoId>('dados')
  const { cssWidth, startResize, canResize } = usePanelWidth()
  const { zoom, zoomIn, zoomOut, zoomReset } = useModalZoom()

  if (!contatoAberto) return null

  const c = contatoAberto

  function fecharSalvando() {
    void flushContatoPendentes(c.id).finally(() => fecharContato())
  }
  return (
    <div className="contato-overlay" role="presentation" onClick={fecharSalvando}>
      <aside
        className="contato-panel"
        role="dialog"
        aria-label="Editar Contato"
        style={{ width: cssWidth, transform: `scale(${zoom})`, transformOrigin: 'top right' }}
        onClick={(e) => e.stopPropagation()}
      >
        {canResize ? (
          <div
            className="contato-resize"
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionar painel"
            title="Arraste para ajustar a largura"
            onPointerDown={startResize}
          />
        ) : null}

        <header className="contato-header">
          <div className="contato-header-text">
            <h2>Editar Contato</h2>
            <p className="contato-sub">{c.nome}</p>
          </div>
          <div className="contato-header-tools">
            <ModalZoomBar
              zoom={zoom}
              onIn={zoomIn}
              onOut={zoomOut}
              onReset={zoomReset}
            />
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              aria-label="Fechar"
              onClick={fecharSalvando}
            >
              <IconX />
            </button>
          </div>
        </header>

        <nav className="contato-tabs" aria-label="Seções do contato">
          {ABAS_CONTATO.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`contato-tab${aba === t.id ? ' is-active' : ''}`}
              onClick={() => setAba(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="contato-body">
          {aba === 'dados' ? <AbaDados contato={c} /> : null}
          {aba === 'personalizados' ? <AbaPersonalizados contato={c} /> : null}
          {aba === 'tags' ? <AbaTags contato={c} /> : null}
          {aba === 'arquivos' ? <AbaArquivos contato={c} /> : null}
          {aba === 'tarefas' ? <AbaTarefas contato={c} /> : null}
          {aba === 'notas' ? <AbaNotas contato={c} /> : null}
          {aba === 'interacoes' ? <AbaInteracoes contato={c} /> : null}
          {aba === 'timeline' ? <AbaTimeline contato={c} /> : null}
        </div>

        <footer className="contato-footer">
          <button
            type="button"
            className="btn btn-outline danger-text"
            onClick={() => {
              if (window.confirm('Excluir este contato?')) removerContato(c.id)
            }}
          >
            Excluir
          </button>
          <button type="button" className="btn btn-primary" onClick={fecharSalvando}>
            Concluir
          </button>
        </footer>
      </aside>
    </div>
  )
}
