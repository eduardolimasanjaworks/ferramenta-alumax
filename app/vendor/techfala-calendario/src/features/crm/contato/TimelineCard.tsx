/**
 * Card de evento na timeline horizontal (acima/abaixo do trilho).
 */
import type { TimelineItem } from '@/shared/types/crm'
import { formatarDataHora } from './format'
import { corTipo } from './timelineGroup'

type Props = {
  item: TimelineItem
  acima: boolean
}

export function TimelineCard({ item, acima }: Props) {
  const cor = corTipo(item.tipo)
  return (
    <div className={`tl-slot${acima ? ' is-up' : ' is-down'}`}>
      <div className={`tl-card tl-${cor}`}>
        <div className="tl-card-head">
          <span className={`tl-icon tl-${cor}`}>{icone(item.tipo)}</span>
          <span className="tl-title">{item.titulo}</span>
        </div>
        <p className="tl-when">{formatarDataHora(item.em)}</p>
        <p className="tl-detail">{item.detalhe}</p>
      </div>
      <div className="tl-stem" />
      <div className={`tl-dot tl-${cor}`} />
    </div>
  )
}

function icone(tipo: string): string {
  if (tipo === 'lead') return '+'
  if (tipo === 'bot') return '◎'
  if (tipo === 'kanban') return '→'
  if (tipo === 'nota') return '✎'
  if (tipo === 'tarefa') return '✓'
  return '•'
}
