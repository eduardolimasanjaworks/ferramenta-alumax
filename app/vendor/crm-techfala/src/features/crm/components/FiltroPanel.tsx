/**
 * Painel de filtros do CRM (etapa, tags, telefone/email).
 * Modal fixo com scroll e zoom — lista longa de tags não corta.
 */
import { useMemo } from 'react'
import { IconFilter, IconX } from '@/shared/icons'
import { ModalZoomBar, useModalZoom } from '@/shared/ui/ModalZoom'
import { useCrm, type CrmFiltro } from '../store/crmStore'
import { useTags } from '../tags/tagsStore'

type Props = {
  aberto: boolean
  onToggle: () => void
  onClose: () => void
}

export function FiltroPanel({ aberto, onToggle, onClose }: Props) {
  const { colunasOrdenadas, contatos, filtro, setFiltro, limparFiltro } =
    useCrm()
  const { tags: catalogTags } = useTags()
  const { zoom, zoomIn, zoomOut, zoomReset } = useModalZoom()

  const tags = useMemo(() => {
    const set = new Set<string>()
    for (const c of contatos) for (const t of c.tags) set.add(t)
    for (const t of catalogTags) {
      if (t.ativo) set.add(t.nome)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [contatos, catalogTags])

  const ativo =
    filtro.colunaIds.length > 0 ||
    filtro.tags.length > 0 ||
    filtro.comTelefone ||
    filtro.comEmail

  function toggleColuna(id: string) {
    setFiltro({
      colunaIds: filtro.colunaIds.includes(id)
        ? filtro.colunaIds.filter((x) => x !== id)
        : [...filtro.colunaIds, id],
    })
  }

  function toggleTag(tag: string) {
    setFiltro({
      tags: filtro.tags.includes(tag)
        ? filtro.tags.filter((x) => x !== tag)
        : [...filtro.tags, tag],
    })
  }

  function patch(p: Partial<CrmFiltro>) {
    setFiltro(p)
  }

  return (
    <div className="filtro-wrap">
      <button
        type="button"
        className={`btn btn-icon${ativo || aberto ? ' is-active-filter' : ''}`}
        aria-label="Filtrar"
        aria-expanded={aberto}
        onClick={onToggle}
      >
        <IconFilter />
      </button>

      {aberto ? (
        <div
          className="filtro-backdrop"
          role="presentation"
          onClick={onClose}
        >
          <div
            className="filtro-panel"
            role="dialog"
            aria-label="Filtros"
            style={{ transform: `scale(${zoom})` }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="filtro-panel-head">
              <strong>Filtros</strong>
              <div className="filtro-panel-tools">
                <ModalZoomBar
                  zoom={zoom}
                  onIn={zoomIn}
                  onOut={zoomOut}
                  onReset={zoomReset}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-icon sm"
                  aria-label="Fechar filtros"
                  onClick={onClose}
                >
                  <IconX />
                </button>
              </div>
            </header>

            <div className="filtro-panel-body">
              <section className="filtro-sec">
                <h4>Etapa</h4>
                <div className="filtro-chips">
                  {colunasOrdenadas.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`filtro-chip${filtro.colunaIds.includes(c.id) ? ' is-on' : ''}`}
                      onClick={() => toggleColuna(c.id)}
                    >
                      <span className="dot" style={{ background: c.cor }} />
                      {c.titulo}
                    </button>
                  ))}
                </div>
              </section>

              {tags.length > 0 ? (
                <section className="filtro-sec">
                  <h4>Tags</h4>
                  <div className="filtro-chips">
                    {tags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`filtro-chip${filtro.tags.includes(t) ? ' is-on' : ''}`}
                        onClick={() => toggleTag(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="filtro-sec">
                <h4>Contato</h4>
                <label className="filtro-check">
                  <input
                    type="checkbox"
                    checked={filtro.comTelefone}
                    onChange={(e) => patch({ comTelefone: e.target.checked })}
                  />
                  Com telefone
                </label>
                <label className="filtro-check">
                  <input
                    type="checkbox"
                    checked={filtro.comEmail}
                    onChange={(e) => patch({ comEmail: e.target.checked })}
                  />
                  Com e-mail
                </label>
              </section>

              {ativo ? (
                <button
                  type="button"
                  className="btn btn-outline filtro-clear"
                  onClick={() => {
                    limparFiltro()
                  }}
                >
                  Limpar filtros
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
