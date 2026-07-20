/**
 * Aba Tarefas — grid título/vencimento/status como no dump.
 */
import { useState } from 'react'
import type { Contato, ContatoTarefa } from '@/shared/types/crm'
import { useCrm } from '../store/crmStore'
import { AbaCabecalho } from './AbaCabecalho'
import { RESPONSAVEIS } from './format'

type Props = { contato: Contato }

export function AbaTarefas({ contato }: Props) {
  const { atualizarContato } = useCrm()
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    vencimento: '',
    status: 'pendente' as ContatoTarefa['status'],
    descricao: '',
    responsavel: '',
  })

  const valido =
    form.titulo.trim() && form.vencimento && form.responsavel

  function salvar() {
    if (!valido) return
    const tarefa: ContatoTarefa = {
      id: `tar-${crypto.randomUUID().slice(0, 8)}`,
      titulo: form.titulo.trim(),
      vencimento: form.vencimento,
      status: form.status,
      descricao: form.descricao,
      responsavel: form.responsavel,
    }
    atualizarContato(contato.id, {
      tarefas: [tarefa, ...contato.tarefas],
      timeline: [
        {
          id: `tl-${crypto.randomUUID().slice(0, 8)}`,
          tipo: 'tarefa',
          titulo: 'Tarefa',
          detalhe: tarefa.titulo,
          em: new Date().toISOString(),
        },
        ...contato.timeline,
      ],
    })
    setForm({
      titulo: '',
      vencimento: '',
      status: 'pendente',
      descricao: '',
      responsavel: '',
    })
    setAberto(false)
  }

  const n = contato.tarefas.length
  const contagem = n === 0 ? 'Nenhuma tarefa' : n === 1 ? '1 tarefa' : `${n} tarefas`

  return (
    <div className="aba-tab">
      <AbaCabecalho
        contagem={contagem}
        botaoLabel="Tarefa"
        onNovo={() => setAberto(true)}
        desabilitado={aberto}
      />

      <div className="aba-scroll">
        {aberto ? (
          <div className="form-card">
            <div className="tarefa-grid">
              <label className="field-xs">
                <span>Título *</span>
                <input
                  className="input h-8"
                  placeholder="Título da tarefa"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </label>
              <label className="field-xs w-venc">
                <span>Vencimento *</span>
                <input
                  className="input h-8"
                  type="date"
                  value={form.vencimento}
                  onChange={(e) => setForm({ ...form, vencimento: e.target.value })}
                />
              </label>
              <label className="field-xs w-status">
                <span>Status</span>
                <select
                  className="input h-8"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as ContatoTarefa['status'],
                    })
                  }
                >
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="concluida">Concluída</option>
                </select>
              </label>
            </div>
            <label className="field-xs">
              <span>Descrição</span>
              <textarea
                className="input textarea"
                rows={2}
                placeholder="Descrição da tarefa..."
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </label>
            <label className="field-xs">
              <span>Responsável *</span>
              <select
                className="input h-8"
                value={form.responsavel}
                onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
              >
                <option value="">Selecionar responsável</option>
                {RESPONSAVEIS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setAberto(false)}>
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
        ) : null}

        {contato.tarefas.map((t) => (
          <div key={t.id} className="item-card">
            <strong>{t.titulo}</strong>
            <p>
              {t.status} · vence {t.vencimento} · {t.responsavel}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
