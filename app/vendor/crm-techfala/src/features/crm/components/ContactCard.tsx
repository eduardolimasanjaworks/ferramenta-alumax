/**
 * Card de contato arrastável no Kanban.
 * Clique abre a área interna; X remove; grip arrasta.
 */
import { useRef } from 'react'
import { IconGrip, IconX } from '@/shared/icons'
import type { Contato } from '@/shared/types/crm'
import { useCrm } from '../store/crmStore'

type Props = { contato: Contato }

const LIMITE_CLIQUE = 6

export function ContactCard({ contato }: Props) {
  const { removerContato, abrirContato } = useCrm()
  const startRef = useRef({ x: 0, y: 0 })
  const maxDistRef = useRef(0)

  function registrarInicio(x: number, y: number) {
    startRef.current = { x, y }
    maxDistRef.current = 0
  }

  function registrarMovimento(x: number, y: number) {
    const dx = x - startRef.current.x
    const dy = y - startRef.current.y
    maxDistRef.current = Math.max(maxDistRef.current, Math.hypot(dx, dy))
  }

  return (
    <div
      className="contact-card"
      draggable
      onPointerDown={(e) => registrarInicio(e.clientX, e.clientY)}
      onDragStart={(e) => {
        registrarInicio(e.clientX, e.clientY)
        e.dataTransfer.setData('text/contato-id', contato.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDrag={(e) => {
        if (e.clientX !== 0 || e.clientY !== 0) {
          registrarMovimento(e.clientX, e.clientY)
        }
      }}
      onClick={(e) => {
        registrarMovimento(e.clientX, e.clientY)
        if (maxDistRef.current < LIMITE_CLIQUE) abrirContato(contato.id)
      }}
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
