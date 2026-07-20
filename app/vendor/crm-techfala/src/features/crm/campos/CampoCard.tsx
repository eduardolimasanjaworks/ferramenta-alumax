/**
 * Card de um campo na lista do sheet.
 * Mostra nome, tipo, ativo/inativo e ações editar/excluir.
 */
import { IconTrash } from '@/shared/icons'
import { rotuloTipo } from './rotuloTipo'
import type { CampoPersonalizado } from './types'

type Props = {
  campo: CampoPersonalizado
  onEditar: (campo: CampoPersonalizado) => void
  onRemover: (id: string) => void
}

export function CampoCard({ campo, onEditar, onRemover }: Props) {
  return (
    <div className="campo-card">
      <button
        type="button"
        className="campo-card-body campo-card-hit"
        onClick={() => onEditar(campo)}
      >
        <div className="campo-card-top">
          <span className="campo-card-nome">{campo.nome}</span>
          <span className={`campo-badge${campo.ativo ? ' is-ativo' : ''}`}>
            {campo.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        {campo.descricao ? (
          <p className="campo-card-desc">{campo.descricao}</p>
        ) : null}
        <p className="campo-card-meta">
          {rotuloTipo(campo.tipo)}
          {campo.tipo === 'lista' && campo.opcoes?.length
            ? ` · ${campo.opcoes.length} opções`
            : ''}
        </p>
      </button>
      <div className="campo-card-acoes">
        <button
          type="button"
          className="tarefa-acao"
          title="Editar"
          aria-label="Editar"
          onClick={() => onEditar(campo)}
        >
          ✎
        </button>
        <button
          type="button"
          className="tarefa-acao is-danger"
          title="Excluir"
          aria-label="Excluir"
          onClick={() => onRemover(campo.id)}
        >
          <IconTrash />
        </button>
      </div>
    </div>
  )
}
