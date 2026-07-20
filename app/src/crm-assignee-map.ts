/**
 * Mapeia responsável do CRM ↔ agent do Atendimento.
 * Usa chatwoot_user_id e e-mail em painel_usuarios.
 */
import {
  listarUsuarios,
  obterUsuarioPorChatwootId,
  obterUsuarioPorEmail,
  type UsuarioPublico,
} from './usuarios-store.js';

export type ResponsavelResolvido = {
  usuarioId: number;
  nome: string;
  email: string;
  chatwootUserId: number | null;
};

function normEmail(s: string): string {
  return String(s || '').trim().toLowerCase();
}

function normNome(s: string): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** Resolve usuário do painel a partir do id CRM / e-mail / nome. */
export async function resolverUsuarioPainel(opts: {
  usuarioId?: number | null;
  email?: string | null;
  nome?: string | null;
}): Promise<ResponsavelResolvido | null> {
  if (opts.usuarioId != null && Number(opts.usuarioId) > 0) {
    const lista = await listarUsuarios();
    const u = lista.find((x) => x.id === Number(opts.usuarioId));
    if (u) return deUsuario(u);
  }
  if (opts.email) {
    const u = await obterUsuarioPorEmail(opts.email);
    if (u) {
      return {
        usuarioId: u.id,
        nome: u.nome,
        email: u.email,
        chatwootUserId: u.chatwoot_user_id,
      };
    }
  }
  if (opts.nome) {
    const lista = await listarUsuarios();
    const q = normNome(opts.nome);
    const u =
      lista.find((x) => normNome(x.nome) === q) ||
      lista.find((x) => normEmail(x.email) === q);
    if (u) return deUsuario(u);
  }
  return null;
}

/** Resolve painel a partir do agent_id do Atendimento. */
export async function resolverPorAgentId(
  agentId: number,
): Promise<ResponsavelResolvido | null> {
  if (!agentId || agentId <= 0) return null;
  const u = await obterUsuarioPorChatwootId(agentId);
  if (!u) return null;
  return {
    usuarioId: u.id,
    nome: u.nome,
    email: u.email,
    chatwootUserId: u.chatwoot_user_id,
  };
}

function deUsuario(u: UsuarioPublico): ResponsavelResolvido {
  return {
    usuarioId: u.id,
    nome: u.nome,
    email: u.email,
    chatwootUserId: u.chatwoot_user_id,
  };
}
