/**
 * Cabeçalho compartilhado das seções de etapa (Linhas / Lista / Funil).
 * Centraliza cor, contagem, valor e ações Adicionar/menu.
 */
import { IconEllipsis, IconPlus } from '../../../shared/icons'
import { formatBRL } from './viewUtils'

type Props = {
  titulo: string
  cor: string
  count: number
  valorTotal?: number
  onAdd: () => void
}

export function StageSectionHeader({
  titulo,
  cor,
  count,
  valorTotal = 0,
  onAdd,
}: Props) {
  return (
    <div
      className="stage-section-header"
      style={{ background: `${cor}20` }}
    >
      <div className="stage-section-left">
        <span className="stage-dot" style={{ background: cor }} />
        <h3>{titulo}</h3>
        <span className="stage-count">({count})</span>
        {valorTotal > 0 ? (
          <span className="stage-valor">{formatBRL(valorTotal)}</span>
        ) : null}
      </div>
      <div className="stage-section-actions">
        <button type="button" className="btn btn-ghost" onClick={onAdd}>
          <IconPlus /> Adicionar
        </button>
        <button type="button" className="btn btn-icon sm" aria-label="Mais opções">
          <IconEllipsis />
        </button>
      </div>
    </div>
  )
}
