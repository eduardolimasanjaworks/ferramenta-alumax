/**
 * Factory única dos serviços de Calendário.
 * Trocar adapters aqui quando Directus/API estiverem prontos.
 */
import { criarCasosUso } from '../domain/casosUso'
import type { CasosUsoCalendario } from '../domain/casosUso'
import type { GoogleCalendarPort } from '../ports/google'
import type { NotificacaoPort } from '../ports/notificacoes'
import type { CalendarioRepos } from '../ports/repos'
import { createLocalGoogleStub } from './local/localGoogle'
import { createLocalNotifStub } from './local/localNotif'
import { createLocalRepos } from './local/localRepos'

export type CalendarioServices = {
  repos: CalendarioRepos
  google: GoogleCalendarPort
  notif: NotificacaoPort
  casosUso: CasosUsoCalendario
}

/** Ponto único de composição — Directus = novos create* e manter este shape. */
export function createCalendarioServices(): CalendarioServices {
  const repos = createLocalRepos()
  const google = createLocalGoogleStub()
  const notif = createLocalNotifStub()
  const casosUso = criarCasosUso({ repos, google })
  return { repos, google, notif, casosUso }
}
