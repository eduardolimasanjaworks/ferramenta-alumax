/**
 * Sync pós-edição de usuário: dados, perfil admin e status no Atendimento.
 * Mantém usuarios-rotas enxuto (≤300 linhas).
 */
import { atualizarUsuarioChatwoot } from './chatwoot-usuarios.js';
import {
  sincronizarAtivoAtendimento,
  sincronizarRoleAtendimento,
} from './usuarios-atendimento-sync.js';
import type { RolePainel, UsuarioPublico } from './usuarios-store.js';
import { erroPub } from './usuarios-rotas-helpers.js';

export async function sincronizarEspelhoAtendimentoAposPatch(opts: {
  antes: UsuarioPublico;
  usuario: UsuarioPublico;
  cwId: number | null;
  body: {
    nome?: string;
    role?: RolePainel;
    senha?: string;
    ativo?: boolean;
    sync_chatwoot?: boolean;
  };
}): Promise<{ ok: boolean; motivo?: string } | null> {
  const { antes, usuario, cwId, body } = opts;
  const motivs: string[] = [];
  let ok = true;

  if (body.sync_chatwoot !== false && (body.nome || body.senha) && cwId) {
    const r = await atualizarUsuarioChatwoot(cwId, { nome: body.nome, senha: body.senha });
    ok = ok && r.ok;
    motivs.push(erroPub(r.motivo || (r.ok ? 'dados_ok' : 'falha_dados')));
  }

  if (body.sync_chatwoot !== false && body.role && body.role !== antes.role) {
    const roleSync = await sincronizarRoleAtendimento({
      chatwootUserId: cwId || usuario.chatwoot_user_id,
      email: usuario.email,
      role: body.role,
    });
    ok = ok && roleSync.ok;
    motivs.push(
      erroPub(
        roleSync.ok
          ? `perfil_${body.role === 'admin' ? 'administrator' : 'agent'}`
          : roleSync.motivo || 'falha_perfil',
      ),
    );
  }

  if (typeof body.ativo === 'boolean' && body.ativo !== antes.ativo) {
    const st = await sincronizarAtivoAtendimento({
      chatwootUserId: cwId,
      email: usuario.email,
      ativo: body.ativo,
    });
    ok = ok && st.ok;
    motivs.push(erroPub(st.motivo || (st.ok ? 'status_ok' : 'falha_status')));
  }

  if (!motivs.length) return null;
  return { ok, motivo: motivs.join(' · ') };
}
