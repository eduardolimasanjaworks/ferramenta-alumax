/**
 * Painel lateral “Editar Contato” — largo, redimensionável e responsivo.
 * Arraste a borda esquerda para ajustar a largura.
 */
import { useState } from 'react'
import { IconX } from '@/shared/icons'
import { useCrm } from '../store/crmStore'
import { ABAS_CONTATO, type AbaContatoId } from './abas'
import { usePanelWidth } from './usePanelWidth'
import { AbaArquivos } from './AbaArquivos'
import { AbaDados } from './AbaDados'
import { AbaEventos } from './AbaEventos'
import { AbaInteracoes } from './AbaInteracoes'
import { AbaNotas } from './AbaNotas'
import { AbaPersonalizados } from './AbaPersonalizados'
import { AbaTags } from './AbaTags'
import { AbaTarefas } from './AbaTarefas'
import { AbaTimeline } from './AbaTimeline'

export function ContatoPanel() {
  const { contatoAberto, fecharContato, removerContato } = useCrm()
  const [aba, setAba] = useState<AbaContatoId>('dados')
  const { width, startResize } = usePanelWidth()

  if (!contatoAberto) return null

  const c = contatoAberto

  return (
    <div className="contato-overlay" role="presentation" onClick={fecharContato}>
      <aside
        className="contato-panel"
        role="dialog"
        aria-label="Editar Contato"
        style={{ width: `min(${width}px, 100vw)` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="contato-resize"
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionar painel"
          title="Arraste para ajustar a largura"
          onPointerDown={startResize}
        />

        <header className="contato-header">
          <div className="contato-header-text">
            <h2>Editar Contato</h2>
            <p className="contato-sub">{c.nome}</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            aria-label="Fechar"
            onClick={fecharContato}
          >
            <IconX />
          </button>
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
          {aba === 'eventos' ? <AbaEventos contato={c} /> : null}
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
          <button type="button" className="btn btn-primary" onClick={fecharContato}>
            Salvar
          </button>
        </footer>
      </aside>
    </div>
  )
}
