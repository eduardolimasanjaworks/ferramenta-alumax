/**
 * Ponte UI legada ↔ domínio (Recurso/Serviço/AgendaCanal/EventoCal).
 * Mantém a grade atual e prepara troca por Directus sem reescrever telas.
 */
import { disponibilidadePadrao, regrasPadrao } from '../domain/defaults'
import type {
  AgendaCanal,
  EventoCal,
  Recurso,
  Servico,
} from '../domain/models'
import type { Agenda, Evento } from '../types'

export function uidCurto(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

/** Cria recurso + serviço padrão ao nascer uma agenda. */
export function seedParaAgenda(a: Agenda): {
  recurso: Recurso
  servico: Servico
} {
  const recurso: Recurso = {
    id: uidCurto('rc'),
    nome: a.nome || 'Recurso',
    ativo: true,
  }
  const servico: Servico = {
    id: uidCurto('sv'),
    nome: 'Atendimento padrão',
    duracaoMin: a.tempoPadraoMin || 60,
    cor: a.cor,
    ativo: true,
  }
  return { recurso, servico }
}

export function agendaParaCanal(
  a: Agenda,
  recursoIds: string[],
  servicoIds: string[],
): AgendaCanal {
  return {
    id: a.id,
    nome: a.nome,
    cor: a.cor,
    ativo: a.ativo,
    linkPublicoAtivo: a.linkPublicoAtivo,
    visivel: a.visivel,
    slugPublico: a.config?.linkPublicoSlug || a.id,
    recursoIds,
    servicoIds,
    disponibilidade: {
      ...disponibilidadePadrao(),
      dias: (a.config?.dias as AgendaCanal['disponibilidade']['dias']) ??
        disponibilidadePadrao().dias,
      todosOsDias: a.config?.todosOsDias ?? false,
      intervaloAtendimentoMin: a.config?.intervaloAtendimentoMin ?? 30,
    },
    regras: {
      ...regrasPadrao(),
      tipoAgendamento: a.config?.tipoAgendamento ?? 'Horário marcado',
      limiteDiasFuturos: a.config?.limiteDiasFuturos ?? 30,
      numHorariosCliente: a.config?.numHorariosCliente ?? 3,
      antecedenciaMinutos: a.config?.antecedenciaMinutos ?? 60,
      notifPadraoDesativadas: a.config?.notifPadraoDesativadas ?? true,
      semSobreposicao: a.config?.semSobreposicao ?? true,
    },
    googleAgendaId: a.config?.googleAgendaId ?? '',
    googleConectado: a.config?.googleConectado ?? false,
    linkChamadaPadrao: a.linkChamadaPadrao,
  }
}

export function eventoParaCal(
  e: Evento,
  recursoId: string,
): EventoCal {
  return {
    id: e.id,
    titulo: e.titulo,
    agendaId: e.agendaId,
    recursoId: e.recursoId || recursoId,
    servicoId: e.servicoId ?? null,
    data: e.data,
    horaInicio: e.horaInicio,
    horaFim: e.horaFim,
    diaTodo: e.diaTodo,
    convidado: e.convidado,
    telefoneConvidado: e.convidado,
    linkChamada: e.linkChamada,
    notas: e.notas,
    googleEventId: null,
    origem: 'interno',
  }
}
