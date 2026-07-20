/**
 * Formulário inline para novo contato na coluna.
 */
import { useState } from 'react'
import { useCrm } from '../store/crmStore'

type Props = { colunaId: string; onClose: () => void }

export function AddContactForm({ colunaId, onClose }: Props) {
  const { adicionarContato } = useCrm()
  const [nome, setNome] = useState('')

  function salvar() {
    if (!nome.trim()) return
    adicionarContato(colunaId, nome)
    setNome('')
    onClose()
  }

  return (
    <div className="add-form">
      <input
        className="input"
        autoFocus
        placeholder="Nome do contato"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') salvar()
          if (e.key === 'Escape') onClose()
        }}
      />
      <div className="add-form-actions">
        <button type="button" className="btn btn-primary" onClick={salvar}>
          Salvar
        </button>
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
