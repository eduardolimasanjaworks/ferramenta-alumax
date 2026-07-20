/**
 * Stub WhatsApp — só registra no console.
 * Depois: n8n webhook, Evolution API, Directus flow, etc.
 */
import type { NotificacaoPort } from '../../ports/notificacoes'

export function createLocalNotifStub(): NotificacaoPort {
  return {
    async enviar(envio) {
      console.info('[notif-local]', envio.telefone, envio.mensagem.slice(0, 80))
      return { ok: true }
    },
  }
}
