/**
 * Tipos da Campanha — espelham o formulário de disparo WhatsApp.
 * Mantém contrato estável entre UI e API.
 */
export type StatusCampanha =
  | 'rascunho'
  | 'agendada'
  | 'em_andamento'
  | 'pausada'
  | 'concluida'
  | 'cancelada'

export type MensagemCampanha = {
  id: string
  tipo: 'texto' | 'imagem' | 'arquivo' | 'video' | 'audio'
  texto: string
}

export type Campanha = {
  id: string
  nome: string
  tag: string
  instancia: string
  /** Sempre mensagem livre (template removido da UI). */
  modo?: 'livre'
  mensagens: MensagemCampanha[]
  delayMinSec: number
  delayMaxSec: number
  usarHorarios: boolean
  horarioInicio?: string
  horarioFim?: string
  agendadoEm: string | null
  status: StatusCampanha
  publicoEstimado?: number
  enviados?: number
  falhas?: number
  totalJobs?: number
  criadoEm: string
  atualizadoEm: string
}

export type InstanciaOpt = { name: string; label: string; connected?: boolean }
