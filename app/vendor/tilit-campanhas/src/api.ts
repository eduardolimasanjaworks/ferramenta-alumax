/**
 * Cliente HTTP das Campanhas — centraliza rotas /api/campanhas.
 * Evita fetch espalhado nos sheets.
 */
import type { Campanha, InstanciaOpt } from './types'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function listarCampanhas() {
  return req<{ ok: boolean; campanhas: Campanha[] }>('/api/campanhas')
}

export function salvarCampanha(body: Partial<Campanha> & { nome: string }) {
  return req<{ ok: boolean; campanha: Campanha }>('/api/campanhas', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function atualizarCampanha(id: string, body: Partial<Campanha>) {
  return req<{ ok: boolean; campanha: Campanha }>(`/api/campanhas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function excluirCampanha(id: string) {
  return req<{ ok: boolean }>(`/api/campanhas/${id}`, { method: 'DELETE' })
}

export function agendarCampanha(id: string) {
  return req<{ ok: boolean; campanha: Campanha; jobs: number }>(
    `/api/campanhas/${id}/agendar`,
    { method: 'POST' },
  )
}

export function pausarCampanha(id: string) {
  return req<{ ok: boolean; campanha: Campanha }>(`/api/campanhas/${id}/pausar`, {
    method: 'POST',
  })
}

export function enviarAgoraCampanha(id: string) {
  return req<{ ok: boolean; campanha: Campanha; jobs: number }>(
    `/api/campanhas/${id}/enviar-agora`,
    { method: 'POST' },
  )
}

export function listarTags() {
  return req<{ ok: boolean; tags: string[] }>('/api/campanhas/meta/tags')
}

export function listarInstancias() {
  return req<{ ok: boolean; instancias: InstanciaOpt[] }>(
    '/api/campanhas/meta/instancias',
  )
}

export function estimarPublico(tag: string) {
  return req<{ ok: boolean; total: number }>(
    `/api/campanhas/meta/estimar?tag=${encodeURIComponent(tag)}`,
  )
}
