/**
 * No boot, realinha o admin do env (e-mail + senha) com hash/cofre.
 * Evita 401 quando Platform/SSO mexeu senha do Atendimento e o painel ficou atrás.
 */
import pg from 'pg';
import { config } from './config.js';
import { cifrarSenhaCofre, decifrarSenhaCofre } from './credenciais-cofre.js';
import { hashSenha, verificarSenha } from './usuarios-senha.js';

const pool = new pg.Pool({ connectionString: config.databaseUrl });

export async function reconciliarAdminDoEnv(): Promise<void> {
  const email = (config.adminEmail || '').trim().toLowerCase();
  const senha = config.adminPassword || '';
  if (!email || !senha) return;

  const res = await pool.query(
    'SELECT id, senha_hash, senha_cofre, chatwoot_user_id FROM painel_usuarios WHERE lower(email) = $1 LIMIT 1',
    [email],
  );
  if (!res.rows[0]) return;

  const row = res.rows[0] as {
    id: number;
    senha_hash: string;
    senha_cofre: string | null;
    chatwoot_user_id: number | null;
  };
  const hashOk = verificarSenha(senha, String(row.senha_hash));
  const cofre = row.senha_cofre ? decifrarSenhaCofre(String(row.senha_cofre)) : null;
  const cofreOk = cofre === senha;

  if (hashOk && cofreOk) return;

  await pool.query(
    `UPDATE painel_usuarios SET senha_hash = $2, senha_cofre = $3, atualizado_em = NOW() WHERE id = $1`,
    [row.id, hashSenha(senha), cifrarSenhaCofre(senha)],
  );
  console.log(`[usuarios] Admin ${email} realinhado com senha do env (hash/cofre)`);

  if (row.chatwoot_user_id) {
    try {
      const { atualizarUsuarioChatwoot } = await import('./chatwoot-usuarios.js');
      const r = await atualizarUsuarioChatwoot(row.chatwoot_user_id, { senha });
      console.log(`[usuarios] Espelho Atendimento admin: ${r.ok ? 'ok' : r.motivo}`);
    } catch (err) {
      console.warn('[usuarios] Espelho Atendimento admin falhou (painel ja ok):', err);
    }
  }
}
