/**
 * Sub-sidebar esquerda do Calendário (256px).
 * Novo Evento + mini calendário + lista de agendas.
 */
import { MiniCalendario } from './MiniCalendario'
import { AgendasSideList } from './AgendasSideList'
import type { Agenda } from '../types'

type Props = {
  ano: number
  mes0: number
  diaSelecionado: string
  onPrev: () => void
  onNext: () => void
  onSelectDia: (iso: string) => void
  onNovoEvento: () => void
  onNovaAgenda: () => void
  onConfigurar: (a: Agenda) => void
}

export function CalSideBar({
  ano,
  mes0,
  diaSelecionado,
  onPrev,
  onNext,
  onSelectDia,
  onNovoEvento,
  onNovaAgenda,
  onConfigurar,
}: Props) {
  return (
    <aside className="cal-sidebar" aria-label="Painel do calendário">
      <button type="button" className="cal-btn-novo" onClick={onNovoEvento}>
        <span className="cal-plus-cross" aria-hidden>
          <i className="v" />
          <i className="h" />
          <i className="dot" />
        </span>
        Novo Evento
      </button>

      <MiniCalendario
        ano={ano}
        mes0={mes0}
        diaSelecionado={diaSelecionado}
        onPrev={onPrev}
        onNext={onNext}
        onSelectDia={onSelectDia}
      />

      <AgendasSideList
        onNovaAgenda={onNovaAgenda}
        onConfigurar={onConfigurar}
      />
    </aside>
  )
}
