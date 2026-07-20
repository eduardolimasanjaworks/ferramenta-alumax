/**
 * Operações de senha do painel (alterar / copiar cofre).
 * Mantém o store de usuários abaixo de 300 linhas.
 */
import pg from 'pg';
import { config } from './config.js';
import { cifrarSenhaCofre, decifrarSenhaCofre, gerarSenhaProvisoria } from './credenciais-cofre.js';
import { hashSenha, verificarSenha } from './usuarios-senha.js';

const pool = new pg.Pool({ connectionString: config.databaseUrl });

export async function alterarSenhaUsuario(
  id: number,
  senhaAtual: string,
  senhaNova: string,
): Promise<void> {
  const res = await pool.query('SELECT * FROM painel_usuarios WHERE id = $1', [id]);
  if (!res.rows[0]) throw new Error('Usuario nao encontrado');
  if (!verificarSenha(senhaAtual, String(res.rows[0].senha_hash))) {
    throw new Error('Senha atual incorreta');
  }
  if (senhaNova.length < 8) throw new Error('Nova senha deve ter pelo menos 8 caracteres');
  await pool.query(
    `UPDATE painel_usuarios SET senha_hash = $2, senha_cofre = $3, atualizado_em = NOW() WHERE id = $1`,
    [id, hashSenha(senhaNova), cifrarSenhaCofre(senhaNova)],
  );
}

/**
 * Lê e-mail + senha do cofre.
 * Sem regenerar por padrão — evita trocar hash do painel ao espelhar Atendimento.
 */
export async function obterCredenciaisParaCopia(
  id: number,
  opts?: { regenerarSeSemCofre?: boolean },
): Promise<{ email: string; senha: string; nome: string; gerada: boolean }> {
  const res = await pool.query('SELECT * FROM painel_usuarios WHERE id = $1', [id]);
  if (!res.rows[0]) throw new Error('Usuario nao encontrado');
  const row = res.rows[0] as Record<string, unknown>;
  const email = String(row.email);
  const nome = String(row.nome);
  const cofre = row.senha_cofre ? decifrarSenhaCofre(String(row.senha_cofre)) : null;
  if (cofre) return { email, senha: cofre, nome, gerada: false };

  const adminEmail = (config.adminEmail || '').trim().toLowerCase();
  if (email.trim().toLowerCase() === adminEmail && config.adminPassword) {
    await pool.query(
      `UPDATE painel_usuarios SET senha_hash = $2, senha_cofre = $3, atualizado_em = NOW() WHERE id = $1`,
      [id, hashSenha(config.adminPassword), cifrarSenhaCofre(config.adminPassword)],
    );
    return { email, senha: config.adminPassword, nome, gerada: false };
  }

  if (opts?.regenerarSeSemCofre !== true) {
    throw new Error('Senha ainda nao esta no cofre — defina uma nova senha no editar usuario');
  }
  const nova = gerarSenhaProvisoria();
  await pool.query(
    `UPDATE painel_usuarios SET senha_hash = $2, senha_cofre = $3, atualizado_em = NOW() WHERE id = $1`,
    [id, hashSenha(nova), cifrarSenhaCofre(nova)],
  );
  return { email, senha: nova, nome, gerada: true };
}
