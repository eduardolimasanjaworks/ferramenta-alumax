/**
 * Timeline horizontal com filtros — fiel ao modelo do dump.
 * Trilho central, cards alternando acima/abaixo por dia.
 */
import { useMemo, useState } from 'react'
import type { Contato } from '@/shared/types/crm'
import { agruparTimeline } from './timelineGroup'
import { TimelineCard } from './TimelineCard'

type Props = { contato: Contato }

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'lead', label: 'Contato' },
  { id: 'bot', label: 'Flow' },
  { id: 'evento', label: 'Calendário' },
  { id: 'kanban', label: 'Neural Sales' },
  { id: 'tarefa', label: 'Tarefa' },
  { id: 'nota', label: 'Multi-Chat' },
  { id: 'interacao', label: 'Marketing' },
] as const

export function AbaTimeline({ contato }: Props) {
  const [filtro, setFiltro] = useState<string>('todos')

  const filtrados = useMemo(() => {
    if (filtro === 'todos') return contato.timeline
    if (filtro === 'lead') {
      return contato.timeline.filter((t) => t.tipo === 'lead' || t.tipo === 'interacao')
    }
    if (filtro === 'nota') {
      return contato.timeline.filter((t) => t.tipo === 'nota')
    }
    return contato.timeline.filter((t) => t.tipo === filtro)
  }, [contato.timeline, filtro])

  const grupos = useMemo(() => agruparTimeline(filtrados), [filtrados])

  function exportar() {
    const linhas = contato.timeline
      .map((t) => `${t.em} — ${t.titulo}: ${t.detalhe}`)
      .join('\n')
    const blob = new Blob([`Timeline — ${contato.nome}\n\n${linhas}`], {
      type: 'text/plain;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timeline-${contato.nome || 'contato'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="tl-root">
      <div className="tl-viewport">
        <div className="tl-track">
          <div className="tl-rail" aria-hidden />
          {grupos.map((g) => (
            <div
              key={g.chave}
              className="tl-day"
              style={{ width: Math.max(400, 200 + g.itens.length * 200) }}
            >
              <span className="tl-day-badge">{g.rotulo}</span>
              <div className="tl-day-cards">
                {g.itens.map((item, i) => (
                  <TimelineCard key={item.id} item={item} acima={i % 2 === 0} />
                ))}
              </div>
            </div>
          ))}
          {grupos.length === 0 ? (
            <p className="empty-hint tl-empty">Nenhum evento na timeline.</p>
          ) : null}
        </div>
      </div>

      <div className="tl-filters">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`tl-filter${filtro === f.id ? ' is-active' : ''}`}
            onClick={() => setFiltro(f.id)}
          >
            {f.label}
          </button>
        ))}
        <button type="button" className="btn btn-outline sm" onClick={exportar}>
          Exportar
        </button>
      </div>
    </div>
  )
}
