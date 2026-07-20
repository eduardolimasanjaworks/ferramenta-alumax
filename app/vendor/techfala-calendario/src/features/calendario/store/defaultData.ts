/**
 * Seed e chave de persistência do Calendário.
 * Agenda padrão para a tela não começar vazia.
 */
import { configAgendaPadrao } from '../lib/configAgendaPadrao'
import type { Agenda, Evento } from '../types'

export const CAL_STORAGE_KEY = 'techfala-calendario-v1'

export const AGENDAS_PADRAO: Agenda[] = [
  {
    id: 'ag-padrao',
    nome: 'nome da agenda',
    cor: '#009ef7',
    tempoPadraoMin: 60,
    tipo: 'Multi Chat',
    ativo: false,
    linkPublicoAtivo: false,
    visivel: true,
    linkChamadaPadrao: '',
    config: configAgendaPadrao(),
  },
]

export const EVENTOS_PADRAO: Evento[] = []

export const TEMPOS_PADRAO = [
  { min: 15, label: '15 min' },
  { min: 30, label: '30 min' },
  { min: 45, label: '45 min' },
  { min: 60, label: '60 min' },
  { min: 90, label: '90 min' },
  { min: 120, label: '2 horas' },
]

export const TIPOS_AGENDA = ['Multi Chat', 'Comercial', 'Suporte', 'Pessoal']
