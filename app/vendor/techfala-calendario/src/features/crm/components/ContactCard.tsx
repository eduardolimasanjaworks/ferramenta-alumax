/**
 * Card de contato arrastável no Kanban.
 * Clique abre a área interna; X remove; grip arrasta.
 */
import { IconGrip, IconX } from '@/shared/icons'
import type { Contato } from '@/shared/types/crm'
import { useCrm } from '../store/crmStore'

type Props = { contato: Contato }

export function ContactCard({ contato }: Props) {
  const { removerContato, abrirContato } = useCrm()

  return (
    <div
      className="contact-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/contato-id', contato.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onClick={() => abrirContato(contato.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') abrirContato(contato.id)
      }}
    >
      <span className="grip" onClick={(e) => e.stopPropagation()}>
        <IconGrip />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="nome">{contato.nome}</p>
        {contato.email ? <p className="meta">{contato.email}</p> : null}
        {contato.telefone ? (
          <p className="meta">
            {contato.ddi} {contato.telefone}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        className="remove"
        aria-label="Remover contato"
        onClick={(e) => {
          e.stopPropagation()
          removerContato(contato.id)
        }}
      >
        <IconX />
      </button>
    </div>
  )
}
