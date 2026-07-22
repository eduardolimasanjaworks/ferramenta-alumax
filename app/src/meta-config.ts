import pg from 'pg';
import { config } from './config.js';

const pool = new pg.Pool({ connectionString: config.databaseUrl });

export type MetaConfig = {
  phoneId: string | null;
  accessToken: string | null;
  businessAccountId: string | null;
};

export async function obterMetaConfig(): Promise<MetaConfig> {
  const { rows } = await pool.query(
    `SELECT chave, valor FROM configuracao WHERE chave IN ('meta_phone_number_id', 'meta_access_token', 'meta_business_account_id')`
  );
  
  let phoneId: string | null = null;
  let accessToken: string | null = null;
  let businessAccountId: string | null = null;

  for (const row of rows) {
    if (row.chave === 'meta_phone_number_id') phoneId = row.valor;
    if (row.chave === 'meta_access_token') accessToken = row.valor;
    if (row.chave === 'meta_business_account_id') businessAccountId = row.valor;
  }

  return {
    phoneId: phoneId || config.metaPhoneNumberId || null,
    accessToken: accessToken || config.metaAccessToken || null,
    businessAccountId: businessAccountId || config.metaBusinessAccountId || null,
  };
}

export async function salvarMetaConfig(phoneId: string, accessToken: string, businessAccountId: string): Promise<void> {
  const query = `
    INSERT INTO configuracao (chave, valor, atualizado_em)
    VALUES ($1, $2, NOW())
    ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = NOW()
  `;
  
  await pool.query(query, ['meta_phone_number_id', phoneId]);
  await pool.query(query, ['meta_access_token', accessToken]);
  await pool.query(query, ['meta_business_account_id', businessAccountId]);
}
