/**
 * Painel lateral para gerenciar o catálogo de tags.
 * Lista simples com adicionar/remover, estilo leve como Campos.
 */
import { useState } from 'react'
import { IconX } from '@/shared/icons'
import { useResizableWidth } from '@/shared/lib/useResizableWidth'
import { useTags } from './tagsStore'

type Props = { onClose: () => void }

export function TagsPanel({ onClose }: Props) {
  const { tags, criarTag, removerTag } = useTags()
  const [nova, setNova] = useState('')
  const [erro, setErro] = useState('')
  const { cssWidth, startResize, canResize } = useResizableWidth({
    storageKey: 'techfala-tags-panel-w',
    minDesktop: 320,
    defaultRatio: 0.35,
  })

  async function adicionar() {
    const t = nova.trim()
    if (!t) {
      setErro('Digite o nome da tag.')
      return
    }
    if (tags.some((x) => x.nome.toLowerCase() === t.toLowerCase() && x.ativo)) {
      setErro('Essa tag já existe.')
      return
    }
    try {
      await criarTag({ nome: t })
      setNova('')
      setErro('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível criar a tag.')
    }
  }

  const ativas = tags.filter((t) => t.ativo)

  return (
    <div className="campos-overlay" role="presentation" onClick={onClose}>
      <aside
        className="campos-sheet"
        role="dialog"
        aria-labelledby="tags-panel-title"
        style={{ width: cssWidth, maxWidth: '100vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {canResize ? (
          <div
            className="sheet-resize"
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionar painel"
            onPointerDown={startResize}
          />
        ) : null}
        <button
          type="button"
          className="campos-close"
          aria-label="Fechar"
          onClick={onClose}
        >
          <IconX />
        </button>

        <header className="campos-header">
          <h2 id="tags-panel-title" className="campos-title">
            Tags
          </h2>
        </header>

        <div className="campos-lista-scroll">
          <div className="inline-add" style={{ marginBottom: '1rem' }}>
            <input
              className="input"
              placeholder="Nova tag"
              value={nova}
              onChange={(e) => {
                setNova(e.target.value)
                setErro('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && void adicionar()}
            />
            <button type="button" className="btn btn-primary" onClick={() => void adicionar()}>
              Adicionar
            </button>
          </div>
          {erro ? <p className="empty-hint danger-text">{erro}</p> : null}

          {ativas.length === 0 ? (
            <p className="empty-hint">Nenhuma tag cadastrada</p>
          ) : (
            <ul className="kv-list">
              {ativas.map((t) => (
                <li key={t.id}>
                  <strong>{t.nome}</strong>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon sm danger-text"
                    aria-label={`Remover ${t.nome}`}
                    onClick={() => removerTag(t.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  )
}
