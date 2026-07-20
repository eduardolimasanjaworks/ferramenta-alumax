/**
 * Grade mensal Dom–Sáb com eventos das agendas visíveis.
 * Destaca o dia selecionado na sidebar.
 */
import { useMemo } from 'react'
import {
  DIAS_SEMANA,
  montarMes,
} from '@/features/crm/tarefas/calendarioMes'
import { useCalendario } from '../store/calendarioStore'
import type { Evento } from '../types'

type Props = {
  ano: number
  mes0: number
  diaSelecionado: string
  onDiaClick: (iso: string) => void
  onEventoClick: (ev: Evento) => void
}

export function VistaMensal({
  ano,
  mes0,
  diaSelecionado,
  onDiaClick,
  onEventoClick,
}: Props) {
  const { eventos, agendas } = useCalendario()
  const [cursor] = useMemo(() => [new Date()], [])
  const cells = useMemo(() => montarMes(ano, mes0, cursor), [ano, mes0, cursor])

  const idsVisiveis = useMemo(() => {
    const s = new Set<string>()
    for (const a of agendas) if (a.visivel !== false) s.add(a.id)
    return s
  }, [agendas])

  const corAgenda = useMemo(() => {
    const m = new Map<string, string>()
    for (const a of agendas) m.set(a.id, a.cor)
    return m
  }, [agendas])

  const porDia = useMemo(() => {
    const map = new Map<string, Evento[]>()
    for (const e of eventos) {
      if (!idsVisiveis.has(e.agendaId)) continue
      const list = map.get(e.data) ?? []
      list.push(e)
      map.set(e.data, list)
    }
    return map
  }, [eventos, idsVisiveis])

  return (
    <div className="cal-mes-wrap">
      <div className="cal-weekdays">
        {DIAS_SEMANA.map((d) => (
          <div key={d}>{d.toUpperCase()}</div>
        ))}
      </div>
      <div className="cal-mes-grid">
        {cells.map((c) => {
          const evs = porDia.get(c.iso) ?? []
          const sel = c.iso === diaSelecionado
          return (
            <button
              key={c.key}
              type="button"
              className={`cal-cell${c.foraDoMes ? ' is-out' : ''}${c.hoje ? ' is-hoje' : ''}${sel ? ' is-sel' : ''}`}
              onClick={() => onDiaClick(c.iso)}
            >
              <span className={c.hoje || sel ? 'cal-dia-hoje' : 'cal-dia'}>
                {c.dia}
              </span>
              <div className="cal-cell-evs">
                {evs.slice(0, 3).map((e) => (
                  <span
                    key={e.id}
                    className="cal-pill"
                    style={{
                      background: e.cor || corAgenda.get(e.agendaId) || '#111224',
                    }}
                    title={e.titulo}
                    onClick={(ev) => {
                      ev.stopPropagation()
                      onEventoClick(e)
                    }}
                  >
                    {e.diaTodo ? e.titulo : `${e.horaInicio} ${e.titulo}`}
                  </span>
                ))}
                {evs.length > 3 ? (
                  <span className="cal-mais">+{evs.length - 3}</span>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
