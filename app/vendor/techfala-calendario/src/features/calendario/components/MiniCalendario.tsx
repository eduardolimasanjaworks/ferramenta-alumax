/**
 * Mini calendário da sub-sidebar (256px).
 * Navega mês e destaca o dia selecionado.
 */
import { useMemo } from 'react'
import { IconChevronLeft, IconChevronRight } from '@/shared/icons'
import {
  montarMes,
  rotuloMesAno,
} from '@/features/crm/tarefas/calendarioMes'

const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

type Props = {
  ano: number
  mes0: number
  diaSelecionado: string
  onPrev: () => void
  onNext: () => void
  onSelectDia: (iso: string) => void
}

export function MiniCalendario({
  ano,
  mes0,
  diaSelecionado,
  onPrev,
  onNext,
  onSelectDia,
}: Props) {
  const [hoje] = useMemo(() => [new Date()], [])
  const cells = useMemo(() => montarMes(ano, mes0, hoje), [ano, mes0, hoje])

  return (
    <div className="cal-mini">
      <div className="cal-mini-head">
        <span className="cal-mini-mes">{rotuloMesAno(ano, mes0)}</span>
        <div className="cal-mini-nav">
          <button type="button" className="cal-mini-nav-btn" onClick={onPrev} aria-label="Mês anterior">
            <IconChevronLeft />
          </button>
          <button type="button" className="cal-mini-nav-btn" onClick={onNext} aria-label="Próximo mês">
            <IconChevronRight />
          </button>
        </div>
      </div>

      <div className="cal-mini-grid">
        {cells.map((c, i) => (
          <div key={c.key} className="cal-mini-cell">
            {i < 7 ? (
              <span className="cal-mini-letra">{LETRAS[i]}</span>
            ) : null}
            <button
              type="button"
              className={`cal-mini-dia${c.foraDoMes ? ' is-out' : ''}${c.iso === diaSelecionado ? ' is-sel' : ''}`}
              onClick={() => onSelectDia(c.iso)}
            >
              {String(c.dia).padStart(2, '0')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
