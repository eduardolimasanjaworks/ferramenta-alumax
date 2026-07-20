/**
 * Account API de agents (Atendimento) — criar/listar/remover na account Tilit.
 * Fallback e lookup por e-mail quando a Platform falha ou o vínculo falta.
 */
import { config } from './config.js';
import { chatwootFetch } from './chatwoot-sync.js';

export type AgentLite = {
  id: number;
  email: string;
  name?: string;
  role?: string;
};

function parseAgents(body: unknown): AgentLite[] {
  const raw = Array.isArray(body)
    ? body
    : (body as { payload?: unknown; data?: unknown })?.payload ||
      (body as { data?: unknown })?.data ||
      [];
  if (!Array.isArray(raw)) return [];
  const out: AgentLite[] = [];
  for (const a of raw) {
    const x = a as Record<string, unknown>;
    const id = Number(x.id);
    const email = String(x.email || '').toLowerCase();
    if (!id || !email) continue;
    out.push({
      id,
      email,
      name: x.name ? String(x.name) : undefined,
      role: x.role ? String(x.role) : undefined,
    });
  }
  return out;
}

export async function listarAgentsAccountApi(): Promise<{
  ok: boolean;
  agents: AgentLite[];
  motivo?: string;
}> {
  try {
    const r = await chatwootFetch(`/api/v1/accounts/${config.chatwootAccountId}/agents`);
    const body = await r.json().catch(() => []);
    if (!r.ok) {
      return {
        ok: false,
        agents: [],
        motivo: `agents_list_http_${r.status}`,
      };
    }
    return { ok: true, agents: parseAgents(body) };
  } catch (err) {
    return {
      ok: false,
      agents: [],
      motivo: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function buscarAgentPorEmail(
  email: string,
): Promise<AgentLite | null> {
  const alvo = email.trim().toLowerCase();
  if (!alvo) return null;
  const lista = await listarAgentsAccountApi();
  if (!lista.ok) return null;
  return lista.agents.find((a) => a.email === alvo) || null;
}

export async function criarAgentAccountApi(dados: {
  nome: string;
  email: string;
  role?: 'agent' | 'administrator';
}): Promise<{ ok: boolean; userId?: number; motivo?: string }> {
  try {
    const r = await chatwootFetch(`/api/v1/accounts/${config.chatwootAccountId}/agents`, {
      method: 'POST',
      body: JSON.stringify({
        agent: {
          name: dados.nome,
          email: dados.email.trim().toLowerCase(),
          role: dados.role ?? 'agent',
          availability: 'online',
          auto_offline: true,
        },
      }),
    });
    const body = (await r.json().catch(() => ({}))) as {
      id?: number;
      error?: string;
      message?: string;
    };
    if (!r.ok || !body.id) {
      // e-mail já existe → reusa o agent da account
      const existente = await buscarAgentPorEmail(dados.email);
      if (existente) {
        return {
          ok: true,
          userId: existente.id,
          motivo: `reusou_agent_${existente.id}`,
        };
      }
      return {
        ok: false,
        motivo: `agents_http_${r.status}: ${JSON.stringify(body).slice(0, 220)}`,
      };
    }
    return { ok: true, userId: body.id };
  } catch (err) {
    return { ok: false, motivo: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Atualiza agent na account (disponibilidade, nome, role).
 * Chatwoot espera o body no formato `{ agent: { ... } }`.
 */
export async function atualizarAgentAccountApi(
  agentId: number,
  dados: { availability?: 'online' | 'offline' | 'busy'; name?: string; role?: string },
): Promise<{ ok: boolean; motivo?: string }> {
  try {
    const agent: Record<string, string> = {};
    if (dados.availability) agent.availability = dados.availability;
    if (dados.name) agent.name = dados.name;
    if (dados.role) agent.role = dados.role;
    if (!Object.keys(agent).length) return { ok: true };
    const r = await chatwootFetch(
      `/api/v1/accounts/${config.chatwootAccountId}/agents/${agentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ agent }),
      },
    );
    if (r.ok) return { ok: true };
    const detail = await r.text().catch(() => '');
    return {
      ok: false,
      motivo: `agents_update_http_${r.status}: ${detail.slice(0, 160)}`,
    };
  } catch (err) {
    return { ok: false, motivo: err instanceof Error ? err.message : String(err) };
  }
}

/** Remove agent. Distingue 200 (removeu) de 404 (já sumiu). */
export async function removerAgentAccountApi(
  agentOrUserId: number,
): Promise<{ ok: boolean; removed: boolean; notFound: boolean; motivo?: string }> {
  try {
    const r = await chatwootFetch(
      `/api/v1/accounts/${config.chatwootAccountId}/agents/${agentOrUserId}`,
      { method: 'DELETE' },
    );
    if (r.status === 404) {
      return { ok: true, removed: false, notFound: true };
    }
    if (r.ok) return { ok: true, removed: true, notFound: false };
    const detail = await r.text().catch(() => '');
    return {
      ok: false,
      removed: false,
      notFound: false,
      motivo: `agents_delete_http_${r.status}: ${detail.slice(0, 200)}`,
    };
  } catch (err) {
    return {
      ok: false,
      removed: false,
      notFound: false,
      motivo: err instanceof Error ? err.message : String(err),
    };
  }
}

