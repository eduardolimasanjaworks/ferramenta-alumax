/**
 * Cabeçalho padrão das abas (contador + botão Nova…).
 * Espelha o layout do dump TechFala.
 */
type Props = {
  contagem: string
  botaoLabel: string
  onNovo: () => void
  desabilitado?: boolean
}

export function AbaCabecalho({
  contagem,
  botaoLabel,
  onNovo,
  desabilitado,
}: Props) {
  return (
    <div className="aba-cabecalho">
      <span className="aba-contagem">{contagem}</span>
      <button
        type="button"
        className="btn btn-outline"
        disabled={desabilitado}
        onClick={onNovo}
      >
        <span aria-hidden>+</span>
        {botaoLabel}
      </button>
    </div>
  )
}
