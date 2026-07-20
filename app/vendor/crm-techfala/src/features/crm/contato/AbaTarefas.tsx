/**
 * Aba Tarefas — CRUD completo (criar/editar/concluir/excluir).
 */
import { useState } from 'react'
import type { Contato, ContatoTarefa } from '@/shared/types/crm'
import { useUsuarios } from '../usuarios/usuariosStore'
import { useCrm } from '../store/crmStore'
import { AbaCabecalho } from './AbaCabecalho'

type Props = { contato: Contato }

const formVazio = {
  titulo: '',
  vencimento: '',
  status: 'pendente' as ContatoTarefa['status'],
  descricao: '',
  responsavel: '',
}

function rotuloStatus(s: ContatoTarefa['status']) {
  if (s === 'concluida') return 'Concluída'
  if (s === 'em_andamento') return 'Em andamento'
  return 'Pendente'
}

export function AbaTarefas({ contato }: Props) {
  const { atualizarContato } = useCrm()
  const { opcoesResponsavel } = useUsuarios()
  const [aberto, setAberto] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(formVazio)

  const valido = form.titulo.trim() && form.vencimento && form.responsavel

  function abrirNovo() {
    setEditId(null)
    setForm(formVazio)
    setAberto(true)
  }

  function abrirEditar(t: ContatoTarefa) {
    setEditId(t.id)
    setForm({
      titulo: t.titulo,
      vencimento: t.vencimento,
      status: t.status,
      descricao: t.descricao,
      responsavel: t.responsavel,
    })
    setAberto(true)
  }

  function salvar() {
    if (!valido) return
    if (editId) {
      atualizarContato(contato.id, {
        tarefas: contato.tarefas.map((t) =>
          t.id === editId
            ? {
                ...t,
                titulo: form.titulo.trim(),
                vencimento: form.vencimento,
                status: form.status,
                descricao: form.descricao,
                responsavel: form.responsavel,
              }
            : t,
        ),
      })
    } else {
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
    }
    setForm(formVazio)
    setEditId(null)
    setAberto(false)
  }

  function concluir(id: string) {
    atualizarContato(contato.id, {
      tarefas: contato.tarefas.map((t) =>
        t.id === id ? { ...t, status: 'concluida' as const } : t,
      ),
    })
  }

  function excluir(id: string) {
    if (!window.confirm('Excluir esta tarefa?')) return
    atualizarContato(contato.id, {
      tarefas: contato.tarefas.filter((t) => t.id !== id),
    })
  }

  const n = contato.tarefas.length
  const contagem = n === 0 ? 'Nenhuma tarefa' : n === 1 ? '1 tarefa' : `${n} tarefas`

  return (
    <div className="aba-tab">
      <AbaCabecalho
        contagem={contagem}
        botaoLabel="Tarefa"
        onNovo={abrirNovo}
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
                {opcoesResponsavel.map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setAberto(false)
                  setEditId(null)
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!valido}
                onClick={salvar}
              >
                {editId ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        ) : null}

        {contato.tarefas.map((t) => (
          <div key={t.id} className="item-card">
            <div className="item-card-main">
              <strong className={t.status === 'concluida' ? 'is-done' : undefined}>
                {t.titulo}
              </strong>
              <p>
                {rotuloStatus(t.status)} · vence {t.vencimento} · {t.responsavel}
              </p>
            </div>
            <div className="item-acoes">
              {t.status !== 'concluida' ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-icon sm"
                  title="Concluir"
                  aria-label="Concluir"
                  onClick={() => concluir(t.id)}
                >
                  ✓
                </button>
              ) : null}
              <button
                type="button"
                className="btn btn-ghost btn-icon sm"
                title="Editar"
                aria-label="Editar"
                onClick={() => abrirEditar(t)}
              >
                ✎
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-icon sm danger-text"
                title="Excluir"
                aria-label="Excluir"
                onClick={() => excluir(t.id)}
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
