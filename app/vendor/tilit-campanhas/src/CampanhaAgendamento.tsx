/**
 * Delay, janela horária e data de agendamento do disparo.
 * Campos espelhando o fluxo TechFala de programação.
 */
import { toLocalInput } from './formHelpers'

type FormSlice = {
  delayMinSec?: number
  delayMaxSec?: number
  usarHorarios?: boolean
  horarioInicio?: string | null
  horarioFim?: string | null
  agendadoEm?: string | null
}

type Props = {
  form: FormSlice
  onPatch: (p: Partial<FormSlice>) => void
}

export function CampanhaAgendamento({ form, onPatch }: Props) {
  return (
    <>
      <div className="cp-delay">
        <span>
          Delay entre contatos: {form.delayMinSec ?? 30}s – {form.delayMaxSec ?? 120}s
        </span>
        <div className="cp-delay-row">
          <label>
            Mín (s)
            <input
              className="input"
              type="number"
              min={0}
              max={1200}
              value={form.delayMinSec ?? 30}
              onChange={(e) =>
                onPatch({
                  delayMinSec: Math.min(
                    Number(e.target.value) || 0,
                    form.delayMaxSec ?? 1200,
                  ),
                })
              }
            />
          </label>
          <label>
            Máx (s)
            <input
              className="input"
              type="number"
              min={0}
              max={1200}
              value={form.delayMaxSec ?? 120}
              onChange={(e) =>
                onPatch({
                  delayMaxSec: Math.max(
                    Number(e.target.value) || 0,
                    form.delayMinSec ?? 0,
                  ),
                })
              }
            />
          </label>
        </div>
      </div>

      <label className="cp-check">
        <input
          type="checkbox"
          checked={Boolean(form.usarHorarios)}
          onChange={(e) => onPatch({ usarHorarios: e.target.checked })}
        />
        Configurar horários permitidos para disparo
      </label>
      {form.usarHorarios ? (
        <div className="cp-delay-row">
          <label>
            Início
            <input
              className="input"
              type="time"
              value={form.horarioInicio || '09:00'}
              onChange={(e) => onPatch({ horarioInicio: e.target.value })}
            />
          </label>
          <label>
            Fim
            <input
              className="input"
              type="time"
              value={form.horarioFim || '18:00'}
              onChange={(e) => onPatch({ horarioFim: e.target.value })}
            />
          </label>
        </div>
      ) : null}

      <label className="field">
        <span>Data de Agendamento</span>
        <input
          className="input"
          type="datetime-local"
          value={toLocalInput(form.agendadoEm)}
          onChange={(e) =>
            onPatch({
              agendadoEm: e.target.value ? new Date(e.target.value).toISOString() : null,
            })
          }
        />
      </label>
    </>
  )
}
