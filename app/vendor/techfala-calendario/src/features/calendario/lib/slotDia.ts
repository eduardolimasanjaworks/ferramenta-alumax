/**
 * Normaliza SlotDia legado (um início/fim) → várias janelas.
 * Mantém compat com agendas já salvas.
 */
import type { JanelaHorario, SlotDia } from '../types/agendaConfig'

export function janelasDoDia(s: SlotDia | undefined | null): JanelaHorario[] {
  if (!s) return [{ inicio: '09:00', fim: '18:00' }]
  if (Array.isArray(s.janelas) && s.janelas.length > 0) {
    return s.janelas.map((j) => ({
      inicio: String(j.inicio || '09:00').slice(0, 5),
      fim: String(j.fim || '18:00').slice(0, 5),
    }))
  }
  // legado
  if (s.inicio || s.fim) {
    return [
      {
        inicio: String(s.inicio || '09:00').slice(0, 5),
        fim: String(s.fim || '18:00').slice(0, 5),
      },
    ]
  }
  return [{ inicio: '09:00', fim: '18:00' }]
}

export function slotDiaPadrao(ativo: boolean): SlotDia {
  return {
    ativo,
    janelas: [{ inicio: '09:00', fim: '18:00' }],
    intervaloMin: 30,
  }
}
