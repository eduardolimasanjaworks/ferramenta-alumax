/**
 * Monta a grade do calendário mensal (Dom–Sáb).
 * Inclui dias do mês anterior/próximo para preencher as semanas.
 */

export type DiaCalendario = {
  key: string
  dia: number
  iso: string
  foraDoMes: boolean
  hoje: boolean
}

function isoLocal(y: number, m0: number, d: number): string {
  const mm = String(m0 + 1).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

export function montarMes(ano: number, mes0: number, hoje = new Date()): DiaCalendario[] {
  const primeiro = new Date(ano, mes0, 1)
  const inicioSemana = primeiro.getDay()
  const diasNoMes = new Date(ano, mes0 + 1, 0).getDate()
  const diasMesAnt = new Date(ano, mes0, 0).getDate()

  const hojeIso = isoLocal(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const cells: DiaCalendario[] = []

  for (let i = inicioSemana - 1; i >= 0; i--) {
    const d = diasMesAnt - i
    const y = mes0 === 0 ? ano - 1 : ano
    const m = mes0 === 0 ? 11 : mes0 - 1
    const iso = isoLocal(y, m, d)
    cells.push({ key: iso, dia: d, iso, foraDoMes: true, hoje: iso === hojeIso })
  }

  for (let d = 1; d <= diasNoMes; d++) {
    const iso = isoLocal(ano, mes0, d)
    cells.push({ key: iso, dia: d, iso, foraDoMes: false, hoje: iso === hojeIso })
  }

  let d = 1
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const y = mes0 === 11 ? ano + 1 : ano
    const m = mes0 === 11 ? 0 : mes0 + 1
    const iso = isoLocal(y, m, d)
    cells.push({ key: iso, dia: d, iso, foraDoMes: true, hoje: iso === hojeIso })
    d++
    if (cells.length >= 42) break
  }

  return cells
}

export function rotuloMesAno(ano: number, mes0: number): string {
  const d = new Date(ano, mes0, 1)
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
