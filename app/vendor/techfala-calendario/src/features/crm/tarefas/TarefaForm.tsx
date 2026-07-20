/**
 * Formulário “Nova Tarefa” dentro do sheet.
 * Valida título + vencimento antes de habilitar Criar.
 */
import { useState } from 'react'
import { IconArrowLeft, IconCalendar, IconClock } from '@/shared/icons'
import { RESPONSAVEIS } from '../contato/format'
import { STATUS_OPCOES } from './tarefaStatus'
import { useTarefas } from './tarefasStore'
import type { TarefaStatus } from './types'

type Props = {
  onVoltar: () => void
}

export function TarefaForm({ onVoltar }: Props) {
  const { criar } = useTarefas()
  const [titulo, setTitulo] = useState('')
  const [vencimento, setVencimento] = useState('')
  const [hora, setHora] = useState('09:00')
  const [status, setStatus] = useState<TarefaStatus>('pendente')
  const [descricao, setDescricao] = useState('')
  const [responsavel, setResponsavel] = useState('')

  const valido = Boolean(titulo.trim() && vencimento)

  function salvar() {
    if (!valido) return
    criar({
      titulo: titulo.trim(),
      vencimento,
      hora,
      status,
      descricao: descricao.trim(),
      responsavel,
    })
    onVoltar()
  }

  return (
    <div className="tarefa-form">
      <div className="tarefa-form-head">
        <button type="button" className="btn btn-ghost" onClick={onVoltar}>
          <IconArrowLeft />
          Voltar
        </button>
        <span className="tarefa-form-titulo">Nova Tarefa</span>
      </div>

      <div className="tarefa-form-body">
        <label className="field">
          <span>Título *</span>
          <input
            className="input"
            id="task-title"
            placeholder="Título da tarefa"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </label>

        <div className="tarefa-form-grid">
          <label className="field">
            <span>Vencimento *</span>
            <div className="input-with-icon">
              <IconCalendar />
              <input
                className="input"
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
              />
            </div>
          </label>
          <label className="field">
            <span>Horário</span>
            <div className="input-with-icon">
              <IconClock />
              <input
                className="input"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>
          </label>
        </div>

        <label className="field">
          <span>Status</span>
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as TarefaStatus)}
          >
            {STATUS_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Descrição</span>
          <textarea
            className="input textarea"
            id="task-description"
            rows={3}
            placeholder="Descrição da tarefa..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Responsável</span>
          <select
            className="input"
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
          >
            <option value="">Selecionar responsável</option>
            {RESPONSAVEIS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="tarefa-form-foot">
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
