/**
 * Persistência Postgres das campanhas (CRUD + tags/público).
 * Fila de jobs fica em campanhas-fila.ts.
 */
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { config } from './config.js';
import type { CampanhaRow, MensagemCampanha, StatusCampanha } from './campanhas-tipos.js';
import { canonizarTelefoneBr } from './util/telefone.js';

const pool = new pg.Pool({ connectionString: config.databaseUrl });

export function poolCampanhas() {
  return pool;
}

export async function inicializarBancoCampanhas(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS campanhas (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      tag TEXT NOT NULL DEFAULT '',
      instancia TEXT NOT NULL DEFAULT '',
      modo TEXT NOT NULL DEFAULT 'livre',
      mensagens JSONB NOT NULL DEFAULT '[]'::jsonb,
      delay_min_sec INT NOT NULL DEFAULT 30,
      delay_max_sec INT NOT NULL DEFAULT 120,
      usar_horarios BOOLEAN NOT NULL DEFAULT FALSE,
      horario_inicio TEXT,
      horario_fim TEXT,
      agendado_em TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'rascunho',
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS campanha_jobs (
      id TEXT PRIMARY KEY,
      campanha_id TEXT NOT NULL REFERENCES campanhas(id) ON DELETE CASCADE,
      telefone TEXT NOT NULL,
      mensagem_idx INT NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pendente',
      enviar_em TIMESTAMPTZ NOT NULL,
      enviado_em TIMESTAMPTZ,
      erro TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_campanha_jobs_pendente
      ON campanha_jobs (status, enviar_em)
      WHERE status = 'pendente';
  `);
}

function mapRow(r: Record<string, unknown>): CampanhaRow {
  return {
    id: String(r.id),
    nome: String(r.nome),
    tag: String(r.tag ?? ''),
    instancia: String(r.instancia ?? ''),
    modo: (r.modo === 'template' ? 'template' : 'livre') as 'livre' | 'template',
    mensagens: Array.isArray(r.mensagens) ? (r.mensagens as MensagemCampanha[]) : [],
    delayMinSec: Number(r.delay_min_sec ?? 30),
    delayMaxSec: Number(r.delay_max_sec ?? 120),
    usarHorarios: Boolean(r.usar_horarios),
    horarioInicio: r.horario_inicio ? String(r.horario_inicio) : null,
    horarioFim: r.horario_fim ? String(r.horario_fim) : null,
    agendadoEm: r.agendado_em ? new Date(String(r.agendado_em)).toISOString() : null,
    status: String(r.status || 'rascunho') as StatusCampanha,
    criadoEm: new Date(String(r.criado_em)).toISOString(),
    atualizadoEm: new Date(String(r.atualizado_em)).toISOString(),
  };
}

export async function listarCampanhasDb(): Promise<CampanhaRow[]> {
  const { rows } = await pool.query(`SELECT * FROM campanhas ORDER BY atualizado_em DESC`);
  const out: CampanhaRow[] = [];
  for (const r of rows) {
    const c = mapRow(r);
    const stats = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE status <> 'cancelado')::int AS total,
              COUNT(*) FILTER (WHERE status = 'enviado')::int AS enviados,
              COUNT(*) FILTER (WHERE status = 'erro')::int AS falhas
       FROM campanha_jobs WHERE campanha_id = $1`,
      [c.id],
    );
    c.totalJobs = Number(stats.rows[0]?.total ?? 0);
    c.enviados = Number(stats.rows[0]?.enviados ?? 0);
    c.falhas = Number(stats.rows[0]?.falhas ?? 0);
    c.publicoEstimado = await contarContatosPorTag(c.tag);
    out.push(c);
  }
  return out;
}

export async function obterCampanha(id: string): Promise<CampanhaRow | null> {
  const { rows } = await pool.query(`SELECT * FROM campanhas WHERE id = $1`, [id]);
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function upsertCampanha(
  input: Partial<CampanhaRow> & { nome: string },
): Promise<CampanhaRow> {
  const id = input.id || `cp-${randomUUID().slice(0, 8)}`;
  const existente = input.id ? await obterCampanha(input.id) : null;
  const mensagens = JSON.stringify(input.mensagens ?? existente?.mensagens ?? []);
  await pool.query(
    `INSERT INTO campanhas (
      id, nome, tag, instancia, modo, mensagens, delay_min_sec, delay_max_sec,
      usar_horarios, horario_inicio, horario_fim, agendado_em, status, atualizado_em
    ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,NOW())
    ON CONFLICT (id) DO UPDATE SET
      nome = EXCLUDED.nome, tag = EXCLUDED.tag, instancia = EXCLUDED.instancia,
      modo = EXCLUDED.modo, mensagens = EXCLUDED.mensagens,
      delay_min_sec = EXCLUDED.delay_min_sec, delay_max_sec = EXCLUDED.delay_max_sec,
      usar_horarios = EXCLUDED.usar_horarios, horario_inicio = EXCLUDED.horario_inicio,
      horario_fim = EXCLUDED.horario_fim, agendado_em = EXCLUDED.agendado_em,
      status = EXCLUDED.status, atualizado_em = NOW()`,
    [
      id,
      input.nome.trim(),
      input.tag ?? existente?.tag ?? '',
      input.instancia ?? existente?.instancia ?? '',
      input.modo ?? existente?.modo ?? 'livre',
      mensagens,
      input.delayMinSec ?? existente?.delayMinSec ?? 30,
      input.delayMaxSec ?? existente?.delayMaxSec ?? 120,
      input.usarHorarios ?? existente?.usarHorarios ?? false,
      input.horarioInicio ?? existente?.horarioInicio ?? null,
      input.horarioFim ?? existente?.horarioFim ?? null,
      input.agendadoEm
        ? new Date(input.agendadoEm)
        : existente?.agendadoEm
          ? new Date(existente.agendadoEm)
          : null,
      input.status ?? existente?.status ?? 'rascunho',
    ],
  );
  const c = await obterCampanha(id);
  if (!c) throw new Error('campanha nao salva');
  return c;
}

export async function excluirCampanhaDb(id: string): Promise<boolean> {
  const r = await pool.query(`DELETE FROM campanhas WHERE id = $1`, [id]);
  return (r.rowCount ?? 0) > 0;
}

export async function setStatusCampanha(
  id: string,
  status: StatusCampanha,
): Promise<CampanhaRow | null> {
  await pool.query(
    `UPDATE campanhas SET status = $2, atualizado_em = NOW() WHERE id = $1`,
    [id, status],
  );
  return obterCampanha(id);
}

export async function contarContatosPorTag(tag: string): Promise<number> {
  if (!tag.trim()) return 0;
  const { rows } = await pool.query(
    `SELECT COUNT(DISTINCT c.id)::int AS n
     FROM crm_contatos c
     JOIN crm_contato_tags t ON t.contato_id = c.id
     WHERE lower(t.tag) = lower($1)
       AND regexp_replace(COALESCE(c.telefone,''), '\\D', '', 'g') <> ''`,
    [tag.trim()],
  );
  return Number(rows[0]?.n ?? 0);
}

export async function telefonesPorTag(tag: string): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT DISTINCT
       regexp_replace(COALESCE(c.ddi,''), '\\D', '', 'g') AS ddi,
       regexp_replace(COALESCE(c.telefone,''), '\\D', '', 'g') AS tel
     FROM crm_contatos c
     JOIN crm_contato_tags t ON t.contato_id = c.id
     WHERE lower(t.tag) = lower($1)
       AND regexp_replace(COALESCE(c.telefone,''), '\\D', '', 'g') <> ''`,
    [tag.trim()],
  );
  const set = new Set<string>();
  for (const r of rows) {
    const tel = String(r.tel || '');
    const ddi = String(r.ddi || '55') || '55';
    // CRM guarda telefone local + ddi separado — unifica p/ WhatsApp.
    const bruto = tel.startsWith(ddi) ? tel : `${ddi}${tel}`;
    const canon = canonizarTelefoneBr(bruto);
    if (canon.length >= 12) set.add(canon);
  }
  return [...set];
}

export async function listarTagsCampanha(): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT DISTINCT tag FROM crm_contato_tags ORDER BY tag ASC LIMIT 500`,
  );
  return rows.map((r) => String(r.tag));
}
