/**
 * Tipos extras da configuração completa de Agenda.
 * Espelham o painel Bubble (Google, horários, regras, link público…).
 */

export type DiaSemana = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab'

/** Uma faixa contínua (ex.: 09:00–12:00). Várias = pausa entre elas. */
export type JanelaHorario = {
  inicio: string
  fim: string
}

export type SlotDia = {
  ativo: boolean
  /** Faixas do dia. Gap entre fim e próximo início = intervalo/pausa. */
  janelas: JanelaHorario[]
  /** @deprecated use janelas — mantido p/ JSON antigo */
  inicio?: string
  /** @deprecated use janelas */
  fim?: string
  /** Passo legado; duração real = intervaloAtendimentoMin da agenda */
  intervaloMin?: number
}

export type NotificacaoAgenda = {
  id: string
  titulo: string
  tipo: string
  dias: number
  horas: number
  minutos: number
  momento: string
  mensagem: string
  /** true = notifica; false = "Não notificar participantes". */
  whatsappParticipantes: boolean
  whatsappTerceiro: boolean
  telefoneTerceiro: string
}

export type ParametroAgenda = {
  id: string
  nome: string
  /** @deprecated use descricao — mantido na migração */
  valor?: string
  solicitarAo: string
  descricao: string
  tipo: string
  naoObrigatorio: boolean
  limitarOpcoes: boolean
}

export type MensagemExito = {
  id: string
  titulo: string
  enviarAo: string
  tipo: string
  texto: string
}

export type AgendaConfig = {
  googleConectado: boolean
  googleAgendaId: string
  notificacoes: NotificacaoAgenda[]
  dias: Record<DiaSemana, SlotDia>
  todosOsDias: boolean
  intervaloAtendimentoMin: number
  tipoAgendamento: string
  limiteDiasFuturos: number
  numHorariosCliente: number
  antecedenciaMinutos: number
  notifPadraoDesativadas: boolean
  semSobreposicao: boolean
  /** Se true, não bloqueia por eventos de outras agendas no mesmo recurso. */
  naoSincronizarOutrasAgendas?: boolean
  linkPublicoSlug: string
  paginaNotifDesativadas: boolean
  paginaSemNeuralChains: boolean
  /** Texto orientando a IA sobre quando usar esta agenda (não é página pública). */
  descricaoPublica: string
  parametros: ParametroAgenda[]
  /** @deprecated página pública removida */
  parametrosPagina: ParametroAgenda[]
  mensagensExito: MensagemExito[]
}
