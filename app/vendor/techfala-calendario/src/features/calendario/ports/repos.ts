/**
 * Contrato de persistência do Calendário.
 * Implementação local hoje; Directus/API depois — mesma interface.
 */
import type {
  AgendaCanal,
  EventoCal,
  JobNotificacao,
  MensagemExitoDom,
  Recurso,
  RegraNotificacao,
  Servico,
} from '../domain/models'

export type CalendarioRepos = {
  listRecursos(): Promise<Recurso[]>
  saveRecurso(r: Recurso): Promise<void>
  removeRecurso(id: string): Promise<void>

  listServicos(): Promise<Servico[]>
  saveServico(s: Servico): Promise<void>
  removeServico(id: string): Promise<void>

  listAgendas(): Promise<AgendaCanal[]>
  saveAgenda(a: AgendaCanal): Promise<void>
  removeAgenda(id: string): Promise<void>

  listEventos(filtro?: { de?: string; ate?: string }): Promise<EventoCal[]>
  saveEvento(e: EventoCal): Promise<void>
  removeEvento(id: string): Promise<void>

  listRegrasNotif(agendaId: string): Promise<RegraNotificacao[]>
  saveRegraNotif(r: RegraNotificacao): Promise<void>
  removeRegraNotif(id: string): Promise<void>

  listMensagensExito(agendaId: string): Promise<MensagemExitoDom[]>
  saveMensagemExito(m: MensagemExitoDom): Promise<void>
  removeMensagemExito(id: string): Promise<void>

  listJobsPendentes(ateIso: string): Promise<JobNotificacao[]>
  saveJob(j: JobNotificacao): Promise<void>
}
