/**
 * Formato persistido + seed de vínculos agenda↔recurso/serviço.
 * Extraído do store para caber em arquivos pequenos.
 */
import type { Recurso, Servico } from '../domain/models'
import { seedParaAgenda } from '../lib/bridgeAgenda'
import type { Agenda, Evento } from '../types'

export type VinculosAgenda = Record<
  string,
  { recursoId: string; servicoIds: string[] }
>

export type CalPersisted = {
  agendas: Agenda[]
  eventos: Evento[]
  recursos: Recurso[]
  servicos: Servico[]
  vinculos: VinculosAgenda
}

export function seedVinculos(
  agendas: Agenda[],
  recursos: Recurso[],
  servicos: Servico[],
  vinculos: VinculosAgenda,
): Omit<CalPersisted, 'eventos'> {
  const r = [...recursos]
  const s = [...servicos]
  const v = { ...vinculos }
  for (const a of agendas) {
    if (v[a.id]) continue
    const seed = seedParaAgenda(a)
    r.push(seed.recurso)
    s.push(seed.servico)
    v[a.id] = { recursoId: seed.recurso.id, servicoIds: [seed.servico.id] }
  }
  return { agendas, recursos: r, servicos: s, vinculos: v }
}
