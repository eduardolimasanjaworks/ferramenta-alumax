/**
 * Aba Interações — CRUD completo (criar/editar/excluir).
 */
import { useState } from 'react'
import type { Contato, ContatoInteracao } from '@/shared/types/crm'
import { useUsuarios } from '../usuarios/usuariosStore'
import { useCrm } from '../store/crmStore'
import { AbaCabecalho } from './AbaCabecalho'

type Props = { contato: Contato }

const formVazio = {
  responsavel: '',
  data: '',
  hh: '',
  mm: '',
  descricao: '',
}

export function AbaInteracoes({ contato }: Props) {
  const { atualizarContato } = useCrm()
  const { opcoesResponsavel } = useUsuarios()
  const [aberto, setAberto] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(formVazio)

  const valido =
    form.responsavel &&
    form.data &&
    form.hh.length === 2 &&
    form.mm.length === 2 &&
    form.descricao.trim()

  function abrirNovo() {
    setEditId(null)
    setForm(formVazio)
    setAberto(true)
  }

  function abrirEditar(i: ContatoInteracao) {
    const [hh = '', mm = ''] = (i.hora || '').split(':')
    setEditId(i.id)
    setForm({
      responsavel: i.responsavel,
      data: i.data,
      hh: hh.slice(0, 2),
      mm: mm.slice(0, 2),
      descricao: i.descricao,
    })
    setAberto(true)
  }

  function salvar() {
    if (!valido) return
    const hora = `${form.hh}:${form.mm}`
    const dados = {
      descricao: form.descricao.trim(),
      data: form.data,
      hora,
      responsavel: form.responsavel,
    }
    if (editId) {
      atualizarContato(contato.id, {
        interacoes: contato.interacoes.map((i) =>
          i.id === editId ? { ...i, ...dados } : i,
        ),
      })
    } else {
      const item = {
        id: `int-${crypto.randomUUID().slice(0, 8)}`,
        ...dados,
      }
      atualizarContato(contato.id, {
        interacoes: [item, ...contato.interacoes],
        timeline: [
          {
            id: `tl-${crypto.randomUUID().slice(0, 8)}`,
            tipo: 'interacao',
            titulo: 'Nova interação',
            detalhe: item.descricao.slice(0, 120),
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

  function excluir(id: string) {
    if (!window.confirm('Excluir esta interação?')) return
    atualizarContato(contato.id, {
      interacoes: contato.interacoes.filter((i) => i.id !== id),
    })
  }

  const n = contato.interacoes.length
  const contagem =
    n === 0 ? 'Nenhuma interação' : n === 1 ? '1 interação' : `${n} interações`

  return (
    <div className="aba-tab">
      <AbaCabecalho
        contagem={contagem}
        botaoLabel="Nova interação"
        onNovo={abrirNovo}
        desabilitado={aberto}
      />

      <div className="aba-scroll">
        {aberto ? (
          <div className="form-card">
            <div className="form-row-3">
              <select
                className={`input h-9${!form.responsavel ? ' is-invalid' : ''}`}
                value={form.responsavel}
                onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
              >
                <option value="">Responsável *</option>
                {opcoesResponsavel.map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
                ))}
              </select>
              <input
                className={`input h-9${!form.data ? ' is-invalid' : ''}`}
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
                aria-label="Data da interação"
              />
              <div className="hora-pair">
                <input
                  className={`input h-9 hora${!form.hh ? ' is-invalid' : ''}`}
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="HH"
                  value={form.hh}
                  onChange={(e) =>
                    setForm({ ...form, hh: e.target.value.replace(/\D/g, '').slice(0, 2) })
                  }
                />
                <span>:</span>
                <input
                  className={`input h-9 hora${!form.mm ? ' is-invalid' : ''}`}
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="MM"
                  value={form.mm}
                  onChange={(e) =>
                    setForm({ ...form, mm: e.target.value.replace(/\D/g, '').slice(0, 2) })
                  }
                />
              </div>
            </div>
            <textarea
              className="input textarea"
              rows={3}
              placeholder="Descrição da interação..."
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-ghost"
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
                Salvar
              </button>
            </div>
          </div>
        ) : null}

        {contato.interacoes.map((i) => (
          <div key={i.id} className="item-card">
            <div className="item-card-main">
              <strong>
                {i.responsavel} · {i.data} {i.hora}
              </strong>
              <p>{i.descricao}</p>
            </div>
            <div className="item-acoes">
              <button
                type="button"
                className="btn btn-ghost btn-icon sm"
                aria-label="Editar"
                onClick={() => abrirEditar(i)}
              >
                ✎
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-icon sm danger-text"
                aria-label="Excluir"
                onClick={() => excluir(i.id)}
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
