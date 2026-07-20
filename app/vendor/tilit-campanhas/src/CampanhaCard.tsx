/**
 * Card de campanha no estilo TechFala: status, copy, ações.
 * Pausar / Enviar agora / Excluir / Editar no próprio card.
 */
import { useEffect, useRef, useState } from 'react'
import { StatusBadge } from './StatusBadge'
import type { Campanha } from './types'

type Props = {
  campanha: Campanha
  onAbrir: () => void
  onExcluir: () => void
  onPausar: () => void
  onEnviarAgora: () => void
}

function labelInstancia(name: string): string {
  return name.replace(/-chatwoot$/i, '').replace(/^tilit-/i, '') || name
}

function previewMsg(c: Campanha): string {
  const t = c.mensagens?.find((m) => m.texto?.trim())?.texto?.trim() || ''
  return t.length > 140 ? `${t.slice(0, 140)}…` : t
}

export function CampanhaCard({
  campanha: c,
  onAbrir,
  onExcluir,
  onPausar,
  onEnviarAgora,
}: Props) {
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const nMsgs = c.mensagens?.length || 0
  const enviados = c.enviados ?? 0
  const falhas = c.falhas ?? 0
  const total = c.totalJobs ?? 0
  const podePausar = c.status === 'agendada' || c.status === 'em_andamento'
  const podeEnviar =
    c.status === 'rascunho' ||
    c.status === 'agendada' ||
    c.status === 'pausada' ||
    c.status === 'cancelada' ||
    c.status === 'em_andamento' ||
    c.status === 'concluida'

  useEffect(() => {
    if (!menu) return
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menu])

  return (
    <article className="cp-card">
      <div className="cp-card-body">
        <button type="button" className="cp-card-hit" onClick={onAbrir}>
          <div className="cp-card-title-row">
            <h3 className="cp-card-title">
              <span className="cp-card-id">#{c.id.replace(/^cp-/, '').slice(0, 6)}</span>{' '}
              {c.nome || 'Sem nome'}
            </h3>
            <div className="cp-card-chips">
              <StatusBadge status={c.status} />
              {c.instancia ? (
                <span className="cp-chip">📶 {labelInstancia(c.instancia)}</span>
              ) : null}
            </div>
          </div>

          <div className="cp-card-msg">
            <span className="cp-meta">
              {nMsgs} mensagem{nMsgs === 1 ? '' : 's'}
            </span>
            {previewMsg(c) ? <p className="cp-card-preview">{previewMsg(c)}</p> : null}
          </div>

          <div className="cp-card-meta-row">
            <span>👥 {c.tag || '—'}</span>
            <span>
              ⏰{' '}
              {c.agendadoEm
                ? new Date(c.agendadoEm).toLocaleString('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })
                : 'Não agendada'}
            </span>
            <span>
              📊 {enviados}/{total} enviadas
              {falhas > 0 ? ` · ${falhas} falha${falhas === 1 ? '' : 's'}` : ''}
            </span>
          </div>
        </button>

        <div className="cp-card-actions" ref={menuRef}>
          {podeEnviar ? (
            <button
              type="button"
              className="btn btn-primary btn-sm btn-pill"
              onClick={() => {
                if (window.confirm('Disparar esta campanha agora?')) onEnviarAgora()
              }}
            >
              ↗ Enviar Agora
            </button>
          ) : null}

          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            aria-label="Mais ações"
            aria-expanded={menu}
            onClick={() => setMenu((v) => !v)}
          >
            ⋮
          </button>

          {menu ? (
            <div className="cp-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { setMenu(false); onAbrir() }}>
                Editar
              </button>
              {podePausar ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false)
                    onPausar()
                  }}
                >
                  Pausar
                </button>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className="danger"
                onClick={() => {
                  setMenu(false)
                  if (window.confirm('Excluir esta campanha?')) onExcluir()
                }}
              >
                Excluir
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
