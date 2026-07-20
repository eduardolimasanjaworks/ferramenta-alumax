/**
 * Porta de envio de notificações (WhatsApp etc.).
 * Stub local agora; provedor real / n8n / Directus depois.
 */
export type EnvioNotificacao = {
  telefone: string
  mensagem: string
  meta?: { eventoId?: string; regraId?: string }
}

export type NotificacaoPort = {
  enviar(envio: EnvioNotificacao): Promise<{ ok: boolean; erro?: string }>
}
