/**
 * Mensagens de Êxito — empty/list; “Add” abre o sheet dedicado.
 * Clique no card reabre a sidebar para editar.
 */
import { useState } from 'react'
import { IconTrash } from '@/shared/icons'
import type { MensagemExito } from '../../types/agendaConfig'
import { normalizarTipoMsg } from '../../lib/opcoesConfigSheets'
import { CfgEmpty } from './CfgEmpty'
import { MensagemExitoSheet } from './MensagemExitoSheet'

type Props = {
  itens: MensagemExito[]
  onChange: (itens: MensagemExito[]) => void
}

export function SecaoMensagens({ itens, onChange }: Props) {
  const [sheet, setSheet] = useState<MensagemExito | 'novo' | null>(null)

  function salvar(m: MensagemExito) {
    const existe = itens.some((x) => x.id === m.id)
    onChange(existe ? itens.map((x) => (x.id === m.id ? m : x)) : [...itens, m])
    setSheet(null)
  }

  return (
    <>
      {itens.length === 0 ? (
        <CfgEmpty
          titulo="Ops! Nenhuma mensagem criada ainda."
          subtitulo="Crie mensagens de êxito e personalize o seu atendimento."
          botao="Add Mensagem"
          onAdd={() => setSheet('novo')}
        />
      ) : (
        <div className="cfg-stack">
          {itens.map((m) => (
            <button
              key={m.id}
              type="button"
              className="cfg-card cfg-list-btn"
              onClick={() => setSheet(m)}
            >
              <div className="cfg-card-top">
                <strong>{m.titulo || 'Sem título'}</strong>
                <span
                  role="button"
                  tabIndex={0}
                  className="btn btn-ghost btn-icon"
                  aria-label="Remover"
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange(itens.filter((x) => x.id !== m.id))
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation()
                      onChange(itens.filter((x) => x.id !== m.id))
                    }
                  }}
                >
                  <IconTrash />
                </span>
              </div>
              <p className="cfg-card-meta">
                {m.enviarAo || '—'} · {normalizarTipoMsg(m.tipo)} · WhatsApp
              </p>
            </button>
          ))}
          <button
            type="button"
            className="btn btn-outline cfg-add-btn"
            onClick={() => setSheet('novo')}
          >
            Add Mensagem
          </button>
        </div>
      )}

      {sheet ? (
        <MensagemExitoSheet
          inicial={sheet === 'novo' ? null : sheet}
          onClose={() => setSheet(null)}
          onSalvar={salvar}
        />
      ) : null}
    </>
  )
}
