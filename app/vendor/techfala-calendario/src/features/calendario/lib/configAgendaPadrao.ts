/**
 * Defaults da config de agenda — horários úteis e regras básicas.
 * Usado no seed e na migração de agendas antigas sem `config`.
 */
import type { AgendaConfig, DiaSemana, SlotDia } from '../types/agendaConfig'
import { slotDiaPadrao } from './slotDia'

const DIAS: DiaSemana[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']

function slot(ativo: boolean): SlotDia {
  return slotDiaPadrao(ativo)
}

export function configAgendaPadrao(): AgendaConfig {
  const dias = Object.fromEntries(
    DIAS.map((d) => [d, slot(d !== 'dom' && d !== 'sab')]),
  ) as Record<DiaSemana, SlotDia>

  return {
    googleConectado: false,
    googleAgendaId: '',
    notificacoes: [],
    dias,
    todosOsDias: false,
    intervaloAtendimentoMin: 30,
    tipoAgendamento: 'Horário marcado',
    limiteDiasFuturos: 30,
    numHorariosCliente: 3,
    antecedenciaMinutos: 60,
    notifPadraoDesativadas: true,
    semSobreposicao: true,
    naoSincronizarOutrasAgendas: false,
    linkPublicoSlug: '',
    paginaNotifDesativadas: true,
    paginaSemNeuralChains: true,
    descricaoPublica: '',
    parametros: [],
    parametrosPagina: [],
    mensagensExito: [],
  }
}

export const LABELS_DIA: { id: DiaSemana; letra: string }[] = [
  { id: 'dom', letra: 'D' },
  { id: 'seg', letra: 'S' },
  { id: 'ter', letra: 'T' },
  { id: 'qua', letra: 'Q' },
  { id: 'qui', letra: 'Q' },
  { id: 'sex', letra: 'S' },
  { id: 'sab', letra: 'S' },
]

export const TIPOS_AGENDAMENTO = [
  'Horário marcado',
]

