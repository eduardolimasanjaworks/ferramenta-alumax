/**
 * Store do Calendário: UI + domínio (Recurso/Serviço) + sync domain services.
 * Grade continua rápida; conflito e casos de uso usam a camada ports.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadJson, saveJsonSoon } from '@/shared/lib/storage'
import { createCalendarioServices } from '../adapters'
import type { CalendarioServices } from '../adapters'
import { eventoConflitaCom } from '../domain/conflitos'
import type { Recurso, Servico } from '../domain/models'
import {
  agendaParaCanal,
  eventoParaCal,
  seedParaAgenda,
  uidCurto,
} from '../lib/bridgeAgenda'
import {
  carregarEstadoCalendarioApi,
  salvarEstadoCalendarioApi,
} from '../lib/apiCalendario'
import { configAgendaPadrao } from '../lib/configAgendaPadrao'
import { janelasDoDia } from '../lib/slotDia'
import type { Agenda, Evento, NovaAgendaInput, NovoEventoInput } from '../types'
import type { DiaSemana, SlotDia } from '../types/agendaConfig'
import {
  AGENDAS_PADRAO,
  CAL_STORAGE_KEY,
  EVENTOS_PADRAO,
} from './defaultData'
import { seedVinculos, type VinculosAgenda } from './persistShape'

function normalizarSlot(s: SlotDia | undefined, fallback: SlotDia): SlotDia {
  const base = s || fallback
  return {
    ...base,
    ativo: Boolean(base.ativo),
    janelas: janelasDoDia(base),
    inicio: undefined,
    fim: undefined,
  }
}

function normalizarAgenda(a: Agenda): Agenda {
  const base = configAgendaPadrao()
  const diasMerge = { ...base.dias, ...(a.config?.dias ?? {}) }
  const dias = Object.fromEntries(
    (Object.keys(base.dias) as DiaSemana[]).map((k) => [
      k,
      normalizarSlot(diasMerge[k], base.dias[k]),
    ]),
  ) as Record<DiaSemana, SlotDia>
  return {
    ...a,
    visivel: a.visivel !== false,
    linkPublicoAtivo: Boolean(a.linkPublicoAtivo),
    config: {
      ...base,
      ...(a.config ?? {}),
      dias,
    },
  }
}

type Ctx = {
  agendas: Agenda[]
  eventos: Evento[]
  recursos: Recurso[]
  servicos: Servico[]
  services: CalendarioServices
  vinculos: VinculosAgenda
  criarAgenda: (input: NovaAgendaInput) => Agenda
  atualizarAgenda: (id: string, patch: Partial<Agenda>) => void
  removerAgenda: (id: string) => void
  criarEvento: (input: NovoEventoInput) => void
  atualizarEvento: (id: string, patch: Partial<Evento>) => void
  removerEvento: (id: string) => void
  checarConflito: (candidato: Evento) => string | null
  servicosDaAgenda: (agendaId: string) => Servico[]
  recursoDaAgenda: (agendaId: string) => Recurso | undefined
  atualizarRecurso: (id: string, patch: Partial<Recurso>) => void
  adicionarServico: (
    agendaId: string,
    input: { nome: string; duracaoMin: number },
  ) => void
  atualizarServico: (id: string, patch: Partial<Servico>) => void
  removerServico: (agendaId: string, servicoId: string) => void
}

const CalContext = createContext<Ctx | null>(null)

export function CalendarioProvider({ children }: { children: ReactNode }) {
  const services = useMemo(() => createCalendarioServices(), [])

  const saved = loadJson(CAL_STORAGE_KEY, {
    agendas: AGENDAS_PADRAO,
    eventos: EVENTOS_PADRAO,
    recursos: [] as Recurso[],
    servicos: [] as Servico[],
    vinculos: {} as VinculosAgenda,
  })

  const seeded = seedVinculos(
    (saved.agendas.length ? saved.agendas : AGENDAS_PADRAO).map(normalizarAgenda),
    saved.recursos ?? [],
    saved.servicos ?? [],
    saved.vinculos ?? {},
  )

  const [agendas, setAgendas] = useState(seeded.agendas)
  const [eventos, setEventos] = useState(saved.eventos ?? [])
  const [recursos, setRecursos] = useState(seeded.recursos)
  const [servicos, setServicos] = useState(seeded.servicos)
  const [vinculos, setVinculos] = useState(seeded.vinculos)
  const [hidratadoApi, setHidratadoApi] = useState(false)

  // Hidrata do Postgres (API) — sobrescreve local se houver dados no servidor.
  useEffect(() => {
    let cancel = false
    ;(async () => {
      const remoto = await carregarEstadoCalendarioApi()
      if (cancel) return
      if (remoto && Array.isArray(remoto.agendas) && remoto.agendas.length > 0) {
        const s = seedVinculos(
          remoto.agendas.map(normalizarAgenda),
          remoto.recursos ?? [],
          remoto.servicos ?? [],
          remoto.vinculos ?? {},
        )
        setAgendas(s.agendas)
        setEventos(remoto.eventos ?? [])
        setRecursos(s.recursos)
        setServicos(s.servicos)
        setVinculos(s.vinculos)
      } else if (remoto && Array.isArray(remoto.agendas)) {
        // servidor vazio: envia seed local uma vez
        await salvarEstadoCalendarioApi({
          agendas,
          eventos,
          recursos,
          servicos,
          vinculos,
        })
      }
      setHidratadoApi(true)
    })()
    return () => {
      cancel = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hidratadoApi) return
    const payload = { agendas, eventos, recursos, servicos, vinculos }
    saveJsonSoon(CAL_STORAGE_KEY, payload)
    const t = setTimeout(() => {
      void salvarEstadoCalendarioApi(payload)
    }, 400)
    return () => clearTimeout(t)
  }, [agendas, eventos, recursos, servicos, vinculos, hidratadoApi])

  useEffect(() => {
    let cancel = false
    ;(async () => {
      for (const a of agendas) {
        const link = vinculos[a.id]
        if (!link || cancel) continue
        await services.repos.saveAgenda(
          agendaParaCanal(a, [link.recursoId], link.servicoIds),
        )
      }
      for (const r of recursos) if (!cancel) await services.repos.saveRecurso(r)
      for (const s of servicos) if (!cancel) await services.repos.saveServico(s)
      for (const e of eventos) {
        const link = vinculos[e.agendaId]
        if (!link || cancel) continue
        await services.repos.saveEvento(
          eventoParaCal(e, e.recursoId || link.recursoId),
        )
      }
    })()
    return () => {
      cancel = true
    }
  }, [agendas, eventos, recursos, servicos, vinculos, services])

  const criarAgenda = useCallback((input: NovaAgendaInput) => {
    const nova: Agenda = { id: uidCurto('ag'), ...input }
    const seed = seedParaAgenda(nova)
    setRecursos((p) => [...p, seed.recurso])
    setServicos((p) => [...p, seed.servico])
    setVinculos((p) => ({
      ...p,
      [nova.id]: { recursoId: seed.recurso.id, servicoIds: [seed.servico.id] },
    }))
    setAgendas((p) => [...p, nova])
    return nova
  }, [])

  const atualizarAgenda = useCallback((id: string, patch: Partial<Agenda>) => {
    setAgendas((p) => p.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }, [])

  const removerAgenda = useCallback(
    (id: string) => {
      setAgendas((p) => p.filter((a) => a.id !== id))
      setEventos((p) => p.filter((e) => e.agendaId !== id))
      setVinculos((p) => {
        const n = { ...p }
        delete n[id]
        return n
      })
      void services.repos.removeAgenda(id)
    },
    [services],
  )

  const criarEvento = useCallback(
    (input: NovoEventoInput) => {
      const link = vinculos[input.agendaId]
      setEventos((p) => [
        {
          id: uidCurto('ev'),
          ...input,
          recursoId: input.recursoId || link?.recursoId,
          servicoId: input.servicoId ?? link?.servicoIds[0] ?? null,
        },
        ...p,
      ])
    },
    [vinculos],
  )

  const atualizarEvento = useCallback((id: string, patch: Partial<Evento>) => {
    setEventos((p) => p.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }, [])

  const removerEvento = useCallback(
    (id: string) => {
      setEventos((p) => p.filter((e) => e.id !== id))
      void services.casosUso.excluirEvento(id)
    },
    [services],
  )

  const adicionarServico = useCallback(
    (agendaId: string, input: { nome: string; duracaoMin: number }) => {
      const s: Servico = {
        id: uidCurto('sv'),
        nome: input.nome,
        duracaoMin: input.duracaoMin,
        ativo: true,
      }
      setServicos((p) => [...p, s])
      setVinculos((p) => {
        const cur = p[agendaId]
        if (!cur) return p
        return {
          ...p,
          [agendaId]: { ...cur, servicoIds: [...cur.servicoIds, s.id] },
        }
      })
    },
    [],
  )

  const atualizarServico = useCallback((id: string, patch: Partial<Servico>) => {
    setServicos((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  const atualizarRecurso = useCallback((id: string, patch: Partial<Recurso>) => {
    setRecursos((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  const removerServico = useCallback((agendaId: string, servicoId: string) => {
    setVinculos((p) => {
      const cur = p[agendaId]
      if (!cur || cur.servicoIds.length <= 1) return p
      return {
        ...p,
        [agendaId]: {
          ...cur,
          servicoIds: cur.servicoIds.filter((id) => id !== servicoId),
        },
      }
    })
    setServicos((p) => p.filter((s) => s.id !== servicoId))
  }, [])

  const checarConflito = useCallback(
    (candidato: Evento) => {
      const link = vinculos[candidato.agendaId]
      const recursoId = candidato.recursoId || link?.recursoId
      if (!recursoId) return null
      const agenda = agendas.find((a) => a.id === candidato.agendaId)
      if (agenda?.config?.semSobreposicao === false) return null
      const cal = eventoParaCal(candidato, recursoId)
      const soEstaAgenda = Boolean(agenda?.config?.naoSincronizarOutrasAgendas)
      const existentes = eventos
        .filter((e) => !soEstaAgenda || e.agendaId === candidato.agendaId)
        .map((e) => {
          const l = vinculos[e.agendaId]
          return eventoParaCal(e, e.recursoId || l?.recursoId || recursoId)
        })
      const hit = eventoConflitaCom(cal, existentes)
      return hit ? `Conflito com "${hit.titulo}" no mesmo recurso` : null
    },
    [agendas, eventos, vinculos],
  )

  const servicosDaAgenda = useCallback(
    (agendaId: string) => {
      const ids = vinculos[agendaId]?.servicoIds ?? []
      return servicos.filter((s) => ids.includes(s.id) && s.ativo)
    },
    [servicos, vinculos],
  )

  const recursoDaAgenda = useCallback(
    (agendaId: string) => {
      const id = vinculos[agendaId]?.recursoId
      return recursos.find((r) => r.id === id)
    },
    [recursos, vinculos],
  )

  const value = useMemo(
    () => ({
      agendas,
      eventos,
      recursos,
      servicos,
      services,
      vinculos,
      criarAgenda,
      atualizarAgenda,
      removerAgenda,
      criarEvento,
      atualizarEvento,
      removerEvento,
      checarConflito,
      servicosDaAgenda,
      recursoDaAgenda,
      atualizarRecurso,
      adicionarServico,
      atualizarServico,
      removerServico,
    }),
    [
      agendas,
      eventos,
      recursos,
      servicos,
      services,
      vinculos,
      criarAgenda,
      atualizarAgenda,
      removerAgenda,
      criarEvento,
      atualizarEvento,
      removerEvento,
      checarConflito,
      servicosDaAgenda,
      recursoDaAgenda,
      atualizarRecurso,
      adicionarServico,
      atualizarServico,
      removerServico,
    ],
  )

  return <CalContext.Provider value={value}>{children}</CalContext.Provider>
}

export function useCalendario() {
  const ctx = useContext(CalContext)
  if (!ctx) throw new Error('useCalendario dentro de CalendarioProvider')
  return ctx
}
