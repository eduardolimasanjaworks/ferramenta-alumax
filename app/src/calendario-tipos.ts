/**
 * Tipos do backend Calendário — espelho do snapshot da UI (localStorage → API).
 * Timezone de negócio: America/Sao_Paulo.
 */
export type CalEstado = {
  agendas: unknown[]
  eventos: unknown[]
  recursos: unknown[]
  servicos: unknown[]
  vinculos: Record<string, unknown>
  atualizado_em?: string
}

export type CalJobStatus = 'pendente' | 'enviado' | 'erro' | 'cancelado'

export type CalJobRow = {
  id: string
  evento_id: string
  regra_id: string
  agenda_id: string
  telefone: string
  mensagem: string
  enviar_em: string
  status: CalJobStatus
  tentativas: number
  ultimo_erro: string | null
}
