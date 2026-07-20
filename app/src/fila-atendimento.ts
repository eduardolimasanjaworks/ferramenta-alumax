/**
 * Fila de atendimento: escolhe o próximo humano do departamento
 * (quem faz mais tempo que não recebeu conversa). Toggle em configuracao.
 */
import pg from 'pg';
import { config } from './config.js';
import { chatwootFetch } from './chatwoot-sync.js';

const pool = new pg.Pool({ connectionString: config.databaseUrl });
const CHAVE = 'fila_atendimento_habilitada';

export type MembroFila = {
  id: number;
  name: string;
  email: string;
  availability?: string;
};

export async function inicializarFilaAtendimento(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS configuracao (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL,
      atualizado_em TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fila_atendimento_ultimo (
      user_id INTEGER PRIMARY KEY,
      ultimo_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(
    `INSERT INTO configuracao (chave, valor)
     VALUES ($1, 'false')
     ON CONFLICT (chave) DO NOTHING`,
    [CHAVE],
  );
}

export async function filaAtendimentoHabilitada(): Promise<boolean> {
  const { rows } = await pool.query<{ valor: string }>(
    `SELECT valor FROM configuracao WHERE chave = $1 LIMIT 1`,
    [CHAVE],
  );
  const v = String(rows[0]?.valor ?? 'false').trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'on' || v === 'sim';
}

export async function setFilaAtendimentoHabilitada(on: boolean): Promise<boolean> {
  await pool.query(
    `INSERT INTO configuracao (chave, valor, atualizado_em)
     VALUES ($1, $2, NOW())
     ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = NOW()`,
    [CHAVE, on ? 'true' : 'false'],
  );
  return on;
}

async function listarMembrosDoDepartamento(teamId: number): Promise<MembroFila[]> {
  const r = await chatwootFetch(
    `/api/v1/accounts/${config.chatwootAccountId}/teams/${teamId}/team_members`,
  );
  if (!r.ok) return [];
  const data = (await r.json().catch(() => [])) as
    | Array<{ id?: number; name?: string; email?: string; availability_status?: string }>
    | { payload?: Array<{ id?: number; name?: string; email?: string; availability_status?: string }> };
  const lista = Array.isArray(data) ? data : Array.isArray(data.payload) ? data.payload : [];
  return lista
    .map((u) => ({
      id: Number(u.id),
      name: String(u.name || ''),
      email: String(u.email || ''),
      availability: String(u.availability_status || ''),
    }))
    .filter((u) => u.id > 0);
}

/** Próximo da fila = membro do departamento com atribuição mais antiga (ou nunca). */
export async function escolherProximoDaFila(teamId: number): Promise<MembroFila | null> {
  const membros = await listarMembrosDoDepartamento(teamId);
  if (!membros.length) return null;

  const ids = membros.map((m) => m.id);
  const { rows } = await pool.query<{ user_id: number; ultimo_em: string }>(
    `SELECT user_id, ultimo_em::text FROM fila_atendimento_ultimo WHERE user_id = ANY($1::int[])`,
    [ids],
  );
  const mapa = new Map(rows.map((r) => [Number(r.user_id), new Date(r.ultimo_em).getTime()]));

  const online = membros.filter((m) => !m.availability || m.availability === 'online');
  const poolCand = online.length ? online : membros;

  poolCand.sort((a, b) => {
    const ta = mapa.get(a.id) ?? 0;
    const tb = mapa.get(b.id) ?? 0;
    if (ta !== tb) return ta - tb;
    return a.id - b.id;
  });
  return poolCand[0] ?? null;
}

export async function registrarAtribuicaoFila(userId: number): Promise<void> {
  await pool.query(
    `INSERT INTO fila_atendimento_ultimo (user_id, ultimo_em)
     VALUES ($1, NOW())
     ON CONFLICT (user_id) DO UPDATE SET ultimo_em = NOW()`,
    [userId],
  );
}
