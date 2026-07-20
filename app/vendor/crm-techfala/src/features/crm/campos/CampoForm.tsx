/**
 * Formulário criar/editar campo do catálogo.
 * Tipo lista exige opções (uma por linha).
 */
import { useState } from 'react'
import { IconArrowLeft } from '@/shared/icons'
import { useCampos } from './camposStore'
import { TIPO_OPCOES } from './rotuloTipo'
import type { CampoPersonalizado, CampoTipo } from './types'

type Props = {
  onVoltar: () => void
  campo?: CampoPersonalizado
}

export function CampoForm({ onVoltar, campo }: Props) {
  const { criar, atualizar } = useCampos()
  const editando = Boolean(campo)
  const [nome, setNome] = useState(campo?.nome ?? '')
  const [descricao, setDescricao] = useState(campo?.descricao ?? '')
  const [ativo, setAtivo] = useState(campo?.ativo ?? true)
  const [tipo, setTipo] = useState<CampoTipo>(campo?.tipo ?? 'texto')
  const [opcoesTexto, setOpcoesTexto] = useState(
    (campo?.opcoes ?? []).join('\n'),
  )

  const opcoes =
    tipo === 'lista'
      ? opcoesTexto
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
      : []

  const valido =
    Boolean(nome.trim()) && (tipo !== 'lista' || opcoes.length > 0)

  async function salvar() {
    if (!valido) return
    const dados = {
      nome: nome.trim(),
      descricao: descricao.trim(),
      ativo,
      tipo,
      opcoes,
    }
    try {
      const ok = campo
        ? await atualizar(campo.id, dados)
        : await criar(dados)
      if (!ok) throw new Error('falha')
      onVoltar()
    } catch {
      window.alert('Não foi possível salvar o campo. Tente novamente.')
    }
  }

  return (
    <div className="campo-form">
      <div className="campo-form-head">
        <button type="button" className="btn btn-ghost" onClick={onVoltar}>
          <IconArrowLeft />
          Voltar
        </button>
        <span className="campo-form-titulo">
          {editando ? 'Editar Campo' : 'Novo Campo'}
        </span>
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

        {tipo === 'lista' ? (
          <label className="field">
            <span>Opções * (uma por linha)</span>
            <textarea
              className="input textarea"
              rows={4}
              placeholder={'Opção A\nOpção B\nOpção C'}
              value={opcoesTexto}
              onChange={(e) => setOpcoesTexto(e.target.value)}
            />
          </label>
        ) : null}
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
          {editando ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </div>
  )
}
