/**
 * Handlers de drag-and-drop de contato para zonas de etapa.
 * Espelha o padrão do KanbanColumn (text/contato-id + classe is-over).
 */
import { useState, type DragEvent } from 'react'
import { useCrm } from '../store/crmStore'

export function useDropContato(colunaId: string) {
  const { moverContato } = useCrm()
  const [over, setOver] = useState(false)

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    setOver(true)
  }

  function onDragLeave(e: DragEvent) {
    const related = e.relatedTarget as Node | null
    if (related && e.currentTarget.contains(related)) return
    setOver(false)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setOver(false)
    const contatoId = e.dataTransfer.getData('text/contato-id')
    if (contatoId) moverContato(contatoId, colunaId)
  }

  return { over, onDragOver, onDragLeave, onDrop }
}
