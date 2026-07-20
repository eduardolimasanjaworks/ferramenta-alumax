/**
 * Disponibilidade: dias ativos + faixas Início/Fim em cards legíveis.
 * + Intervalo = outra faixa; buraco entre Fim e próximo Início = pausa.
 */
import { LABELS_DIA } from '../../lib/configAgendaPadrao'
import { janelasDoDia, slotDiaPadrao } from '../../lib/slotDia'
import type { AgendaConfig, DiaSemana, JanelaHorario } from '../../types/agendaConfig'

type Props = {
  config: AgendaConfig
  onChange: (patch: Partial<AgendaConfig>) => void
}

export function SecaoDisponibilidade({ config, onChange }: Props) {
  function setDia(
    id: DiaSemana,
    patch: Partial<{ ativo: boolean; janelas: JanelaHorario[] }>,
  ) {
    const atual = config.dias[id] || slotDiaPadrao(false)
    const janelas = patch.janelas ?? janelasDoDia(atual)
    onChange({
      dias: {
        ...config.dias,
        [id]: {
          ...atual,
          ...patch,
          janelas,
          inicio: undefined,
          fim: undefined,
        },
      },
    })
  }

  function setJanela(id: DiaSemana, idx: number, patch: Partial<JanelaHorario>) {
    const janelas = [...janelasDoDia(config.dias[id])]
    janelas[idx] = { ...janelas[idx]!, ...patch }
    setDia(id, { janelas })
  }

  function addJanela(id: DiaSemana) {
    const janelas = janelasDoDia(config.dias[id])
    const ultima = janelas[janelas.length - 1]
    const sugFim = ultima?.fim || '18:00'
    const [hh, mm] = sugFim.split(':').map(Number)
    const iniMin = Math.min((hh || 0) * 60 + (mm || 0) + 60, 22 * 60)
    const fimMin = Math.min(iniMin + 120, 23 * 60 + 30)
    const fmt = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    setDia(id, {
      janelas: [...janelas, { inicio: fmt(iniMin), fim: fmt(fimMin) }],
    })
  }

  function remJanela(id: DiaSemana, idx: number) {
    const janelas = janelasDoDia(config.dias[id])
    if (janelas.length <= 1) return
    setDia(id, { janelas: janelas.filter((_, i) => i !== idx) })
  }

  function aplicarTodos(origem: DiaSemana) {
    const base = janelasDoDia(config.dias[origem])
    const dias = { ...config.dias }
    ;(Object.keys(dias) as DiaSemana[]).forEach((k) => {
      if (dias[k]?.ativo) {
        dias[k] = {
          ...dias[k],
          janelas: base.map((j) => ({ ...j })),
          inicio: undefined,
          fim: undefined,
        }
      }
    })
    onChange({ dias })
  }

  function toggleTodos(v: boolean) {
    const dias = { ...config.dias }
    ;(Object.keys(dias) as DiaSemana[]).forEach((k) => {
      dias[k] = { ...(dias[k] || slotDiaPadrao(false)), ativo: v }
    })
    onChange({ todosOsDias: v, dias })
  }

  const ativos = LABELS_DIA.filter((d) => config.dias[d.id]?.ativo)

  return (
    <div className="cfg-stack">
      <div className="cfg-dias-head">
        <span>Dias de Atendimento:</span>
        <div className="cfg-dias-letras">
          {LABELS_DIA.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`cfg-dia-chip${config.dias[d.id]?.ativo ? ' is-on' : ''}`}
              onClick={() => setDia(d.id, { ativo: !config.dias[d.id]?.ativo })}
            >
              {d.letra}
            </button>
          ))}
        </div>
        <label className="cal-check">
          <input
            type="checkbox"
            checked={config.todosOsDias}
            onChange={(e) => toggleTodos(e.target.checked)}
          />
          Todos os Dias?
        </label>
      </div>

      {ativos.length === 0 ? (
        <p className="cfg-card-meta">Ative ao menos um dia acima.</p>
      ) : (
        <div className="cfg-janelas-lista">
          {ativos.map((d) => {
            const janelas = janelasDoDia(config.dias[d.id])
            return (
              <article key={d.id} className="cfg-dia-card">
                <header className="cfg-dia-card-head">
                  <span className="cfg-janela-letra">{d.letra}</span>
                  <strong>{labelDia(d.id)}</strong>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => aplicarTodos(d.id)}
                    title="Copia as faixas deste dia para os outros dias ativos"
                  >
                    Aplicar a todos
                  </button>
                </header>

                {janelas.map((j, idx) => (
                  <div key={`${d.id}-${idx}`} className="cfg-faixa-row">
                    <label className="field cfg-faixa-field">
                      <span>Início</span>
                      <input
                        type="time"
                        className="input"
                        value={j.inicio}
                        onChange={(e) =>
                          setJanela(d.id, idx, { inicio: e.target.value })
                        }
                      />
                    </label>
                    <span className="cfg-faixa-sep" aria-hidden>
                      →
                    </span>
                    <label className="field cfg-faixa-field">
                      <span>Fim</span>
                      <input
                        type="time"
                        className="input"
                        value={j.fim}
                        onChange={(e) =>
                          setJanela(d.id, idx, { fim: e.target.value })
                        }
                      />
                    </label>
                    {janelas.length > 1 ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        title="Remover faixa"
                        onClick={() => remJanela(d.id, idx)}
                      >
                        Remover
                      </button>
                    ) : (
                      <span className="cfg-faixa-spacer" />
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-primary btn-sm cfg-add-intervalo"
                  onClick={() => addJanela(d.id)}
                >
                  + Intervalo
                </button>
              </article>
            )
          })}
        </div>
      )}

      <p className="cfg-card-meta">
        Cada “+ Intervalo” cria outra faixa no mesmo dia. O buraco entre um Fim e
        o próximo Início é a pausa (ex.: almoço).
      </p>

      <label className="field">
        <span>Intervalo de Atendimento (duração de cada horário oferecido):</span>
        <select
          className="input"
          value={config.intervaloAtendimentoMin}
          onChange={(e) =>
            onChange({ intervaloAtendimentoMin: Number(e.target.value) })
          }
        >
          {[15, 30, 45, 60, 90].map((m) => (
            <option key={m} value={m}>
              {m} min
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

function labelDia(id: DiaSemana): string {
  const map: Record<DiaSemana, string> = {
    dom: 'Domingo',
    seg: 'Segunda',
    ter: 'Terça',
    qua: 'Quarta',
    qui: 'Quinta',
    sex: 'Sexta',
    sab: 'Sábado',
  }
  return map[id]
}
