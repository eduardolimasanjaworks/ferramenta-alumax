/**
 * Calcula horários livres de uma agenda (Brasília).
 * Respeita dias, várias janelas/dia, antecedência e limite futuro.
 */
export type JanelaCfg = { inicio: string; fim: string };

export type SlotDiaCfg = {
  ativo: boolean;
  /** Faixas do dia (preferido). */
  janelas?: JanelaCfg[];
  /** Legado: uma faixa só. */
  inicio?: string;
  fim?: string;
  intervaloMin?: number;
};

export type DiaSemana = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';

export type EventoBusy = {
  id: string;
  agendaId: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  recursoId?: string;
};

export type AgendaDisp = {
  id: string;
  nome: string;
  ativo?: boolean;
  tempoPadraoMin?: number;
  config?: {
    dias?: Partial<Record<DiaSemana, SlotDiaCfg>>;
    intervaloAtendimentoMin?: number;
    limiteDiasFuturos?: number;
    numHorariosCliente?: number;
    antecedenciaMinutos?: number;
    semSobreposicao?: boolean;
    descricaoPublica?: string;
  };
};

const DIAS: DiaSemana[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const OFFSET_BR = '-03:00';

function toMin(h: string): number {
  const [a, b] = String(h || '0:0').split(':').map(Number);
  return (a || 0) * 60 + (b || 0);
}

function fromMin(m: number): string {
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Normaliza SlotDia legado → lista de janelas. */
export function janelasDoSlot(s: SlotDiaCfg | undefined | null): JanelaCfg[] {
  if (!s) return [{ inicio: '09:00', fim: '18:00' }];
  if (Array.isArray(s.janelas) && s.janelas.length > 0) {
    return s.janelas.map((j) => ({
      inicio: String(j.inicio || '09:00').slice(0, 5),
      fim: String(j.fim || '18:00').slice(0, 5),
    }));
  }
  if (s.inicio || s.fim) {
    return [
      {
        inicio: String(s.inicio || '09:00').slice(0, 5),
        fim: String(s.fim || '18:00').slice(0, 5),
      },
    ];
  }
  return [{ inicio: '09:00', fim: '18:00' }];
}

export function agoraBrasiliaIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Minutos atuais em Brasília desde 00:00. */
export function minutosAgoraBrasilia(): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const hh = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const mm = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  return hh * 60 + mm;
}

export function isoBrasilia(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function diaSemanaIso(iso: string): DiaSemana {
  const [y, m, d] = iso.split('-').map(Number);
  return DIAS[new Date(y!, m! - 1, d!).getDay()]!;
}

function conflita(
  aIni: string,
  aFim: string,
  bIni: string,
  bFim: string,
): boolean {
  return toMin(aIni) < toMin(bFim) && toMin(bIni) < toMin(aFim);
}

function addDaysIso(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y!, m! - 1, d!);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/** Instantâneo UTC a partir de data+hora de Brasília. */
export function instanteBr(data: string, hora: string): Date {
  const h = hora.length === 5 ? `${hora}:00` : hora;
  return new Date(`${data}T${h}${OFFSET_BR}`);
}

export type SlotLivre = { data: string; horaInicio: string; horaFim: string };

export function listarSlotsLivres(opts: {
  agenda: AgendaDisp;
  eventos: EventoBusy[];
  data?: string;
  diasConsulta?: number;
  duracaoMin?: number;
}): {
  timezone: string;
  agendaId: string;
  agendaNome: string;
  regras: {
    antecedenciaMinutos: number;
    limiteDiasFuturos: number;
    intervaloMin: number;
    numHorariosCliente: number;
  };
  slots: SlotLivre[];
} {
  const cfg = opts.agenda.config || {};
  const antecedencia = Number(cfg.antecedenciaMinutos ?? 60);
  const limite = Number(cfg.limiteDiasFuturos ?? 30);
  const intervaloPadrao = Number(
    cfg.intervaloAtendimentoMin ?? opts.agenda.tempoPadraoMin ?? 30,
  );
  const duracao = Math.max(5, Number(opts.duracaoMin || intervaloPadrao));
  const maxMostrar = Math.max(1, Number(cfg.numHorariosCliente ?? 5));
  const diasCfg = cfg.dias || {};

  const hoje = agoraBrasiliaIso();
  const minStartMs = Date.now() + antecedencia * 60_000;

  const slots: SlotLivre[] = [];
  const diasVarredura = opts.data
    ? 1
    : Math.min(limite, Math.max(1, opts.diasConsulta ?? Math.min(limite, 14)));

  for (let i = 0; i < (opts.data ? 1 : diasVarredura); i++) {
    const data = opts.data || addDaysIso(hoje, i);
    const diffDias =
      (instanteBr(data, '12:00').getTime() -
        instanteBr(hoje, '12:00').getTime()) /
      86_400_000;
    if (diffDias < 0 || diffDias > limite) continue;

    const dow = diaSemanaIso(data);
    const slotDia = diasCfg[dow];
    if (!slotDia?.ativo) continue;

    const step = Math.max(5, Number(slotDia.intervaloMin || intervaloPadrao));
    const janelas = janelasDoSlot(slotDia);
    const ocupados = opts.eventos.filter(
      (e) => e.agendaId === opts.agenda.id && e.data === data,
    );

    for (const janela of janelas) {
      let cursor = toMin(janela.inicio);
      const fimJanela = toMin(janela.fim);
      if (fimJanela <= cursor) continue;

      while (cursor + duracao <= fimJanela) {
        const horaInicio = fromMin(cursor);
        const horaFim = fromMin(cursor + duracao);
        const iniDt = instanteBr(data, horaInicio);
        if (iniDt.getTime() < minStartMs) {
          cursor += step;
          continue;
        }
        const bate = ocupados.some((e) =>
          conflita(horaInicio, horaFim, e.horaInicio, e.horaFim),
        );
        if (!bate) {
          slots.push({ data, horaInicio, horaFim });
          if (slots.length >= maxMostrar * (opts.data ? 3 : 2)) break;
        }
        cursor += step;
      }
      if (slots.length >= maxMostrar * (opts.data ? 3 : 2)) break;
    }
    if (slots.length >= maxMostrar * 3) break;
  }

  const limitados = slots.slice(
    0,
    Math.max(maxMostrar, Math.min(slots.length, maxMostrar * 3)),
  );

  return {
    timezone: 'America/Sao_Paulo',
    agendaId: opts.agenda.id,
    agendaNome: opts.agenda.nome,
    regras: {
      antecedenciaMinutos: antecedencia,
      limiteDiasFuturos: limite,
      intervaloMin: duracao,
      numHorariosCliente: maxMostrar,
    },
    slots: limitados,
  };
}
