/**
 * Funções puras de conflito e disponibilidade.
 * Sem I/O — fáceis de testar e reusar no Directus/API depois.
 */
import type { DiaSemana, EventoCal, Hora, IsoDate, SlotDia } from './models'

function toMin(h: Hora): number {
  const [a, b] = h.split(':').map(Number)
  return (a || 0) * 60 + (b || 0)
}

/** Intervalos [inicio, fim) se sobrepõem. */
export function intervalosConflitam(
  aIni: Hora,
  aFim: Hora,
  bIni: Hora,
  bFim: Hora,
): boolean {
  return toMin(aIni) < toMin(bFim) && toMin(bIni) < toMin(aFim)
}

/**
 * Conflito = mesmo recurso + mesma data + horários que se cruzam.
 * Serviços diferentes no mesmo recurso ainda conflitam (é a mesma pessoa).
 */
export function eventoConflitaCom(
  candidato: Pick<EventoCal, 'recursoId' | 'data' | 'horaInicio' | 'horaFim' | 'id'>,
  existentes: EventoCal[],
): EventoCal | null {
  for (const e of existentes) {
    if (e.id === candidato.id) continue
    if (e.recursoId !== candidato.recursoId) continue
    if (e.data !== candidato.data) continue
    if (
      intervalosConflitam(
        candidato.horaInicio,
        candidato.horaFim,
        e.horaInicio,
        e.horaFim,
      )
    ) {
      return e
    }
  }
  return null
}

export function diaSemanaDe(iso: IsoDate): DiaSemana {
  const [y, m, d] = iso.split('-').map(Number)
  const map: DiaSemana[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
  return map[new Date(y, m - 1, d).getDay()]
}

export function slotAtende(
  slot: SlotDia,
  inicio: Hora,
  fim: Hora,
): boolean {
  if (!slot.ativo) return false
  const janelas =
    Array.isArray(slot.janelas) && slot.janelas.length > 0
      ? slot.janelas
      : slot.inicio || slot.fim
        ? [{ inicio: slot.inicio || '09:00', fim: slot.fim || '18:00' }]
        : []
  const a = toMin(inicio)
  const b = toMin(fim)
  return janelas.some((j) => a >= toMin(j.inicio) && b <= toMin(j.fim))
}

/** Soma minutos a uma hora HH:mm (mesmo dia; clamp 23:59). */
export function somarMinutos(hora: Hora, min: number): Hora {
  const total = Math.min(toMin(hora) + min, 23 * 60 + 59)
  const hh = String(Math.floor(total / 60)).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}`
}
