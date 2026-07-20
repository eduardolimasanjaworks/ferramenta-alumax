/**
 * Campos de data/hora do EventoSheet.
 * Extraído para manter o sheet abaixo de 300 linhas.
 */
type Props = {
  data: string
  setData: (v: string) => void
  diaTodo: boolean
  setDiaTodo: (v: boolean) => void
  horaInicio: string
  horaFim: string
  setHoraFim: (v: string) => void
  duracao: number
  onInicioChange: (v: string) => void
}

export function EventoDataHora({
  data,
  setData,
  diaTodo,
  setDiaTodo,
  horaInicio,
  horaFim,
  setHoraFim,
  duracao,
  onInicioChange,
}: Props) {
  return (
    <div className="cal-bloco">
      <div className="cal-bloco-head">Data e Hora</div>
      <label className="field">
        <span>Data Início:</span>
        <input
          className="input"
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
      </label>
      {!diaTodo ? (
        <div className="cal-form-row2">
          <label className="field">
            <span>Início Em:</span>
            <input
              className="input"
              type="time"
              value={horaInicio}
              onChange={(e) => onInicioChange(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Termina Em:</span>
            <input
              className="input"
              type="time"
              value={horaFim}
              onChange={(e) => setHoraFim(e.target.value)}
            />
            <small className="cal-hint">
              {duracao > 0 ? `${duracao} min` : '—'}
            </small>
          </label>
        </div>
      ) : null}
      <label className="cal-check">
        <input
          type="checkbox"
          checked={diaTodo}
          onChange={(e) => setDiaTodo(e.target.checked)}
        />
        Dia Todo?
      </label>
    </div>
  )
}
