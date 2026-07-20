/**
 * Pipelines (funis) do CRM — conjunto de colunas + flag principal.
 * Contatos do WhatsApp entram na 1ª coluna do funil principal.
 */
import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { invalidateBoardCache } from './crm-board-http.js';

export type CrmPipeline = {
  id: string;
  nome: string;
  principal: boolean;
  ordem: number;
};

function uid(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

const COLS_NOVO_FUNIL = [
  { titulo: 'Novos Leads', cor: 'rgb(59, 130, 246)' },
  { titulo: 'Em Negociação', cor: 'rgb(139, 92, 246)' },
  { titulo: 'Fechamento', cor: 'rgb(16, 185, 129)' },
];

export async function garantirSchemaPipelines(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS crm_pipelines (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      principal BOOLEAN NOT NULL DEFAULT FALSE,
      ordem INTEGER NOT NULL DEFAULT 0,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    ALTER TABLE crm_colunas
      ADD COLUMN IF NOT EXISTS pipeline_id TEXT REFERENCES crm_pipelines(id) ON DELETE CASCADE;
  `);

  const { rows: pipes } = await pool.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM crm_pipelines`,
  );
  if (Number(pipes[0]?.c || 0) === 0) {
    const id = 'pipe-principal';
    await pool.query(
      `INSERT INTO crm_pipelines (id, nome, principal, ordem) VALUES ($1,$2,TRUE,0)`,
      [id, 'Principal'],
    );
    await pool.query(
      `UPDATE crm_colunas SET pipeline_id = $1 WHERE pipeline_id IS NULL`,
      [id],
    );
  } else {
    await pool.query(`
      UPDATE crm_colunas SET pipeline_id = (
        SELECT id FROM crm_pipelines WHERE principal = TRUE ORDER BY ordem ASC LIMIT 1
      )
      WHERE pipeline_id IS NULL
    `);
  }
}

export async function listarPipelines(pool: pg.Pool): Promise<CrmPipeline[]> {
  const { rows } = await pool.query(
    `SELECT id, nome, principal, ordem FROM crm_pipelines ORDER BY ordem ASC, nome ASC`,
  );
  return rows.map((r) => ({
    id: String(r.id),
    nome: String(r.nome),
    principal: Boolean(r.principal),
    ordem: Number(r.ordem ?? 0),
  }));
}

export async function obterPipelinePrincipal(pool: pg.Pool): Promise<CrmPipeline | null> {
  const list = await listarPipelines(pool);
  return list.find((p) => p.principal) || list[0] || null;
}

/** 1ª coluna do funil principal (entrada WhatsApp → CRM). */
export async function colunaEntradaPrincipal(pool: pg.Pool): Promise<string | null> {
  const pipe = await obterPipelinePrincipal(pool);
  if (!pipe) return null;
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id FROM crm_colunas WHERE pipeline_id = $1 ORDER BY ordem ASC LIMIT 1`,
    [pipe.id],
  );
  return rows[0]?.id ?? null;
}

export async function criarPipeline(
  pool: pg.Pool,
  dados: { nome: string },
): Promise<CrmPipeline> {
  invalidateBoardCache();
  const { rows } = await pool.query<{ m: number }>(
    `SELECT COALESCE(MAX(ordem), -1) + 1 AS m FROM crm_pipelines`,
  );
  const ordem = Number(rows[0]?.m ?? 0);
  const id = uid('pipe');
  const nome = (dados.nome || 'Novo funil').trim() || 'Novo funil';
  await pool.query(
    `INSERT INTO crm_pipelines (id, nome, principal, ordem) VALUES ($1,$2,FALSE,$3)`,
    [id, nome, ordem],
  );
  let i = 0;
  for (const c of COLS_NOVO_FUNIL) {
    await pool.query(
      `INSERT INTO crm_colunas (id, titulo, cor, ordem, pipeline_id) VALUES ($1,$2,$3,$4,$5)`,
      [uid('col'), c.titulo, c.cor, i++, id],
    );
  }
  return { id, nome, principal: false, ordem };
}

export async function atualizarPipeline(
  pool: pg.Pool,
  id: string,
  patch: { nome?: string; principal?: boolean },
): Promise<CrmPipeline | null> {
  invalidateBoardCache();
  const list = await listarPipelines(pool);
  const atual = list.find((p) => p.id === id);
  if (!atual) return null;

  if (patch.principal === true) {
    await pool.query(`UPDATE crm_pipelines SET principal = FALSE`);
    await pool.query(`UPDATE crm_pipelines SET principal = TRUE WHERE id = $1`, [id]);
  }
  if (patch.nome != null) {
    const nome = patch.nome.trim() || atual.nome;
    await pool.query(`UPDATE crm_pipelines SET nome = $2 WHERE id = $1`, [id, nome]);
  }
  const next = await listarPipelines(pool);
  return next.find((p) => p.id === id) || null;
}

/**
 * Apaga funil e move TODAS as colunas (+ cards) para outro funil.
 */
export async function excluirPipeline(
  pool: pg.Pool,
  id: string,
  opts: { moverParaId: string },
): Promise<boolean> {
  invalidateBoardCache();
  if (!opts.moverParaId || opts.moverParaId === id) return false;
  const list = await listarPipelines(pool);
  const alvo = list.find((p) => p.id === opts.moverParaId);
  const origem = list.find((p) => p.id === id);
  if (!alvo || !origem) return false;
  if (list.length <= 1) return false;

  const { rows: maxOrd } = await pool.query<{ m: number }>(
    `SELECT COALESCE(MAX(ordem), -1) AS m FROM crm_colunas WHERE pipeline_id = $1`,
    [opts.moverParaId],
  );
  let base = Number(maxOrd[0]?.m ?? -1) + 1;
  const { rows: cols } = await pool.query<{ id: string }>(
    `SELECT id FROM crm_colunas WHERE pipeline_id = $1 ORDER BY ordem ASC`,
    [id],
  );
  for (const c of cols) {
    await pool.query(
      `UPDATE crm_colunas SET pipeline_id = $2, ordem = $3 WHERE id = $1`,
      [c.id, opts.moverParaId, base++],
    );
  }

  const eraPrincipal = origem.principal;
  await pool.query(`DELETE FROM crm_pipelines WHERE id = $1`, [id]);
  if (eraPrincipal) {
    await pool.query(`UPDATE crm_pipelines SET principal = TRUE WHERE id = $1`, [
      opts.moverParaId,
    ]);
  }
  return true;
}
