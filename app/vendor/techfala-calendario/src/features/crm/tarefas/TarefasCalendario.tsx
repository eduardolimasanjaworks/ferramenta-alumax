/**
 * Vista calendário do painel (mês) — sheet mais largo.
 * Semana/Dia são stubs de UI; Mês mostra tarefas por dia.
 */
import { useMemo, useState } from 'react'
import {
  IconChevronLeft,
  IconChevronRight,
  IconList,
} from '@/shared/icons'
import {
  DIAS_SEMANA,
  montarMes,
  rotuloMesAno,
} from './calendarioMes'
import { useTarefas } from './tarefasStore'
import type { CalendarioModo } from './types'

type Props = { onLista: () => void }

export function TarefasCalendario({ onLista }: Props) {
  const { tarefas } = useTarefas()
  const [cursor] = useState(() => new Date())
  const [ano, setAno] = useState(cursor.getFullYear())
  const [mes0, setMes0] = useState(cursor.getMonth())
  const [modo, setModo] = useState<CalendarioModo>('mes')

  const cells = useMemo(() => montarMes(ano, mes0, cursor), [ano, mes0, cursor])

  const porDia = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of tarefas) {
      if (!t.vencimento) continue
      map.set(t.vencimento, (map.get(t.vencimento) ?? 0) + 1)
    }
    return map
  }, [tarefas])

  function irHoje() {
    const agora = new Date()
    setAno(agora.getFullYear())
    setMes0(agora.getMonth())
  }

  function prev() {
    if (mes0 === 0) {
      setAno((y) => y - 1)
      setMes0(11)
    } else setMes0((m) => m - 1)
  }

  function next() {
    if (mes0 === 11) {
      setAno((y) => y + 1)
      setMes0(0)
    } else setMes0((m) => m + 1)
  }

  return (
    <div className="tarefas-cal">
      <div className="tarefas-cal-toolbar">
        <div className="tarefas-cal-nav">
          <button type="button" className="btn btn-outline btn-sm" onClick={onLista}>
            <IconList />
            Lista
          </button>
          <span className="tarefas-cal-sep" />
          <button type="button" className="btn btn-outline btn-sm" onClick={irHoje}>
            Hoje
          </button>
          <button type="button" className="btn btn-ghost btn-icon-sm" onClick={prev} aria-label="Mês anterior">
            <IconChevronLeft />
          </button>
          <button type="button" className="btn btn-ghost btn-icon-sm" onClick={next} aria-label="Próximo mês">
            <IconChevronRight />
          </button>
          <span className="tarefas-cal-label">{rotuloMesAno(ano, mes0)}</span>
        </div>

        <div className="tarefas-cal-modos">
          {(['mes', 'semana', 'dia'] as CalendarioModo[]).map((m) => (
            <button
              key={m}
              type="button"
              className={modo === m ? 'is-active' : ''}
              onClick={() => setModo(m)}
            >
              {m === 'mes' ? 'Mês' : m === 'semana' ? 'Semana' : 'Dia'}
            </button>
          ))}
        </div>
      </div>

      {modo !== 'mes' ? (
        <p className="tarefas-vazio">Vista {modo} em breve — use Mês por enquanto.</p>
      ) : (
        <div className="tarefas-cal-grid-wrap">
          <div className="tarefas-cal-weekdays">
            {DIAS_SEMANA.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="tarefas-cal-grid">
            {cells.map((c) => (
              <div
                key={c.key}
                className={`tarefas-cal-cell${c.foraDoMes ? ' is-out' : ''}${c.hoje ? ' is-hoje' : ''}`}
              >
                <span className={c.hoje ? 'dia-hoje' : 'dia'}>{c.dia}</span>
                {(porDia.get(c.iso) ?? 0) > 0 ? (
                  <span className="cal-dot" title={`${porDia.get(c.iso)} tarefa(s)`}>
                    {porDia.get(c.iso)}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
