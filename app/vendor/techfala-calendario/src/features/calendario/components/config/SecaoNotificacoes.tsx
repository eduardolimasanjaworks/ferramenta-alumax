/**
 * Notificações Gerais — empty/list; Add abre NotificacaoSheet (dump).
 * Clique no card reabre o sheet para editar.
 */
import { useState } from 'react'
import { IconTrash } from '@/shared/icons'
import type { AgendaConfig, NotificacaoAgenda } from '../../types/agendaConfig'
import { CfgEmpty } from './CfgEmpty'
import { NotificacaoSheet } from './NotificacaoSheet'

type Props = {
  config: AgendaConfig
  onChange: (patch: Partial<AgendaConfig>) => void
}

export function SecaoNotificacoes({ config, onChange }: Props) {
  const [sheet, setSheet] = useState<NotificacaoAgenda | 'novo' | null>(null)
  const itens = config.notificacoes

  function salvar(n: NotificacaoAgenda) {
    const existe = itens.some((x) => x.id === n.id)
    onChange({
      notificacoes: existe
        ? itens.map((x) => (x.id === n.id ? n : x))
        : [...itens, n],
    })
    setSheet(null)
  }

  return (
    <>
      {itens.length === 0 ? (
        <CfgEmpty
          titulo="Ops! Nenhuma notificação criada."
          subtitulo="Crie notificações de Evento e potencialize os seus atendimentos!"
          botao="Add Notificação"
          onAdd={() => setSheet('novo')}
        />
      ) : (
        <div className="cfg-stack">
          {itens.map((n) => (
            <button
              key={n.id}
              type="button"
              className="cfg-card cfg-list-btn"
              onClick={() => setSheet(n)}
            >
              <div className="cfg-card-top">
                <strong>{n.titulo || 'Sem título'}</strong>
                <span
                  role="button"
                  tabIndex={0}
                  className="btn btn-ghost btn-icon"
                  aria-label="Remover"
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange({
                      notificacoes: itens.filter((x) => x.id !== n.id),
                    })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation()
                      onChange({
                        notificacoes: itens.filter((x) => x.id !== n.id),
                      })
                    }
                  }}
                >
                  <IconTrash />
                </span>
              </div>
              <p className="cfg-card-meta">
                {n.dias}d {n.horas}h {n.minutos}m · {n.momento} · {n.tipo}
              </p>
            </button>
          ))}
          <button
            type="button"
            className="btn btn-outline cfg-add-btn"
            onClick={() => setSheet('novo')}
          >
            Add Notificação
          </button>
        </div>
      )}

      {sheet ? (
        <NotificacaoSheet
          inicial={sheet === 'novo' ? null : sheet}
          onClose={() => setSheet(null)}
          onSalvar={salvar}
        />
      ) : null}
    </>
  )
}
