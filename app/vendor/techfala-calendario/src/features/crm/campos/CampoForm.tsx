/**
 * Formulário “Novo Campo” dentro do sheet.
 * Exige nome; switch Ativo e tipo Texto por padrão.
 */
import { useState } from 'react'
import { IconArrowLeft } from '@/shared/icons'
import { useCampos } from './camposStore'
import { TIPO_OPCOES } from './rotuloTipo'
import type { CampoTipo } from './types'

type Props = { onVoltar: () => void }

export function CampoForm({ onVoltar }: Props) {
  const { criar } = useCampos()
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [tipo, setTipo] = useState<CampoTipo>('texto')

  const valido = Boolean(nome.trim())

  function salvar() {
    if (!valido) return
    criar({
      nome: nome.trim(),
      descricao: descricao.trim(),
      ativo,
      tipo,
    })
    onVoltar()
  }

  return (
    <div className="campo-form">
      <div className="campo-form-head">
        <button type="button" className="btn btn-ghost" onClick={onVoltar}>
          <IconArrowLeft />
          Voltar
        </button>
        <span className="campo-form-titulo">Novo Campo</span>
      </div>

      <div className="campo-form-body">
        <label className="field">
          <span>Nome *</span>
          <input
            className="input"
            id="cf-name"
            placeholder="Ex: Data de Vencimento"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Descrição</span>
          <textarea
            className="input textarea"
            id="cf-description"
            rows={3}
            placeholder="Descrição do campo..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </label>

        <div className="campo-switch-row">
          <label htmlFor="cf-active">Ativo</label>
          <button
            type="button"
            role="switch"
            id="cf-active"
            aria-checked={ativo}
            className={`campo-switch${ativo ? ' is-on' : ''}`}
            onClick={() => setAtivo((v) => !v)}
          >
            <span className="campo-switch-knob" />
          </button>
        </div>

        <label className="field">
          <span>Tipo</span>
          <select
            className="input"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as CampoTipo)}
          >
            {TIPO_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="campo-form-foot">
        <button type="button" className="btn btn-outline" onClick={onVoltar}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!valido}
          onClick={salvar}
        >
          Criar
        </button>
      </div>
    </div>
  )
}
