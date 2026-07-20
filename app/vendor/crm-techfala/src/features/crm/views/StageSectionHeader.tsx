/**
 * Cabeçalho compartilhado das seções de etapa (Linhas / Lista / Funil).
 */
import { IconPlus } from '../../../shared/icons'
import { ColunaMenuButton } from '../components/ColunaMenuButton'
import { formatBRL, hexToRgba } from './viewUtils'

type Props = {
  colunaId: string
  titulo: string
  cor: string
  count: number
  valorTotal?: number
  onAdd: () => void
}

export function StageSectionHeader({
  colunaId,
  titulo,
  cor,
  count,
  valorTotal = 0,
  onAdd,
}: Props) {
  return (
    <div
      className="stage-section-header"
      style={{ background: hexToRgba(cor, 0.12) }}
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
        <ColunaMenuButton
          colunaId={colunaId}
          titulo={titulo}
          cor={cor}
          contatosCount={count}
        />
      </div>
    </div>
  )
}
