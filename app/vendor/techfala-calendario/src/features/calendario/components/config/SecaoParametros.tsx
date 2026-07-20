/**
 * Lista de parâmetros do assistente — abre o sheet Novo Parâmetro.
 * Sem variante de página pública (removida).
 */
import { useState } from 'react'
import { IconTrash } from '@/shared/icons'
import type { ParametroAgenda } from '../../types/agendaConfig'
import { CfgEmpty } from './CfgEmpty'
import { ParametroSheet } from './ParametroSheet'

type Props = {
  itens: ParametroAgenda[]
  onChange: (itens: ParametroAgenda[]) => void
  emptySub: string
}

export function SecaoParametros({ itens, onChange, emptySub }: Props) {
  const [sheet, setSheet] = useState<ParametroAgenda | 'novo' | null>(null)

  function salvar(p: ParametroAgenda) {
    const existe = itens.some((x) => x.id === p.id)
    onChange(existe ? itens.map((x) => (x.id === p.id ? p : x)) : [...itens, p])
    setSheet(null)
  }

  return (
    <>
      {itens.length === 0 ? (
        <CfgEmpty
          titulo="Ops! Nenhum parâmetro criado ainda."
          subtitulo={emptySub}
          botao="Add Parâmetros"
          onAdd={() => setSheet('novo')}
        />
      ) : (
        <div className="cfg-stack">
          {itens.map((p) => (
            <button
              key={p.id}
              type="button"
              className="cfg-card cfg-list-btn"
              onClick={() => setSheet(p)}
            >
              <div className="cfg-card-top">
                <strong>{p.nome || 'Sem nome'}</strong>
                <span
                  role="button"
                  tabIndex={0}
                  className="btn btn-ghost btn-icon"
                  aria-label="Remover"
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange(itens.filter((x) => x.id !== p.id))
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation()
                      onChange(itens.filter((x) => x.id !== p.id))
                    }
                  }}
                >
                  <IconTrash />
                </span>
              </div>
              <p className="cfg-card-meta">
                {p.solicitarAo || '—'} · {p.tipo || '—'}
              </p>
            </button>
          ))}
          <button
            type="button"
            className="btn btn-outline cfg-add-btn"
            onClick={() => setSheet('novo')}
          >
            Add Parâmetros
          </button>
        </div>
      )}

      {sheet ? (
        <ParametroSheet
          inicial={sheet === 'novo' ? null : sheet}
          onClose={() => setSheet(null)}
          onSalvar={salvar}
        />
      ) : null}
    </>
  )
}
