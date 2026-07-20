/**
 * Aba Interações — layout fiel ao dump (responsável, data, HH:MM).
 */
import { useState } from 'react'
import type { Contato } from '@/shared/types/crm'
import { useCrm } from '../store/crmStore'
import { AbaCabecalho } from './AbaCabecalho'
import { RESPONSAVEIS } from './format'

type Props = { contato: Contato }

export function AbaInteracoes({ contato }: Props) {
  const { atualizarContato } = useCrm()
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState({
    responsavel: '',
    data: '',
    hh: '',
    mm: '',
    descricao: '',
  })

  const valido =
    form.responsavel &&
    form.data &&
    form.hh.length === 2 &&
    form.mm.length === 2 &&
    form.descricao.trim()

  function salvar() {
    if (!valido) return
    const hora = `${form.hh}:${form.mm}`
    const item = {
      id: `int-${crypto.randomUUID().slice(0, 8)}`,
      descricao: form.descricao.trim(),
      data: form.data,
      hora,
      responsavel: form.responsavel,
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
    setForm({ responsavel: '', data: '', hh: '', mm: '', descricao: '' })
    setAberto(false)
  }

  const n = contato.interacoes.length
  const contagem = n === 0 ? 'Nenhuma interação' : n === 1 ? '1 interação' : `${n} interações`

  return (
    <div className="aba-tab">
      <AbaCabecalho
        contagem={contagem}
        botaoLabel="Nova interação"
        onNovo={() => setAberto(true)}
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
                {RESPONSAVEIS.map((r) => (
                  <option key={r} value={r}>
                    {r}
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
              <button type="button" className="btn btn-ghost" onClick={() => setAberto(false)}>
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
            <strong>
              {i.responsavel} · {i.data} {i.hora}
            </strong>
            <p>{i.descricao}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
