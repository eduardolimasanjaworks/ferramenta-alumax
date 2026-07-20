/**
 * Porta Google Calendar — sync write-through e free/busy.
 * Stub local agora; serviço real (ou Directus flow) depois.
 */
import type { EventoCal, Hora, IsoDate } from '../domain/models'

export type IntervaloBusy = {
  data: IsoDate
  horaInicio: Hora
  horaFim: Hora
}

export type GoogleCalendarPort = {
  /**
   * Valida se o calendarId está acessível pela conta de serviço
   * (após compartilhar com GOOGLE_SHARE_EMAIL).
   */
  testarConexao(calendarId: string): Promise<{ ok: boolean; erro?: string }>

  /** Eventos ocupados no Google — NÃO copia para nosso banco. */
  listarBusy(
    calendarId: string,
    de: IsoDate,
    ate: IsoDate,
  ): Promise<IntervaloBusy[]>

  /** Cria/atualiza espelho no Google ao salvar evento interno. */
  upsertEvento(
    calendarId: string,
    evento: EventoCal,
  ): Promise<{ googleEventId: string }>

  /** Remove espelho no Google. */
  excluirEvento(calendarId: string, googleEventId: string): Promise<void>
}
