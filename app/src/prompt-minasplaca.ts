/**
 * Prompt Minas Placa — persistencia simples no Postgres.
 */
import pg from 'pg';
import { config } from './config.js';

const pool = new pg.Pool({ connectionString: config.databaseUrl });

const PROMPT_PADRAO = `Voce e a assistente virtual da Tilit.

A base de conhecimento ainda esta sendo treinada. Por enquanto:
- Seja cordial, clara e objetiva.
- Nao invente produtos, precos, prazos ou politicas.
- Se nao souber algo, diga que vai verificar com a equipe e retornar.
- Mensagens curtas, adequadas ao WhatsApp (ate ~1500 caracteres).
`;

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export async function inicializarBancoPrompt(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS configuracao (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL,
      atualizado_em TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  let promptInicial = PROMPT_PADRAO;
  try {
    const caminhosPossiveis = [
      resolve(process.cwd(), '../prompt-cliente.txt'),
      resolve(process.cwd(), './prompt-cliente.txt'),
      resolve(process.cwd(), './data/prompt-cliente.txt')
    ];
    for (const caminho of caminhosPossiveis) {
      if (existsSync(caminho)) {
        promptInicial = readFileSync(caminho, 'utf-8');
        console.log(`[prompt] Carregando prompt a partir de: ${caminho}`);
        break;
      }
    }
  } catch (err) {
    console.error('[prompt] Erro ao ler prompt-cliente.txt:', err);
  }

  const existe = await pool.query('SELECT valor FROM configuracao WHERE chave = $1', ['prompt_sistema']);
  if (existe.rowCount === 0) {
    await pool.query(
      'INSERT INTO configuracao (chave, valor) VALUES ($1, $2)',
      ['prompt_sistema', promptInicial],
    );
  }
}

export async function obterPromptBruto(): Promise<string> {
  const res = await pool.query('SELECT valor FROM configuracao WHERE chave = $1', ['prompt_sistema']);
  return (res.rows[0]?.valor as string) ?? PROMPT_PADRAO;
}

export async function salvarPrompt(prompt: string): Promise<void> {
  await pool.query(
    `INSERT INTO configuracao (chave, valor, atualizado_em)
     VALUES ($1, $2, NOW())
     ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = NOW()`,
    ['prompt_sistema', prompt],
  );
}
