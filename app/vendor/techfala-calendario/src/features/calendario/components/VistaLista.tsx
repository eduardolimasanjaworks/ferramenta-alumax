/**
 * Vista “Em Lista” — cabeçalho, período De/Até, busca e empty state.
 * Espelha o dump “emlista mesmo vazia” (sem Bubble).
 */
import { useEffect, useMemo, useState } from 'react'
import {
  IconChevronDown,
  IconFilter,
  IconList,
  IconPlus,
  IconSearch,
} from '@/shared/icons'
import { isoHoje, rotuloDataCompleta } from '../lib/formatData'
import { useCalendario } from '../store/calendarioStore'
import type { Evento } from '../types'

type FiltroChip = 'todos' | 'hoje' | 'passados' | 'futuros'

type Props = {
  diaSelecionado: string
  onEventoClick: (ev: Evento) => void
  onNovoEvento: () => void
}

export function VistaLista({
  diaSelecionado,
  onEventoClick,
  onNovoEvento,
}: Props) {
  const { eventos, agendas } = useCalendario()
  const [de, setDe] = useState(diaSelecionado || isoHoje())
  const [ate, setAte] = useState(diaSelecionado || isoHoje())
  const [busca, setBusca] = useState('')
  const [chip, setChip] = useState<FiltroChip>('hoje')

  useEffect(() => {
    if (!diaSelecionado) return
    setDe(diaSelecionado)
    setAte(diaSelecionado)
  }, [diaSelecionado])

  const vis = useMemo(
    () => new Set(agendas.filter((a) => a.visivel !== false).map((a) => a.id)),
    [agendas],
  )

  const hoje = isoHoje()

  const base = useMemo(() => {
    return eventos
      .filter((e) => vis.has(e.agendaId))
      .filter((e) => e.data >= de && e.data <= ate)
      .filter((e) => {
        const q = busca.trim().toLowerCase()
        if (!q) return true
        return (
          e.titulo.toLowerCase().includes(q) ||
          e.notas.toLowerCase().includes(q)
        )
      })
  }, [eventos, vis, de, ate, busca])

  const contagens = useMemo(() => {
    return {
      todos: base.length,
      hoje: base.filter((e) => e.data === hoje).length,
      passados: base.filter((e) => e.data < hoje).length,
      futuros: base.filter((e) => e.data > hoje).length,
    }
  }, [base, hoje])

  const lista = useMemo(() => {
    let out = base
    if (chip === 'hoje') out = base.filter((e) => e.data === hoje)
    if (chip === 'passados') out = base.filter((e) => e.data < hoje)
    if (chip === 'futuros') out = base.filter((e) => e.data > hoje)
    return [...out].sort((a, b) =>
      `${a.data}${a.horaInicio}`.localeCompare(`${b.data}${b.horaInicio}`),
    )
  }, [base, chip, hoje])

  const nomeAgenda = (id: string) =>
    agendas.find((a) => a.id === id)?.nome ?? '—'

  const chips: { id: FiltroChip; label: string }[] = [
    { id: 'todos', label: 'Todos Eventos' },
    { id: 'hoje', label: 'Hoje' },
    { id: 'passados', label: 'Passados' },
    { id: 'futuros', label: 'Futuros' },
  ]

  return (
    <div className="cal-lista-view">
      <div className="cal-lista-head">
        <span className="cal-lista-ico">
          <IconList />
        </span>
        <h2>Visualização em Lista</h2>
        <span className="cal-lista-line" />
      </div>

      <div className="cal-lista-periodo">
        <span className="cal-lista-lab">De:</span>
        <label className="cal-lista-date">
          <span>{rotuloDataCompleta(de)}</span>
          <IconChevronDown />
          <input
            type="date"
            value={de}
            onChange={(e) => setDe(e.target.value)}
            onClick={(e) => {
              const el = e.currentTarget
              try {
                el.showPicker?.()
              } catch {
                /* Safari antigo: só abre via foco */
              }
            }}
            aria-label="Data inicial"
          />
        </label>
        <span className="cal-lista-lab">Até:</span>
        <label className="cal-lista-date">
          <span>{rotuloDataCompleta(ate)}</span>
          <IconChevronDown />
          <input
            type="date"
            value={ate}
            onChange={(e) => setAte(e.target.value)}
            onClick={(e) => {
              const el = e.currentTarget
              try {
                el.showPicker?.()
              } catch {
                /* Safari antigo: só abre via foco */
              }
            }}
            aria-label="Data final"
          />
        </label>
      </div>

      <div className="cal-lista-tools">
        <div className="cal-lista-chips">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`cal-chip${chip === c.id ? ' is-active' : ''}`}
              onClick={() => setChip(c.id)}
            >
              {c.label}
              <span className="cal-chip-n">{contagens[c.id]}</span>
            </button>
          ))}
        </div>
        <div className="cal-lista-search-row">
          <div className="cal-lista-search">
            <input
              placeholder="Buscar eventos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <IconSearch />
          </div>
          <button type="button" className="cal-lista-filtros" title="Filtros">
            <IconFilter />
            Filtros
          </button>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="cal-lista-empty">
          <div className="cal-lista-empty-art" aria-hidden>
            <svg viewBox="0 0 100 100" fill="none">
              <rect x="18" y="22" width="64" height="56" rx="8" stroke="#111224" strokeWidth="3" />
              <path d="M30 40h40M30 52h28M30 64h20" stroke="#9aa0a6" strokeWidth="3" strokeLinecap="round" />
              <circle cx="72" cy="68" r="14" fill="#111224" />
              <path d="M72 62v12M66 68h12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <p>Ops! Nenhum evento criado com os filtros selecionados.</p>
          <button type="button" className="btn btn-primary" onClick={onNovoEvento}>
            <IconPlus />
            Novo Evento
          </button>
        </div>
      ) : (
        <div className="cal-lista-items">
          {lista.map((e) => (
            <button
              key={e.id}
              type="button"
              className="cal-lista-item"
              onClick={() => onEventoClick(e)}
            >
              <span className="cal-lista-dot" style={{ background: e.cor }} />
              <div className="cal-lista-body">
                <strong>{e.titulo}</strong>
                <p>
                  {rotuloDataCompleta(e.data)}
                  {e.diaTodo
                    ? ' · Dia todo'
                    : ` · ${e.horaInicio}–${e.horaFim}`}
                  {' · '}
                  {nomeAgenda(e.agendaId)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
