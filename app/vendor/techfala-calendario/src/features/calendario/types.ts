/**
 * Tipos do módulo Calendário (agendas + eventos).
 * Fonte única para store, grade e formulários.
 */
import type { AgendaConfig } from './types/agendaConfig'

export type VistaCal = 'mensal' | 'lista'
export type { AgendaConfig } from './types/agendaConfig'

export type Agenda = {
  id: string
  nome: string
  cor: string
  tempoPadraoMin: number
  tipo: string
  /** Assistente gerencia a agenda automaticamente. */
  ativo: boolean
  /** @deprecated legado — página pública removida; mantido só p/ JSON antigo */
  linkPublicoAtivo: boolean
  /** Se false, eventos ficam ocultos na grade. */
  visivel: boolean
  linkChamadaPadrao: string
  config: AgendaConfig
}

export type Evento = {
  id: string
  titulo: string
  cor: string
  agendaId: string
  /** Quem ocupa o tempo (conflito). */
  recursoId?: string
  /** Tipo de atendimento / duração. */
  servicoId?: string | null
  data: string
  horaInicio: string
  horaFim: string
  diaTodo: boolean
  convidado: string
  linkChamada: string
  notas: string
  notificacoes: boolean
}

export type NovoEventoInput = Omit<Evento, 'id'>
export type NovaAgendaInput = Omit<Agenda, 'id'>
