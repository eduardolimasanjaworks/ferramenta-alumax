/**
 * Serviço de domínio do Calendário para as tools da IA.
 * Lista agendas, disponibilidade, marca / reagenda / cancela eventos.
 */
import { randomUUID } from 'node:crypto';
import {
  obterEstadoCalendario,
  salvarEstadoCalendario,
} from './calendario-pg.js';
import { sincronizarJobsDoEstado } from './calendario-jobs.js';
import {
  agoraBrasiliaIso,
  listarSlotsLivres,
  type AgendaDisp,
  type EventoBusy,
} from './calendario-disponibilidade.js';
import type { CalEstado } from './calendario-tipos.js';

type AgendaRaw = AgendaDisp & {
  tipo?: string;
  cor?: string;
  visivel?: boolean;
  linkPublicoAtivo?: boolean;
  linkChamadaPadrao?: string;
  config?: AgendaDisp['config'] & Record<string, unknown>;
};

type EventoRaw = EventoBusy & {
  titulo?: string;
  cor?: string;
  diaTodo?: boolean;
  convidado?: string;
  telefoneConvidado?: string;
  linkChamada?: string;
  notas?: string;
  notificacoes?: boolean;
  servicoId?: string | null;
  origem?: string;
};

function asAgendas(estado: CalEstado): AgendaRaw[] {
  return (estado.agendas || []) as AgendaRaw[];
}

function asEventos(estado: CalEstado): EventoRaw[] {
  return (estado.eventos || []) as EventoRaw[];
}

function norm(s: string): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function acharAgenda(
  agendas: AgendaRaw[],
  idOuNome?: string,
): AgendaRaw | null {
  if (!idOuNome) return agendas.find((a) => a.ativo !== false) || agendas[0] || null;
  const q = norm(idOuNome);
  return (
    agendas.find((a) => norm(a.id) === q) ||
    agendas.find((a) => norm(a.nome) === q) ||
    agendas.find((a) => norm(a.nome).includes(q)) ||
    null
  );
}

/** Garante agendas de demo ativas para a IA (idempotente). */
export async function garantirAgendasDemoIa(): Promise<void> {
  const estado = await obterEstadoCalendario();
  const agendas = asAgendas(estado);
  const ativas = agendas.filter((a) => a.ativo !== false && a.visivel !== false);
  if (ativas.length >= 2) return;

  const baseCfg = {
    dias: {
      dom: { ativo: false, janelas: [{ inicio: '09:00', fim: '18:00' }] },
      seg: { ativo: true, janelas: [{ inicio: '09:00', fim: '18:00' }] },
      ter: { ativo: true, janelas: [{ inicio: '09:00', fim: '18:00' }] },
      qua: { ativo: true, janelas: [{ inicio: '09:00', fim: '18:00' }] },
      qui: { ativo: true, janelas: [{ inicio: '09:00', fim: '18:00' }] },
      sex: { ativo: true, janelas: [{ inicio: '09:00', fim: '18:00' }] },
      sab: { ativo: false, janelas: [{ inicio: '09:00', fim: '13:00' }] },
    },
    intervaloAtendimentoMin: 30,
    limiteDiasFuturos: 21,
    numHorariosCliente: 5,
    antecedenciaMinutos: 60,
    semSobreposicao: true,
    notificacoes: [],
    parametros: [],
    parametrosPagina: [],
    mensagensExito: [],
  };

  const demos: AgendaRaw[] = [
    {
      id: 'ag-comercial',
      nome: 'Comercial Tilit',
      cor: '#009ef7',
      tempoPadraoMin: 30,
      tipo: 'Comercial',
      ativo: true,
      visivel: true,
        linkPublicoAtivo: false,
      linkChamadaPadrao: '',
      config: {
        ...baseCfg,
        descricaoPublica:
          'Use para propostas, apresentações comerciais e primeiros contatos de venda.',
      } as AgendaDisp['config'],
    },
    {
      id: 'ag-atendimento',
      nome: 'Atendimento Tilit',
      cor: '#50cd89',
      tempoPadraoMin: 30,
      tipo: 'Suporte',
      ativo: true,
      visivel: true,
      linkPublicoAtivo: false,
      linkChamadaPadrao: '',
      config: {
        ...baseCfg,
        antecedenciaMinutos: 120,
        descricaoPublica:
          'Use para suporte, dúvidas de clientes ativos e follow-up operacional.',
      } as AgendaDisp['config'],
    },
    {
      id: 'ag-visitas',
      nome: 'Visitas / Presencial',
      cor: '#f1416c',
      tempoPadraoMin: 60,
      tipo: 'Pessoal',
      ativo: true,
      visivel: true,
      linkPublicoAtivo: false,
      linkChamadaPadrao: '',
      config: {
        ...baseCfg,
        intervaloAtendimentoMin: 60,
        antecedenciaMinutos: 240,
        limiteDiasFuturos: 14,
        descricaoPublica:
          'Use para visitas presenciais, reuniões no escritório e encontros longos (60 min).',
      } as AgendaDisp['config'],
    },
  ];

  const ids = new Set(agendas.map((a) => a.id));
  const novas = demos.filter((d) => !ids.has(d.id));
  if (!novas.length && ativas.length) return;

  // ativa demos existentes se estavam inativos
  const merged = [
    ...agendas.map((a) => {
      const demo = demos.find((d) => d.id === a.id);
      if (!demo) return a;
      return {
        ...a,
        ativo: true,
        visivel: true,
        config: { ...(a.config || {}), ...(demo.config || {}) },
      };
    }),
    ...novas,
  ];

  await salvarEstadoCalendario({ ...estado, agendas: merged });
}

export async function listarAgendasParaIa(): Promise<
  Array<{
    id: string;
    nome: string;
    tipo: string;
    quandoUsar: string;
    antecedenciaMinutos: number;
    limiteDiasFuturos: number;
    intervaloMin: number;
  }>
> {
  await garantirAgendasDemoIa();
  const estado = await obterEstadoCalendario();
  return asAgendas(estado)
    .filter((a) => a.ativo !== false)
    .map((a) => ({
      id: a.id,
      nome: a.nome,
      tipo: String(a.tipo || ''),
      quandoUsar: String(a.config?.descricaoPublica || a.tipo || a.nome),
      antecedenciaMinutos: Number(a.config?.antecedenciaMinutos ?? 60),
      limiteDiasFuturos: Number(a.config?.limiteDiasFuturos ?? 30),
      intervaloMin: Number(
        a.config?.intervaloAtendimentoMin ?? a.tempoPadraoMin ?? 30,
      ),
    }));
}

export async function consultarDisponibilidadeIa(opts: {
  agenda?: string;
  data?: string;
  dias?: number;
  duracaoMin?: number;
}) {
  await garantirAgendasDemoIa();
  const estado = await obterEstadoCalendario();
  const agenda = acharAgenda(asAgendas(estado), opts.agenda);
  if (!agenda) {
    return { ok: false as const, erro: 'Agenda nao encontrada. Use listar_agendas.' };
  }
  const disp = listarSlotsLivres({
    agenda,
    eventos: asEventos(estado),
    data: opts.data,
    diasConsulta: opts.dias,
    duracaoMin: opts.duracaoMin,
  });
  return {
    ok: true as const,
    ...disp,
    sugestaoCliente: disp.slots.slice(0, disp.regras.numHorariosCliente),
    hoje: agoraBrasiliaIso(),
  };
}

export async function marcarEventoIa(opts: {
  agenda?: string;
  data: string;
  horaInicio: string;
  horaFim?: string;
  titulo?: string;
  convidado?: string;
  telefone?: string;
  notas?: string;
  duracaoMin?: number;
}) {
  await garantirAgendasDemoIa();
  const estado = await obterEstadoCalendario();
  const agenda = acharAgenda(asAgendas(estado), opts.agenda);
  if (!agenda) return { ok: false as const, erro: 'Agenda nao encontrada' };

  const dur =
    opts.duracaoMin ||
    Number(agenda.config?.intervaloAtendimentoMin ?? agenda.tempoPadraoMin ?? 30);
  const [hh, mm] = opts.horaInicio.split(':').map(Number);
  const fimMin = (hh || 0) * 60 + (mm || 0) + dur;
  const horaFim =
    opts.horaFim ||
    `${String(Math.floor(fimMin / 60)).padStart(2, '0')}:${String(fimMin % 60).padStart(2, '0')}`;

  // valida se ainda está livre
  const check = listarSlotsLivres({
    agenda,
    eventos: asEventos(estado),
    data: opts.data,
    duracaoMin: dur,
  });
  const livre = check.slots.some(
    (s) => s.data === opts.data && s.horaInicio === opts.horaInicio,
  );
  if (!livre) {
    return {
      ok: false as const,
      erro: 'Horario indisponivel (ocupado, fora da janela ou sem antecedencia). Consulte disponibilidade.',
      sugestoes: check.slots.slice(0, 5),
    };
  }

  const id = `ev-ia-${randomUUID().slice(0, 8)}`;
  const evento: EventoRaw = {
    id,
    titulo: opts.titulo || `Agendamento — ${opts.convidado || 'cliente'}`,
    cor: (agenda as { cor?: string }).cor || '#009ef7',
    agendaId: agenda.id,
    data: opts.data,
    horaInicio: opts.horaInicio,
    horaFim,
    diaTodo: false,
    convidado: opts.convidado || opts.telefone || '',
    telefoneConvidado: opts.telefone || '',
    linkChamada: (agenda as { linkChamadaPadrao?: string }).linkChamadaPadrao || '',
    notas: opts.notas || 'Criado pela IA',
    notificacoes: true,
    origem: 'ia',
  };

  const eventos = [...asEventos(estado), evento];
  await salvarEstadoCalendario({ ...estado, eventos });
  await sincronizarJobsDoEstado().catch(() => {});
  return { ok: true as const, evento };
}

export async function reagendarEventoIa(opts: {
  eventoId?: string;
  telefone?: string;
  novaData: string;
  novaHoraInicio: string;
  novaHoraFim?: string;
}) {
  const estado = await obterEstadoCalendario();
  const eventos = asEventos(estado);
  const ev =
    (opts.eventoId && eventos.find((e) => e.id === opts.eventoId)) ||
    (opts.telefone
      ? [...eventos]
          .reverse()
          .find(
            (e) =>
              String(e.telefoneConvidado || '').includes(opts.telefone!) ||
              String(e.convidado || '').includes(opts.telefone!),
          )
      : null);
  if (!ev) return { ok: false as const, erro: 'Evento nao encontrado' };

  const agenda = acharAgenda(asAgendas(estado), ev.agendaId);
  if (!agenda) return { ok: false as const, erro: 'Agenda do evento nao encontrada' };

  const dur = Number(agenda.config?.intervaloAtendimentoMin ?? agenda.tempoPadraoMin ?? 30);
  const [hh, mm] = opts.novaHoraInicio.split(':').map(Number);
  const fimMin = (hh || 0) * 60 + (mm || 0) + dur;
  const horaFim =
    opts.novaHoraFim ||
    `${String(Math.floor(fimMin / 60)).padStart(2, '0')}:${String(fimMin % 60).padStart(2, '0')}`;

  const outros = eventos.filter((e) => e.id !== ev.id);
  const check = listarSlotsLivres({
    agenda,
    eventos: outros,
    data: opts.novaData,
    duracaoMin: dur,
  });
  const livre = check.slots.some(
    (s) => s.data === opts.novaData && s.horaInicio === opts.novaHoraInicio,
  );
  if (!livre) {
    return {
      ok: false as const,
      erro: 'Novo horario indisponivel. Consulte disponibilidade.',
      sugestoes: check.slots.slice(0, 5),
    };
  }

  const atualizado: EventoRaw = {
    ...ev,
    data: opts.novaData,
    horaInicio: opts.novaHoraInicio,
    horaFim,
    notas: `Reagendado de ${ev.data} ${ev.horaInicio}. ${ev.notas || ''}`.trim(),
  };
  await salvarEstadoCalendario({
    ...estado,
    eventos: eventos.map((e) => (e.id === ev.id ? atualizado : e)),
  });
  await sincronizarJobsDoEstado().catch(() => {});
  return { ok: true as const, evento: atualizado };
}

export async function cancelarEventoIa(opts: {
  eventoId?: string;
  telefone?: string;
  data?: string;
}): Promise<{ ok: true; cancelado: EventoRaw } | { ok: false; erro: string }> {
  const estado = await obterEstadoCalendario();
  const eventos = asEventos(estado);
  const ev =
    (opts.eventoId && eventos.find((e) => e.id === opts.eventoId)) ||
    [...eventos].reverse().find((e) => {
      if (opts.data && e.data !== opts.data) return false;
      if (opts.telefone) {
        const t = opts.telefone;
        return (
          String(e.telefoneConvidado || '').includes(t) ||
          String(e.convidado || '').includes(t)
        );
      }
      return false;
    });
  if (!ev) return { ok: false, erro: 'Evento nao encontrado' };
  await salvarEstadoCalendario({
    ...estado,
    eventos: eventos.filter((e) => e.id !== ev.id),
  });
  await sincronizarJobsDoEstado().catch(() => {});
  return { ok: true, cancelado: ev };
}

export async function textoAgendasSystemPrompt(): Promise<string> {
  const listas = await listarAgendasParaIa();
  if (!listas.length) return '';
  const linhas = listas
    .map(
      (a) =>
        `- ${a.nome} (id=${a.id}): ${a.quandoUsar} | antecedência ${a.antecedenciaMinutos} min | até ${a.limiteDiasFuturos} dias | slots ~${a.intervaloMin} min`,
    )
    .join('\n');
  return `AGENDAS / CALENDÁRIOS DISPONÍVEIS (use as tools — não invente horários):
${linhas}
Fluxo: listar_agendas → consultar_disponibilidade → oferecer opções → marcar_evento (ou reagendar_evento / cancelar_evento).
Timezone: America/Sao_Paulo. Nunca invente horário livre sem consultar_disponibilidade.`;
}
