/**
 * Regras de transferência por fila (= quando a IA deve transferir).
 * Prompt editável no modal de Filas; injetado nas rules do agente.
 */
import pg from 'pg';
import { config } from './config.js';

const pool = new pg.Pool({ connectionString: config.databaseUrl });
let ready = false;

export async function inicializarFilaRegras(): Promise<void> {
  if (ready) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fila_regras_transferencia (
      team_id INTEGER PRIMARY KEY,
      quando_transferir TEXT NOT NULL DEFAULT '',
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  ready = true;
}

export async function obterRegraFila(teamId: number): Promise<string> {
  await inicializarFilaRegras();
  const { rows } = await pool.query(
    `SELECT quando_transferir FROM fila_regras_transferencia WHERE team_id = $1`,
    [teamId],
  );
  return String(rows[0]?.quando_transferir ?? '');
}

export async function salvarRegraFila(teamId: number, texto: string): Promise<void> {
  await inicializarFilaRegras();
  const t = String(texto || '').trim();
  await pool.query(
    `INSERT INTO fila_regras_transferencia (team_id, quando_transferir, atualizado_em)
     VALUES ($1, $2, NOW())
     ON CONFLICT (team_id) DO UPDATE SET
       quando_transferir = EXCLUDED.quando_transferir,
       atualizado_em = NOW()`,
    [teamId, t],
  );
}

export async function apagarRegraFila(teamId: number): Promise<void> {
  await inicializarFilaRegras();
  await pool.query(`DELETE FROM fila_regras_transferencia WHERE team_id = $1`, [teamId]);
}

export async function listarRegrasFilas(): Promise<Map<number, string>> {
  await inicializarFilaRegras();
  const { rows } = await pool.query(
    `SELECT team_id, quando_transferir FROM fila_regras_transferencia`,
  );
  const map = new Map<number, string>();
  for (const r of rows) {
    map.set(Number(r.team_id), String(r.quando_transferir || ''));
  }
  return map;
}
