/**
 * Stub Google — loga e devolve IDs fake.
 * Trocar por adapter HTTP/Directus flow sem mudar a porta.
 */
import type { GoogleCalendarPort } from '../../ports/google'

export function createLocalGoogleStub(): GoogleCalendarPort {
  return {
    async testarConexao(calendarId) {
      if (!calendarId.trim()) {
        return { ok: false, erro: 'Informe o ID da agenda Google' }
      }
      return { ok: true }
    },
    async listarBusy() {
      return []
    },
    async upsertEvento(_calendarId, evento) {
      return { googleEventId: evento.googleEventId || `g-local-${evento.id}` }
    },
    async excluirEvento() {
      /* no-op local */
    },
  }
}
