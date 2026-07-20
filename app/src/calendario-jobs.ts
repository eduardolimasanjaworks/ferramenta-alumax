/**
 * Agenda jobs de notificação a partir do estado + processa crons (Brasília).
 * Redis = lock de worker; Postgres = fila durável. Sem luxon — fuso -03 fixo (BR sem DST).
 */
import { obterRedis } from './lib/redis.js';
import { tentarEnviarResposta } from './lib/evolution.js';
import { config } from './config.js';
import {
  atualizarStatusJob,
  cancelarJobsDoEvento,
  listarJobsPendentesAte,
  obterEstadoCalendario,
  upsertJobNotificacao,
} from './calendario-pg.js';

const LOCK_KEY = 'cal:worker:lock';
/** Brasil sem horário de verão: America/Sao_Paulo = UTC-3. */
const OFFSET_BR = '-03:00';

type EventoLite = {
  id: string;
  titulo?: string;
  agendaId?: string;
  data?: string;
  horaInicio?: string;
  telefoneConvidado?: string;
  convidado?: string;
  notificacoes?: boolean;
};

type NotifLite = {
  id: string;
  titulo?: string;
  dias?: number;
  horas?: number;
  minutos?: number;
  momento?: 'antes' | 'depois';
  mensagem?: string;
  notificarParticipantes?: boolean;
  notificarTerceiro?: boolean;
  telefoneTerceiro?: string;
};

type AgendaLite = {
  id: string;
  config?: { notificacoes?: NotifLite[] };
};

function agoraUtcMs(): number {
  return Date.now();
}

/** Converte data+hora de Brasília para Date UTC. */
function instanteBrasilia(data: string, hora: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
  const h = hora.length === 5 ? `${hora}:00` : hora;
  const d = new Date(`${data}T${h}${OFFSET_BR}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function renderMsg(tpl: string, ev: EventoLite): string {
  return String(tpl || '')
    .replaceAll('{{titulo}}', ev.titulo || '')
    .replaceAll('{{convidado}}', ev.convidado || '')
    .replaceAll('{{data}}', ev.data || '')
    .replaceAll('{{hora}}', ev.horaInicio || '');
}

export async function sincronizarJobsDoEstado(): Promise<{ criados: number }> {
  const estado = await obterEstadoCalendario();
  const eventos = (estado.eventos || []) as EventoLite[];
  const agendas = (estado.agendas || []) as AgendaLite[];
  const porAgenda = new Map(agendas.map((a) => [a.id, a]));

  let criados = 0;
  const agora = agoraUtcMs();

  for (const ev of eventos) {
    if (!ev?.id) continue;
    await cancelarJobsDoEvento(ev.id);
    if (ev.notificacoes === false) continue;
    const agenda = porAgenda.get(String(ev.agendaId || ''));
    const regras = agenda?.config?.notificacoes || [];
    const inicio = instanteBrasilia(String(ev.data || ''), String(ev.horaInicio || '00:00'));
    if (!inicio) continue;

    for (const regra of regras) {
      const deltaMin =
        (Number(regra.dias) || 0) * 24 * 60 +
        (Number(regra.horas) || 0) * 60 +
        (Number(regra.minutos) || 0);
      const ms = deltaMin * 60_000;
      const enviarEm =
        regra.momento === 'depois'
          ? new Date(inicio.getTime() + ms)
          : new Date(inicio.getTime() - ms);

      if (enviarEm.getTime() <= agora - 60_000) continue;

      const msg = renderMsg(regra.mensagem || regra.titulo || 'Lembrete de agendamento', ev);
      const destinos: string[] = [];
      if (regra.notificarParticipantes !== false && ev.telefoneConvidado) {
        destinos.push(String(ev.telefoneConvidado));
      }
      if (regra.notificarTerceiro && regra.telefoneTerceiro) {
        destinos.push(String(regra.telefoneTerceiro));
      }
      for (const tel of [
        ...new Set(
          destinos.map((t) => t.replace(/\D/g, '')).filter((t) => t.length >= 10),
        ),
      ]) {
        await upsertJobNotificacao({
          eventoId: ev.id,
          regraId: String(regra.id || 'regra'),
          agendaId: String(ev.agendaId || ''),
          telefone: tel,
          mensagem: msg,
          enviarEmIso: enviarEm.toISOString(),
        });
        criados += 1;
      }
    }
  }
  return { criados };
}

export async function processarJobsCalendario(): Promise<number> {
  const redis = obterRedis();
  const locked = await redis.set(LOCK_KEY, '1', 'EX', 25, 'NX');
  if (!locked) return 0;

  try {
    const limite = new Date().toISOString();
    const jobs = await listarJobsPendentesAte(limite);
    let ok = 0;
    for (const job of jobs) {
      try {
        const r = await tentarEnviarResposta(
          job.telefone,
          job.mensagem,
          config.evolutionInstance,
          { remoteJid: `${job.telefone}@s.whatsapp.net`, fragmentar: false },
        );
        if (r.enviado) {
          await atualizarStatusJob(job.id, 'enviado');
          ok += 1;
        } else {
          await atualizarStatusJob(job.id, 'erro', r.motivo || 'envio_falhou');
        }
      } catch (err) {
        await atualizarStatusJob(
          job.id,
          'erro',
          err instanceof Error ? err.message : String(err),
        );
      }
    }
    return ok;
  } finally {
    await redis.del(LOCK_KEY).catch(() => {});
  }
}

export function iniciarWorkerCalendario(intervaloMs = 15_000): void {
  console.log('[calendario] worker (fuso America/Sao_Paulo / UTC-3) iniciado');
  const tick = async () => {
    try {
      await processarJobsCalendario();
    } catch (err) {
      console.error('[calendario] worker erro:', err);
    }
    setTimeout(tick, intervaloMs);
  };
  void tick();
}
