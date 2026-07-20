/**
 * Modelos de domínio do Calendário — independentes de React/UI/storage.
 * Trocar localStorage por Directus = só o adapter; estes tipos permanecem.
 */

export type IsoDate = string // YYYY-MM-DD
export type Hora = string // HH:mm

/** Quem “ocupa tempo”: pessoa, sala, equipamento. Conflito vive aqui. */
export type Recurso = {
  id: string
  nome: string
  ativo: boolean
  /** Google Calendar ID compartilhado (opcional, por recurso). */
  googleAgendaId?: string
  googleConectado?: boolean
}

/**
 * Tipo de atendimento com duração própria.
 * Ex.: consulta 10min vs procedimento 2h — mesmo Recurso, Serviços diferentes.
 */
export type Servico = {
  id: string
  nome: string
  duracaoMin: number
  cor?: string
  ativo: boolean
}

export type SlotDia = {
  ativo: boolean
  janelas?: { inicio: Hora; fim: Hora }[]
  /** Legado */
  inicio?: Hora
  fim?: Hora
  intervaloMin?: number
}

export type DiaSemana = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab'

export type Disponibilidade = {
  dias: Record<DiaSemana, SlotDia>
  todosOsDias: boolean
  intervaloAtendimentoMin: number
}

/**
 * Canal/vitrine de agendamento (assistente + link público).
 * NÃO é a unidade de conflito — aponta para Recurso(s) e Serviço(s).
 */
export type AgendaCanal = {
  id: string
  nome: string
  cor: string
  ativo: boolean
  linkPublicoAtivo: boolean
  visivel: boolean
  slugPublico: string
  recursoIds: string[]
  servicoIds: string[]
  disponibilidade: Disponibilidade
  regras: RegrasAgendamento
  googleAgendaId: string
  googleConectado: boolean
  linkChamadaPadrao: string
}

export type RegrasAgendamento = {
  tipoAgendamento: string
  limiteDiasFuturos: number
  numHorariosCliente: number
  antecedenciaMinutos: number
  notifPadraoDesativadas: boolean
  semSobreposicao: boolean
}

export type EventoCal = {
  id: string
  titulo: string
  agendaId: string
  recursoId: string
  servicoId: string | null
  data: IsoDate
  horaInicio: Hora
  horaFim: Hora
  diaTodo: boolean
  convidado: string
  telefoneConvidado: string
  linkChamada: string
  notas: string
  /** ID do evento espelhado no Google (write-through). */
  googleEventId: string | null
  origem: 'interno' | 'google'
}

export type MomentoNotif = 'antes' | 'depois'

export type RegraNotificacao = {
  id: string
  agendaId: string
  titulo: string
  tipo: string
  dias: number
  horas: number
  minutos: number
  momento: MomentoNotif
  mensagem: string
  notificarParticipantes: boolean
  notificarTerceiro: boolean
  telefoneTerceiro: string
}

export type MensagemExitoDom = {
  id: string
  agendaId: string
  titulo: string
  enviarAo: 'Agendamento' | 'Reagendamento' | 'Cancelamento'
  tipo: string
  texto: string
}

export type JobNotificacao = {
  id: string
  eventoId: string
  regraId: string
  telefone: string
  mensagem: string
  enviarEm: string // ISO datetime
  status: 'pendente' | 'enviado' | 'erro' | 'cancelado'
}
