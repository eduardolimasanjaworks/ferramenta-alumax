/**
 * Persistência de telefone de contato dos atendentes da fila.
 * Membership fica no Atendimento; o telefone é meta local do painel.
 */
import pg from 'pg';
import { config } from './config.js';

const pool = new pg.Pool({ connectionString: config.databaseUrl });

export async function inicializarFilaContatos(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fila_atendente_contato (
      chatwoot_user_id INTEGER PRIMARY KEY,
      telefone TEXT NOT NULL DEFAULT '',
      atualizado_em TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function obterTelefonesAtendentes(
  ids: number[],
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (!ids.length) return map;
  const { rows } = await pool.query<{ chatwoot_user_id: number; telefone: string }>(
    `SELECT chatwoot_user_id, telefone FROM fila_atendente_contato
     WHERE chatwoot_user_id = ANY($1::int[])`,
    [ids],
  );
  for (const r of rows) map.set(Number(r.chatwoot_user_id), String(r.telefone || ''));
  return map;
}

export async function salvarTelefoneAtendente(
  chatwootUserId: number,
  telefone: string,
): Promise<void> {
  const tel = String(telefone || '').replace(/\D/g, '');
  await pool.query(
    `INSERT INTO fila_atendente_contato (chatwoot_user_id, telefone, atualizado_em)
     VALUES ($1, $2, NOW())
     ON CONFLICT (chatwoot_user_id) DO UPDATE
       SET telefone = EXCLUDED.telefone, atualizado_em = NOW()`,
    [chatwootUserId, tel],
  );
}

export async function removerTelefoneAtendente(chatwootUserId: number): Promise<void> {
  await pool.query(`DELETE FROM fila_atendente_contato WHERE chatwoot_user_id = $1`, [
    chatwootUserId,
  ]);
}
