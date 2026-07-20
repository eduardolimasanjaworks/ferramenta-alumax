/**
 * Importa agents do Atendimento para o painel (1 agent = 1 usuário).
 * Espelha exclusão: agent sumiu → apaga conta do iatilit (exceto último admin).
 */
import { gerarSenhaProvisoria } from './credenciais-cofre.js';
import { listarAgentsAccountApi } from './chatwoot-agents.js';
import {
  listarDepartamentosChatwoot,
  listarMembrosDepartamento,
} from './chatwoot-departamentos.js';
import {
  atualizarUsuario,
  criarUsuario,
  excluirUsuarioSistema,
  listarUsuarios,
  obterUsuarioPorEmail,
  type UsuarioPublico,
} from './usuarios-store.js';

function senhaImportacao(): string {
  const s = gerarSenhaProvisoria();
  if (/[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s) && /[^A-Za-z0-9]/.test(s)) return s;
  return `${s}Aa1!`;
}

/** Mapa chatwoot_user_id → departamentos em que o agent é membro. */
export async function mapaDepartamentosPorAgent(): Promise<
  Map<number, Array<{ id: number; name: string }>>
> {
  const map = new Map<number, Array<{ id: number; name: string }>>();
  const teams = await listarDepartamentosChatwoot();
  if (!teams.ok || !teams.departamentos) return map;
  for (const t of teams.departamentos) {
    const membros = await listarMembrosDepartamento(t.id);
    for (const m of membros) {
      const cur = map.get(m.id) || [];
      cur.push({ id: t.id, name: t.name });
      map.set(m.id, cur);
    }
  }
  return map;
}

export type UsuarioComDeptos = UsuarioPublico & {
  departamentos: Array<{ id: number; name: string }>;
};

/**
 * Garante usuário no painel para cada agent da account.
 * Remove do painel quem tinha vínculo e o agent sumiu no Atendimento.
 */
export async function sincronizarAgentsNoPainel(): Promise<{
  ok: boolean;
  criados: number;
  vinculados: number;
  removidos: number;
  totalAgents: number;
  motivo?: string;
}> {
  const agents = await listarAgentsAccountApi();
  if (!agents.ok) {
    return {
      ok: false,
      criados: 0,
      vinculados: 0,
      removidos: 0,
      totalAgents: 0,
      motivo: agents.motivo || 'falha_listar_agents',
    };
  }

  let criados = 0;
  let vinculados = 0;
  let removidos = 0;
  const abasPadrao = ['assistente', 'conversas'];
  const idsAgents = new Set(agents.agents.map((a) => a.id));

  for (const a of agents.agents) {
    const email = a.email.trim().toLowerCase();
    if (!email) continue;
    const existente = await obterUsuarioPorEmail(email);
    if (!existente) {
      await criarUsuario({
        email,
        nome: a.name || email.split('@')[0] || 'Atendente',
        senha: senhaImportacao(),
        role: a.role === 'administrator' ? 'admin' : 'agente',
        abas: a.role === 'administrator' ? undefined : abasPadrao,
        chatwoot_user_id: a.id,
      });
      criados++;
      continue;
    }
    const patch: { nome?: string; chatwoot_user_id?: number } = {};
    if (!existente.chatwoot_user_id || existente.chatwoot_user_id !== a.id) {
      patch.chatwoot_user_id = a.id;
      vinculados++;
    }
    if (a.name && a.name !== existente.nome) patch.nome = a.name;
    if (Object.keys(patch).length) await atualizarUsuario(existente.id, patch);
  }

  // agent apagado no Atendimento → apaga conta iatilit vinculada
  const lista = await listarUsuarios();
  for (const u of lista) {
    if (!u.chatwoot_user_id) continue;
    if (idsAgents.has(u.chatwoot_user_id)) continue;
    try {
      await excluirUsuarioSistema(u.id);
      removidos++;
      console.log(`[sync-agents] removeu usuario painel id=${u.id} email=${u.email} (agent ${u.chatwoot_user_id} sumiu)`);
    } catch (err) {
      console.warn(`[sync-agents] nao removeu ${u.email}:`, err instanceof Error ? err.message : err);
    }
  }

  return { ok: true, criados, vinculados, removidos, totalAgents: agents.agents.length };
}

/** Sync + lista com departamentos para a tabela USUÁRIOS. */
export async function listarUsuariosComDepartamentos(): Promise<{
  ok: boolean;
  usuarios: UsuarioComDeptos[];
  sync?: { criados: number; vinculados: number; removidos: number; totalAgents: number };
  motivo?: string;
}> {
  const sync = await sincronizarAgentsNoPainel();
  const deptMap = sync.ok ? await mapaDepartamentosPorAgent() : new Map();
  const lista = await listarUsuarios();
  const usuarios: UsuarioComDeptos[] = lista.map((u) => ({
    ...u,
    departamentos: u.chatwoot_user_id ? deptMap.get(u.chatwoot_user_id) || [] : [],
  }));
  return {
    ok: true,
    usuarios,
    sync: sync.ok
      ? {
          criados: sync.criados,
          vinculados: sync.vinculados,
          removidos: sync.removidos,
          totalAgents: sync.totalAgents,
        }
      : undefined,
    motivo: sync.ok ? undefined : sync.motivo,
  };
}
