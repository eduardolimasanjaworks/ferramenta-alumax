/**
 * Empty state padrão das seções (notif, parâmetros, mensagens).
 * Título + subtítulo + botão de adicionar.
 */
import { IconPlus } from '@/shared/icons'

type Props = {
  titulo: string
  subtitulo: string
  botao: string
  onAdd: () => void
}

export function CfgEmpty({ titulo, subtitulo, botao, onAdd }: Props) {
  return (
    <div className="cfg-empty">
      <p className="cfg-empty-t">{titulo}</p>
      <p className="cfg-empty-s">{subtitulo}</p>
      <button type="button" className="btn btn-primary cfg-add-btn" onClick={onAdd}>
        <IconPlus />
        {botao}
      </button>
    </div>
  )
}
