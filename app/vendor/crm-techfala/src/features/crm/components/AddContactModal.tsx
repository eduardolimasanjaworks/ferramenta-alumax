/**
 * Modal de novo contato — mesmo formulário do Kanban, em qualquer view.
 */
import { AddContactForm } from './AddContactForm'
import { UiModal } from './UiModal'

type Props = {
  colunaId: string
  onClose: () => void
}

export function AddContactModal({ colunaId, onClose }: Props) {
  return (
    <UiModal title="Novo contato" onClose={onClose}>
      <AddContactForm colunaId={colunaId} onClose={onClose} />
    </UiModal>
  )
}
