/**
 * Confirmação no estilo do app (substitui window.confirm).
 */
import { UiModal } from './UiModal'

type Props = {
  title: string
  mensagem: string
  confirmarLabel?: string
  cancelarLabel?: string
  perigo?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmModal({
  title,
  mensagem,
  confirmarLabel = 'Confirmar',
  cancelarLabel = 'Cancelar',
  perigo,
  onConfirm,
  onClose,
}: Props) {
  return (
    <UiModal title={title} onClose={onClose}>
      <p className="ui-modal-msg">{mensagem}</p>
      <div className="ui-modal-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>
          {cancelarLabel}
        </button>
        <button
          type="button"
          className={`btn ${perigo ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmarLabel}
        </button>
      </div>
    </UiModal>
  )
}
