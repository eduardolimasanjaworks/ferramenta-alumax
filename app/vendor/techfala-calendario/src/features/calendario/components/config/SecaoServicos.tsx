/**
 * Serviços + quem executa (recurso): duração por serviço; conflito no recurso.
 * Várias agendas no mesmo recurso = mesma pessoa/equipe ocupada.
 */
import { useState } from 'react'
import { IconPlus, IconTrash } from '@/shared/icons'
import type { Servico } from '../../domain/models'
import { useCalendario } from '../../store/calendarioStore'

type Props = { agendaId: string }

export function SecaoServicos({ agendaId }: Props) {
  const {
    servicosDaAgenda,
    recursoDaAgenda,
    atualizarRecurso,
    adicionarServico,
    atualizarServico,
    removerServico,
  } = useCalendario()
  const list = servicosDaAgenda(agendaId)
  const recurso = recursoDaAgenda(agendaId)
  const [nome, setNome] = useState('')
  const [min, setMin] = useState(30)

  function add() {
    const n = nome.trim()
    if (!n) return
    adicionarServico(agendaId, { nome: n, duracaoMin: min })
    setNome('')
    setMin(30)
  }

  return (
    <div className="cfg-stack">
      <p className="cfg-help-lead">
        Cada serviço tem duração própria. O horário fica ocupado no{' '}
        <strong>colaborador / equipe</strong> abaixo — se outra agenda usar o
        mesmo, os horários conflitam (salvo “Não Sincronizar” nas regras).
      </p>

      <label className="field">
        <span>Quem executa (pessoa ou equipe):</span>
        <input
          className="input"
          placeholder="Ex.: Maria, Comercial, Equipe visita…"
          value={recurso?.nome ?? ''}
          disabled={!recurso}
          onChange={(e) => {
            if (recurso) atualizarRecurso(recurso.id, { nome: e.target.value })
          }}
        />
      </label>

      <div className="cfg-servicos-lista">
        <div className="cfg-servicos-head">
          <span>Serviço</span>
          <span>Duração</span>
          <span />
        </div>
        {list.map((s: Servico) => (
          <div key={s.id} className="cfg-servico-row">
            <input
              className="input"
              value={s.nome}
              onChange={(e) => atualizarServico(s.id, { nome: e.target.value })}
            />
            <div className="cfg-servico-dur">
              <input
                className="input"
                type="number"
                min={5}
                step={5}
                value={s.duracaoMin}
                onChange={(e) =>
                  atualizarServico(s.id, {
                    duracaoMin: Number(e.target.value) || 5,
                  })
                }
                aria-label="Duração em minutos"
              />
              <span className="cfg-card-meta">min</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              aria-label="Remover serviço"
              disabled={list.length <= 1}
              onClick={() => removerServico(agendaId, s.id)}
            >
              <IconTrash />
            </button>
          </div>
        ))}
      </div>

      <div className="cfg-servico-add">
        <input
          className="input"
          placeholder="Novo serviço (ex.: Consulta, Visita…)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add()
          }}
        />
        <div className="cfg-servico-dur">
          <input
            className="input"
            type="number"
            min={5}
            step={5}
            value={min}
            onChange={(e) => setMin(Number(e.target.value) || 5)}
            aria-label="Duração"
          />
          <span className="cfg-card-meta">min</span>
        </div>
        <button type="button" className="btn btn-primary" onClick={add}>
          <IconPlus />
          Add
        </button>
      </div>
    </div>
  )
}
