/**
 * Persistência local (localStorage) do domínio Calendário.
 * Substituível por DirectusRepos sem mudar ports/casos de uso.
 */
import { loadJson, saveJsonSoon } from '@/shared/lib/storage'
import type {
  AgendaCanal,
  EventoCal,
  JobNotificacao,
  MensagemExitoDom,
  Recurso,
  RegraNotificacao,
  Servico,
} from '../../domain/models'
import type { CalendarioRepos } from '../../ports/repos'

const KEY = 'techfala-cal-domain-v1'

type Db = {
  recursos: Recurso[]
  servicos: Servico[]
  agendas: AgendaCanal[]
  eventos: EventoCal[]
  regrasNotif: RegraNotificacao[]
  mensagens: MensagemExitoDom[]
  jobs: JobNotificacao[]
}

const vazio = (): Db => ({
  recursos: [],
  servicos: [],
  agendas: [],
  eventos: [],
  regrasNotif: [],
  mensagens: [],
  jobs: [],
})

function read(): Db {
  return loadJson<Db>(KEY, vazio())
}

function write(db: Db) {
  saveJsonSoon(KEY, db, 200)
}

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id)
  if (i < 0) return [...list, item]
  const next = [...list]
  next[i] = item
  return next
}

export function createLocalRepos(): CalendarioRepos {
  return {
    async listRecursos() {
      return read().recursos
    },
    async saveRecurso(r) {
      const db = read()
      write({ ...db, recursos: upsert(db.recursos, r) })
    },
    async removeRecurso(id) {
      const db = read()
      write({ ...db, recursos: db.recursos.filter((x) => x.id !== id) })
    },

    async listServicos() {
      return read().servicos
    },
    async saveServico(s) {
      const db = read()
      write({ ...db, servicos: upsert(db.servicos, s) })
    },
    async removeServico(id) {
      const db = read()
      write({ ...db, servicos: db.servicos.filter((x) => x.id !== id) })
    },

    async listAgendas() {
      return read().agendas
    },
    async saveAgenda(a) {
      const db = read()
      write({ ...db, agendas: upsert(db.agendas, a) })
    },
    async removeAgenda(id) {
      const db = read()
      write({
        ...db,
        agendas: db.agendas.filter((x) => x.id !== id),
        eventos: db.eventos.filter((x) => x.agendaId !== id),
      })
    },

    async listEventos(filtro) {
      let list = read().eventos
      if (filtro?.de) list = list.filter((e) => e.data >= filtro.de!)
      if (filtro?.ate) list = list.filter((e) => e.data <= filtro.ate!)
      return list
    },
    async saveEvento(e) {
      const db = read()
      write({ ...db, eventos: upsert(db.eventos, e) })
    },
    async removeEvento(id) {
      const db = read()
      write({ ...db, eventos: db.eventos.filter((x) => x.id !== id) })
    },

    async listRegrasNotif(agendaId) {
      return read().regrasNotif.filter((r) => r.agendaId === agendaId)
    },
    async saveRegraNotif(r) {
      const db = read()
      write({ ...db, regrasNotif: upsert(db.regrasNotif, r) })
    },
    async removeRegraNotif(id) {
      const db = read()
      write({ ...db, regrasNotif: db.regrasNotif.filter((x) => x.id !== id) })
    },

    async listMensagensExito(agendaId) {
      return read().mensagens.filter((m) => m.agendaId === agendaId)
    },
    async saveMensagemExito(m) {
      const db = read()
      write({ ...db, mensagens: upsert(db.mensagens, m) })
    },
    async removeMensagemExito(id) {
      const db = read()
      write({ ...db, mensagens: db.mensagens.filter((x) => x.id !== id) })
    },

    async listJobsPendentes(ateIso) {
      return read().jobs.filter(
        (j) => j.status === 'pendente' && j.enviarEm <= ateIso,
      )
    },
    async saveJob(j) {
      const db = read()
      write({ ...db, jobs: upsert(db.jobs, j) })
    },
  }
}
