/**
 * Coluna do Kanban: stripe colorida, header, lista, add.
 * Aceita drop de cards e reordenação de colunas.
 */
import { useState } from 'react'
import { IconEllipsis, IconGrip, IconPlus } from '@/shared/icons'
import type { Coluna, Contato } from '@/shared/types/crm'
import { useCrm } from '../store/crmStore'
import { AddContactForm } from './AddContactForm'
import { ContactCard } from './ContactCard'
import { EmptyColumn } from './EmptyColumn'

type Props = { coluna: Coluna; contatos: Contato[] }

export function KanbanColumn({ coluna, contatos }: Props) {
  const { moverContato, reordenarColunas, removerColuna, renomearColuna } =
    useCrm()
  const [adding, setAdding] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [over, setOver] = useState(false)

  return (
    <div
      className={`kanban-column${over ? ' is-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const contatoId = e.dataTransfer.getData('text/contato-id')
        const colunaOrigem = e.dataTransfer.getData('text/coluna-id')
        if (contatoId) {
          moverContato(contatoId, coluna.id)
          return
        }
        if (colunaOrigem) reordenarColunas(colunaOrigem, coluna.id)
      }}
    >
      <div className="col-stripe" style={{ backgroundColor: coluna.cor }} />

      <div className="col-header">
        <div className="col-header-left">
          <div
            className="grip"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/coluna-id', coluna.id)
              e.dataTransfer.effectAllowed = 'move'
            }}
          >
            <IconGrip />
          </div>
          <h3 className="col-title">{coluna.titulo}</h3>
          <span className="badge">{contatos.length}</span>
        </div>

        <div className="col-menu">
          <button
            type="button"
            className="btn btn-ghost btn-icon sm"
            aria-label="Menu da coluna"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <IconEllipsis />
          </button>
          {menuOpen ? (
            <div className="col-menu-panel">
              <button
                type="button"
                onClick={() => {
                  const titulo = window.prompt('Novo nome', coluna.titulo)
                  if (titulo) renomearColuna(coluna.id, titulo)
                  setMenuOpen(false)
                }}
              >
                Renomear
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  removerColuna(coluna.id)
                  setMenuOpen(false)
                }}
              >
                Remover
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="col-body">
        {contatos.length === 0 ? <EmptyColumn /> : null}
        {contatos.map((c) => (
          <ContactCard key={c.id} contato={c} />
        ))}
        {adding ? (
          <AddContactForm colunaId={coluna.id} onClose={() => setAdding(false)} />
        ) : null}
      </div>

      <div className="col-footer">
        <button
          type="button"
          className="btn btn-ghost btn-add-contact"
          onClick={() => setAdding(true)}
        >
          <IconPlus />
          <span>Adicionar contato</span>
        </button>
      </div>
    </div>
  )
}
