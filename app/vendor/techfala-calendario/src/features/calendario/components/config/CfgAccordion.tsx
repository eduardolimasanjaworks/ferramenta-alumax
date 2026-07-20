/**
 * Accordion reutilizável das seções de Configurar Agenda.
 * Cabeçalho em card (fechado) + corpo expansível (sem Bubble).
 */
import type { ReactNode } from 'react'
import { IconChevronDown, IconChevronUp } from '@/shared/icons'

type Props = {
  titulo: string
  icone?: ReactNode
  aberto: boolean
  onToggle: () => void
  children: ReactNode
}

export function CfgAccordion({
  titulo,
  icone,
  aberto,
  onToggle,
  children,
}: Props) {
  return (
    <section className={`cfg-acc${aberto ? ' is-open' : ''}`}>
      <button
        type="button"
        className="cfg-acc-head"
        onClick={onToggle}
        aria-expanded={aberto}
      >
        <span className="cfg-acc-left">
          {icone ? <span className="cfg-acc-ico">{icone}</span> : null}
          <span className="cfg-acc-title">{titulo}</span>
        </span>
        <span className="cfg-acc-right" aria-hidden>
          {aberto ? <IconChevronUp /> : <IconChevronDown />}
        </span>
      </button>
      {aberto ? <div className="cfg-acc-body">{children}</div> : null}
    </section>
  )
}
