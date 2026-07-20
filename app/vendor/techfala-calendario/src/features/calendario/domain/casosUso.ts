/**
 * Casos de uso de agendamento — orquestra repos + Google + regras.
 * UI e Directus chamam isto; não o storage direto.
 */
import { eventoConflitaCom, somarMinutos } from '../domain/conflitos'
import type { EventoCal, Servico } from '../domain/models'
import type { GoogleCalendarPort } from '../ports/google'
import type { CalendarioRepos } from '../ports/repos'

type Deps = {
  repos: CalendarioRepos
  google: GoogleCalendarPort
}

export function criarCasosUso({ repos, google }: Deps) {
  return {
    async salvarEvento(input: EventoCal, opts?: { forcarSobreposicao?: boolean }) {
      const agenda = (await repos.listAgendas()).find((a) => a.id === input.agendaId)
      if (!agenda) throw new Error('Agenda não encontrada')

      const existentes = await repos.listEventos({
        de: input.data,
        ate: input.data,
      })

      if (agenda.regras.semSobreposicao && !opts?.forcarSobreposicao) {
        const conflito = eventoConflitaCom(input, existentes)
        if (conflito) {
          throw new Error(`Conflito com evento "${conflito.titulo}" no mesmo recurso`)
        }
      }

      if (agenda.googleConectado && agenda.googleAgendaId) {
        const { googleEventId } = await google.upsertEvento(
          agenda.googleAgendaId,
          input,
        )
        input = { ...input, googleEventId, origem: 'interno' }
      }

      await repos.saveEvento(input)
      return input
    },

    async excluirEvento(id: string) {
      const ev = (await repos.listEventos()).find((e) => e.id === id)
      if (!ev) return
      const agenda = (await repos.listAgendas()).find((a) => a.id === ev.agendaId)
      if (agenda?.googleConectado && agenda.googleAgendaId && ev.googleEventId) {
        await google.excluirEvento(agenda.googleAgendaId, ev.googleEventId)
      }
      await repos.removeEvento(id)
    },

    /**
     * Monta fim a partir da duração do serviço (ou mantém horaFim).
     * Adianta o caso “10min vs 2h” no mesmo recurso.
     */
    async aplicarDuracaoServico(
      base: Omit<EventoCal, 'horaFim'> & { horaFim?: string },
      servicos: Servico[],
    ): Promise<EventoCal> {
      const svc = base.servicoId
        ? servicos.find((s) => s.id === base.servicoId)
        : null
      const horaFim = svc
        ? somarMinutos(base.horaInicio, svc.duracaoMin)
        : base.horaFim || base.horaInicio
      return { ...base, horaFim } as EventoCal
    },

    async busyCombinado(agendaId: string, de: string, ate: string) {
      const agenda = (await repos.listAgendas()).find((a) => a.id === agendaId)
      if (!agenda) return []
      const locais = await repos.listEventos({ de, ate })
      const doCanal = locais.filter((e) => e.agendaId === agendaId)
      let googleBusy = [] as Awaited<ReturnType<GoogleCalendarPort['listarBusy']>>
      if (agenda.googleConectado && agenda.googleAgendaId) {
        googleBusy = await google.listarBusy(agenda.googleAgendaId, de, ate)
      }
      return { locais: doCanal, googleBusy }
    },
  }
}

export type CasosUsoCalendario = ReturnType<typeof criarCasosUso>
