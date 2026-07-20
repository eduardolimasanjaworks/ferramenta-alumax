/**
 * Persistência Postgres do Calendário (snapshot + jobs de notificação).
 * Um estado por conta; jobs disparados pelo worker com fuso de Brasília.
 */
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import type { CalEstado, CalJobRow, CalJobStatus } from './calendario-tipos.js';

const pool = new pg.Pool({ connectionString: config.databaseUrl });

const ESTADO_VAZIO: CalEstado = {
  agendas: [],
  eventos: [],
  recursos: [],
  servicos: [],
  vinculos: {},
};

export async function inicializarBancoCalendario(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cal_estado (
      id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO cal_estado (id, payload)
    VALUES (1, $1::jsonb)
    ON CONFLICT (id) DO NOTHING
  `, [JSON.stringify(ESTADO_VAZIO)]);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cal_notif_jobs (
      id TEXT PRIMARY KEY,
      evento_id TEXT NOT NULL,
      regra_id TEXT NOT NULL,
      agenda_id TEXT NOT NULL DEFAULT '',
      telefone TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      enviar_em TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente',
      tentativas INT NOT NULL DEFAULT 0,
      ultimo_erro TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_cal_jobs_pendente
    ON cal_notif_jobs (enviar_em)
    WHERE status = 'pendente'
  `);
}

export async function obterEstadoCalendario(): Promise<CalEstado> {
  const { rows } = await pool.query<{ payload: CalEstado; atualizado_em: Date }>(
    `SELECT payload, atualizado_em FROM cal_estado WHERE id = 1`,
  );
  const p = rows[0]?.payload ?? ESTADO_VAZIO;
  return {
    agendas: Array.isArray(p.agendas) ? p.agendas : [],
    eventos: Array.isArray(p.eventos) ? p.eventos : [],
    recursos: Array.isArray(p.recursos) ? p.recursos : [],
    servicos: Array.isArray(p.servicos) ? p.servicos : [],
    vinculos: p.vinculos && typeof p.vinculos === 'object' ? p.vinculos : {},
    atualizado_em: rows[0]?.atualizado_em?.toISOString(),
  };
}

export async function salvarEstadoCalendario(estado: CalEstado): Promise<CalEstado> {
  const payload: CalEstado = {
    agendas: Array.isArray(estado.agendas) ? estado.agendas : [],
    eventos: Array.isArray(estado.eventos) ? estado.eventos : [],
    recursos: Array.isArray(estado.recursos) ? estado.recursos : [],
    servicos: Array.isArray(estado.servicos) ? estado.servicos : [],
    vinculos: estado.vinculos && typeof estado.vinculos === 'object' ? estado.vinculos : {},
  };
  const { rows } = await pool.query<{ payload: CalEstado; atualizado_em: Date }>(
    `UPDATE cal_estado SET payload = $1::jsonb, atualizado_em = NOW()
     WHERE id = 1
     RETURNING payload, atualizado_em`,
    [JSON.stringify(payload)],
  );
  return {
    ...payload,
    atualizado_em: rows[0]?.atualizado_em?.toISOString(),
  };
}

export async function cancelarJobsDoEvento(eventoId: string): Promise<void> {
  await pool.query(
    `UPDATE cal_notif_jobs
     SET status = 'cancelado', atualizado_em = NOW()
     WHERE evento_id = $1 AND status = 'pendente'`,
    [eventoId],
  );
}

export async function upsertJobNotificacao(job: {
  id?: string;
  eventoId: string;
  regraId: string;
  agendaId: string;
  telefone: string;
  mensagem: string;
  enviarEmIso: string;
}): Promise<CalJobRow> {
  const id = job.id || randomUUID();
  const { rows } = await pool.query(
    `INSERT INTO cal_notif_jobs
       (id, evento_id, regra_id, agenda_id, telefone, mensagem, enviar_em, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7::timestamptz,'pendente')
     ON CONFLICT (id) DO UPDATE SET
       telefone = EXCLUDED.telefone,
       mensagem = EXCLUDED.mensagem,
       enviar_em = EXCLUDED.enviar_em,
       status = 'pendente',
       ultimo_erro = NULL,
       atualizado_em = NOW()
     RETURNING *`,
    [
      id,
      job.eventoId,
      job.regraId,
      job.agendaId,
      job.telefone,
      job.mensagem,
      job.enviarEmIso,
    ],
  );
  return mapJob(rows[0]);
}

export async function listarJobsPendentesAte(isoLimite: string): Promise<CalJobRow[]> {
  const { rows } = await pool.query(
    `SELECT * FROM cal_notif_jobs
     WHERE status = 'pendente' AND enviar_em <= $1::timestamptz
     ORDER BY enviar_em ASC
     LIMIT 50`,
    [isoLimite],
  );
  return rows.map(mapJob);
}

export async function atualizarStatusJob(
  id: string,
  status: CalJobStatus,
  erro?: string,
): Promise<void> {
  await pool.query(
    `UPDATE cal_notif_jobs
     SET status = $2,
         tentativas = tentativas + 1,
         ultimo_erro = $3,
         atualizado_em = NOW()
     WHERE id = $1`,
    [id, status, erro ?? null],
  );
}

function mapJob(r: Record<string, unknown>): CalJobRow {
  return {
    id: String(r.id),
    evento_id: String(r.evento_id),
    regra_id: String(r.regra_id),
    agenda_id: String(r.agenda_id ?? ''),
    telefone: String(r.telefone),
    mensagem: String(r.mensagem),
    enviar_em: new Date(String(r.enviar_em)).toISOString(),
    status: String(r.status) as CalJobStatus,
    tentativas: Number(r.tentativas ?? 0),
    ultimo_erro: r.ultimo_erro != null ? String(r.ultimo_erro) : null,
  };
}
