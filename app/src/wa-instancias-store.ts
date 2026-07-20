/**
 * Persistência de linhas WhatsApp (Evolution/Uaz) por app.
 * Seed a partir do .env; CRUD usado pelo painel multi-instância.
 */
import pg from 'pg';
import { config } from './config.js';

const pool = new pg.Pool({ connectionString: config.databaseUrl });

export type WaInstanciaRow = {
  id: number;
  nome: string;
  label: string;
  provider: 'evolution' | 'uazapi';
  chatwoot_inbox_name: string | null;
  chatwoot_inbox_id: string | null;
  webhook_url: string | null;
  ativo: boolean;
};

export async function inicializarBancoWaInstancias(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wa_instancias (
      id SERIAL PRIMARY KEY,
      nome TEXT UNIQUE NOT NULL,
      label TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'evolution',
      chatwoot_inbox_name TEXT,
      chatwoot_inbox_id TEXT,
      webhook_url TEXT,
      ativo BOOLEAN NOT NULL DEFAULT true,
      criado_em TIMESTAMPTZ DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const { rows } = await pool.query<{ n: string }>('SELECT COUNT(*)::text AS n FROM wa_instancias');
  if (Number(rows[0]?.n || 0) > 0) return;

  const webhookPadrao =
    process.env.IAGMX_WEBHOOK_EVOLUTION_URL || `${config.publicUrl}/webhook/evolution`;

  if (config.uazapiToken && config.uazapiBaseUrl) {
    await upsertWaInstancia({
      nome: 'atendimento',
      label: 'atendimento',
      provider: 'uazapi',
      webhook_url: process.env.UAZAPI_WEBHOOK_URL || `${config.publicUrl}/webhook/uazapi`,
    });
  }

  const evo = (config.evolutionInstances?.length
    ? config.evolutionInstances
    : [config.evolutionInstance]
  ).filter((n) => n && !/atendimento/i.test(n));

  for (const nome of evo) {
    await upsertWaInstancia({
      nome,
      label: nome.replace(/-chatwoot$/i, '').replace(/^tilit-/i, ''),
      provider: 'evolution',
      chatwoot_inbox_name: nome.replace(/-chatwoot$/i, ''),
      webhook_url: webhookPadrao,
    });
  }
  console.log(`[wa] seed ${evo.length} instancia(s) evolution`);
}

export async function listarWaInstancias(opts?: {
  soAtivas?: boolean;
}): Promise<WaInstanciaRow[]> {
  const soAtivas = opts?.soAtivas !== false;
  const { rows } = await pool.query<WaInstanciaRow>(
    soAtivas
      ? `SELECT id, nome, label, provider, chatwoot_inbox_name, chatwoot_inbox_id,
                webhook_url, ativo FROM wa_instancias WHERE ativo = true ORDER BY id ASC`
      : `SELECT id, nome, label, provider, chatwoot_inbox_name, chatwoot_inbox_id,
                webhook_url, ativo FROM wa_instancias ORDER BY id ASC`,
  );
  return rows.map((r) => ({
    ...r,
    provider: r.provider === 'uazapi' ? 'uazapi' : 'evolution',
    ativo: Boolean(r.ativo),
  }));
}

export async function obterWaInstancia(nome: string): Promise<WaInstanciaRow | null> {
  const { rows } = await pool.query<WaInstanciaRow>(
    `SELECT id, nome, label, provider, chatwoot_inbox_name, chatwoot_inbox_id,
            webhook_url, ativo FROM wa_instancias WHERE nome = $1 LIMIT 1`,
    [nome],
  );
  return rows[0] ?? null;
}

export async function upsertWaInstancia(input: {
  nome: string;
  label?: string;
  provider?: 'evolution' | 'uazapi';
  chatwoot_inbox_name?: string | null;
  chatwoot_inbox_id?: string | null;
  webhook_url?: string | null;
  ativo?: boolean;
}): Promise<WaInstanciaRow> {
  const nome = input.nome.trim();
  if (!nome) throw new Error('nome_obrigatorio');
  const label = (input.label || nome).trim();
  const provider = input.provider || 'evolution';
  await pool.query(
    `INSERT INTO wa_instancias
       (nome, label, provider, chatwoot_inbox_name, chatwoot_inbox_id, webhook_url, ativo)
     VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,true))
     ON CONFLICT (nome) DO UPDATE SET
       label = EXCLUDED.label,
       provider = EXCLUDED.provider,
       chatwoot_inbox_name = COALESCE(EXCLUDED.chatwoot_inbox_name, wa_instancias.chatwoot_inbox_name),
       chatwoot_inbox_id = COALESCE(EXCLUDED.chatwoot_inbox_id, wa_instancias.chatwoot_inbox_id),
       webhook_url = COALESCE(EXCLUDED.webhook_url, wa_instancias.webhook_url),
       ativo = COALESCE(EXCLUDED.ativo, wa_instancias.ativo),
       atualizado_em = NOW()`,
    [
      nome,
      label,
      provider,
      input.chatwoot_inbox_name ?? null,
      input.chatwoot_inbox_id ?? null,
      input.webhook_url ?? null,
      input.ativo,
    ],
  );
  const row = await obterWaInstancia(nome);
  if (!row) throw new Error('falha_upsert_wa');
  return row;
}

export async function atualizarWaInstancia(
  nome: string,
  patch: {
    label?: string;
    chatwoot_inbox_name?: string | null;
    chatwoot_inbox_id?: string | null;
    webhook_url?: string | null;
    ativo?: boolean;
  },
): Promise<WaInstanciaRow> {
  const atual = await obterWaInstancia(nome);
  if (!atual) throw new Error('instancia_nao_encontrada');
  await pool.query(
    `UPDATE wa_instancias SET
       label = COALESCE($2, label),
       chatwoot_inbox_name = COALESCE($3, chatwoot_inbox_name),
       chatwoot_inbox_id = COALESCE($4, chatwoot_inbox_id),
       webhook_url = COALESCE($5, webhook_url),
       ativo = COALESCE($6, ativo),
       atualizado_em = NOW()
     WHERE nome = $1`,
    [
      nome,
      patch.label ?? null,
      patch.chatwoot_inbox_name === undefined ? null : patch.chatwoot_inbox_name,
      patch.chatwoot_inbox_id === undefined ? null : patch.chatwoot_inbox_id,
      patch.webhook_url === undefined ? null : patch.webhook_url,
      patch.ativo ?? null,
    ],
  );
  // COALESCE com null não atualiza — refazer se campos explícitos null
  if (patch.chatwoot_inbox_name === null) {
    await pool.query(`UPDATE wa_instancias SET chatwoot_inbox_name = NULL WHERE nome = $1`, [nome]);
  }
  if (patch.label) {
    await pool.query(`UPDATE wa_instancias SET label = $2 WHERE nome = $1`, [nome, patch.label]);
  }
  if (typeof patch.ativo === 'boolean') {
    await pool.query(`UPDATE wa_instancias SET ativo = $2 WHERE nome = $1`, [nome, patch.ativo]);
  }
  const row = await obterWaInstancia(nome);
  if (!row) throw new Error('instancia_nao_encontrada');
  return row;
}

export async function excluirWaInstanciaDb(nome: string): Promise<void> {
  await pool.query(`DELETE FROM wa_instancias WHERE nome = $1`, [nome]);
}
