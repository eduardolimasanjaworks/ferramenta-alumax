/**
 * Card de um campo na lista do sheet.
 * Mostra nome, tipo, ativo/inativo e ação de excluir.
 */
import { IconTrash } from '@/shared/icons'
import { rotuloTipo } from './rotuloTipo'
import type { CampoPersonalizado } from './types'

type Props = {
  campo: CampoPersonalizado
  onRemover: (id: string) => void
}

export function CampoCard({ campo, onRemover }: Props) {
  return (
    <div className="campo-card">
      <div className="campo-card-body">
        <div className="campo-card-top">
          <span className="campo-card-nome">{campo.nome}</span>
          <span className={`campo-badge${campo.ativo ? ' is-ativo' : ''}`}>
            {campo.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        {campo.descricao ? (
          <p className="campo-card-desc">{campo.descricao}</p>
        ) : null}
        <p className="campo-card-meta">{rotuloTipo(campo.tipo)}</p>
      </div>
      <button
        type="button"
        className="tarefa-acao is-danger"
        title="Excluir"
        onClick={() => onRemover(campo.id)}
      >
        <IconTrash />
      </button>
    </div>
  )
}
