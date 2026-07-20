/**
 * Cliente HTTP do Calendário (painel Tilit).
 * Substitui localStorage como fonte da verdade quando a API responde.
 */
import type { Agenda, Evento } from '../types'
import type { Recurso, Servico } from '../domain/models'
import type { VinculosAgenda } from '../store/persistShape'

export type EstadoCalApi = {
  agendas: Agenda[]
  eventos: Evento[]
  recursos: Recurso[]
  servicos: Servico[]
  vinculos: VinculosAgenda
  atualizado_em?: string
}

const BASE = '/api/calendario'

export async function carregarEstadoCalendarioApi(): Promise<EstadoCalApi | null> {
  try {
    const res = await fetch(`${BASE}/estado`, { credentials: 'same-origin' })
    if (!res.ok) return null
    const data = (await res.json()) as { ok?: boolean; estado?: EstadoCalApi }
    if (!data.ok || !data.estado) return null
    return data.estado
  } catch {
    return null
  }
}

export async function salvarEstadoCalendarioApi(estado: EstadoCalApi): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/estado`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function testarGoogleApi(calendarId: string): Promise<{ ok: boolean; erro?: string }> {
  try {
    const res = await fetch(`${BASE}/google/testar`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calendarId }),
    })
    return (await res.json()) as { ok: boolean; erro?: string }
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : String(err) }
  }
}
