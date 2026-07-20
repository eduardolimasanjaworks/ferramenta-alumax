/**
 * Lista de campanhas — cards estilo TechFala com ações rápidas.
 * Editar no sheet; pausar / enviar agora / excluir no card.
 */
import { CampanhaCard } from './CampanhaCard'
import type { Campanha } from './types'

type Props = {
  itens: Campanha[]
  onAbrir: (c: Campanha) => void
  onExcluir: (id: string) => void
  onPausar: (id: string) => void
  onEnviarAgora: (id: string) => void
}

export function ListaCampanhas({
  itens,
  onAbrir,
  onExcluir,
  onPausar,
  onEnviarAgora,
}: Props) {
  if (itens.length === 0) {
    return (
      <div className="cp-empty">
        <p className="cp-empty-t">Nenhuma campanha ainda</p>
        <p className="cp-empty-s">
          Crie uma campanha para disparar mensagens no WhatsApp com delay e
          agendamento.
        </p>
      </div>
    )
  }

  return (
    <div className="cp-list">
      {itens.map((c) => (
        <CampanhaCard
          key={c.id}
          campanha={c}
          onAbrir={() => onAbrir(c)}
          onExcluir={() => onExcluir(c.id)}
          onPausar={() => onPausar(c.id)}
          onEnviarAgora={() => onEnviarAgora(c.id)}
        />
      ))}
    </div>
  )
}
