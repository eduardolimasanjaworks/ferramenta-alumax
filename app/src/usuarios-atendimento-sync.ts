/**
 * Garante espelho painel ↔ Atendimento (account Tilit).
 * Criar no painel sempre cria/víncula agent; apagar remove o agent.
 */
import {
  criarUsuarioChatwoot,
  excluirUsuarioChatwoot,
  senhaAtendePoliticaChatwoot,
} from './chatwoot-usuarios.js';
import {
  atualizarAgentAccountApi,
  buscarAgentPorEmail,
  criarAgentAccountApi,
  removerAgentAccountApi,
} from './chatwoot-agents.js';
import { mensagemPublicaAtendimento } from './mensagens-publicas.js';
import { atualizarUsuario, type RolePainel, type UsuarioPublico } from './usuarios-store.js';

export { senhaAtendePoliticaChatwoot };

function roleConta(role?: RolePainel): 'agent' | 'administrator' {
  return role === 'admin' ? 'administrator' : 'agent';
}

function pub(motivo?: string): string {
  return mensagemPublicaAtendimento(motivo || '');
}

/** Cria/vincula agent no Atendimento. Sem sucesso → painel não deve gravar. */
export async function provisionarAtendimento(dados: {
  nome: string;
  email: string;
  senha: string;
  role?: RolePainel;
}): Promise<{ ok: boolean; userId?: number; motivo?: string }> {
  if (!senhaAtendePoliticaChatwoot(dados.senha)) {
    return { ok: false, motivo: pub('senha_fraca') };
  }

  const cw = await criarUsuarioChatwoot({
    nome: dados.nome,
    email: dados.email,
    senha: dados.senha,
    roleConta: roleConta(dados.role),
  });
  if (cw.ok && cw.userId) {
    await atualizarAgentAccountApi(cw.userId, { role: roleConta(dados.role) }).catch(() => undefined);
    return { ok: true, userId: cw.userId, motivo: pub(cw.motivo || 'ok') };
  }

  if (cw.userId && !cw.ok) {
    await excluirUsuarioChatwoot(cw.userId).catch(() => undefined);
  }

  const agent = await criarAgentAccountApi({
    nome: dados.nome,
    email: dados.email,
    role: roleConta(dados.role),
  });
  if (agent.ok && agent.userId) {
    await atualizarAgentAccountApi(agent.userId, { role: roleConta(dados.role) }).catch(() => undefined);
    return { ok: true, userId: agent.userId, motivo: pub(agent.motivo || 'ok') };
  }

  return {
    ok: false,
    motivo: pub(
      `Falha ao criar no Atendimento. platform:${cw.motivo || '?'}; agents:${agent.motivo || '?'}`,
    ),
  };
}

export async function desprovisionarAtendimento(
  chatwootUserId: number,
): Promise<{ ok: boolean; motivo?: string }> {
  const agent = await removerAgentAccountApi(chatwootUserId);
  const plat = await excluirUsuarioChatwoot(chatwootUserId);
  const bruto = `agents:removed=${agent.removed}/nf=${agent.notFound}/${agent.motivo || 'ok'}; platform:${plat.motivo || (plat.ok ? 'ok' : 'fail')}`;

  if (agent.removed || plat.ok) return { ok: true, motivo: pub(bruto) };
  return { ok: false, motivo: pub(`Não removeu no Atendimento. ${bruto}`) };
}

export async function desprovisionarAtendimentoDoUsuario(dados: {
  chatwootUserId: number | null;
  email: string;
}): Promise<{ ok: boolean; motivo?: string; userId?: number | null }> {
  let id = dados.chatwootUserId;
  if (!id) {
    const agent = await buscarAgentPorEmail(dados.email);
    if (!agent) {
      return {
        ok: true,
        motivo: 'Sem vínculo no Atendimento (nada a remover).',
        userId: null,
      };
    }
    id = agent.id;
  }
  const res = await desprovisionarAtendimento(id);
  return { ...res, userId: id };
}

/** Se falta vínculo, procura agent pelo e-mail e grava chatwoot_user_id. */
export async function vincularAtendimentoSeFaltar(
  u: UsuarioPublico,
): Promise<UsuarioPublico> {
  if (u.chatwoot_user_id) return u;
  const agent = await buscarAgentPorEmail(u.email);
  if (!agent) return u;
  return atualizarUsuario(u.id, { chatwoot_user_id: agent.id });
}

/** Retorna id do Atendimento, gravando vínculo se achar por e-mail. */
export async function resolverAtendimentoUserId(dados: {
  id: number;
  email: string;
  chatwootUserId: number | null;
}): Promise<number | null> {
  if (dados.chatwootUserId) return dados.chatwootUserId;
  const agent = await buscarAgentPorEmail(dados.email);
  if (!agent) return null;
  await atualizarUsuario(dados.id, { chatwoot_user_id: agent.id });
  return agent.id;
}

/** Ativo=false → offline no Atendimento; ativo=true → online. */
export async function sincronizarAtivoAtendimento(dados: {
  chatwootUserId: number | null;
  email: string;
  ativo: boolean;
}): Promise<{ ok: boolean; motivo?: string; userId?: number | null }> {
  let id = dados.chatwootUserId;
  if (!id) {
    const agent = await buscarAgentPorEmail(dados.email);
    id = agent?.id ?? null;
  }
  if (!id) {
    return { ok: true, motivo: 'Sem agent para sincronizar status.', userId: null };
  }
  const r = await atualizarAgentAccountApi(id, {
    availability: dados.ativo ? 'online' : 'offline',
  });
  return { ok: r.ok, motivo: pub(r.motivo || 'ok'), userId: id };
}

/**
 * Espelha perfil do painel no Atendimento:
 * admin → administrator · agente → agent.
 */
export async function sincronizarRoleAtendimento(dados: {
  chatwootUserId: number | null;
  email: string;
  role: RolePainel;
}): Promise<{ ok: boolean; motivo?: string; userId?: number | null }> {
  let id = dados.chatwootUserId;
  if (!id) {
    const agent = await buscarAgentPorEmail(dados.email);
    id = agent?.id ?? null;
  }
  if (!id) {
    return { ok: false, motivo: 'Sem vínculo no Atendimento para alterar o perfil.', userId: null };
  }
  const r = await atualizarAgentAccountApi(id, { role: roleConta(dados.role) });
  return { ok: r.ok, motivo: pub(r.motivo || 'ok'), userId: id };
}
