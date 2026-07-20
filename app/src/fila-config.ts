/**
 * CRUD de filas (= departamentos) e membros para o painel.
 * Cria/lista teams e sincroniza quem entra na fila de cada departamento.
 */
import { config } from './config.js';
import { chatwootFetch } from './chatwoot-sync.js';
import { listarAgentsAccountApi } from './chatwoot-agents.js';
import {
  listarDepartamentosChatwoot,
  listarMembrosDepartamento,
  sincronizarMembrosDoDepartamento,
  type DepartamentoCw,
} from './chatwoot-departamentos.js';
import { escolherProximoDaFila } from './fila-atendimento.js';
import {
  inicializarFilaContatos,
  obterTelefonesAtendentes,
  removerTelefoneAtendente,
  salvarTelefoneAtendente,
} from './fila-contatos.js';
import {
  apagarRegraFila,
  inicializarFilaRegras,
  listarRegrasFilas,
  obterRegraFila,
  salvarRegraFila,
} from './fila-regras.js';

function teamsPath(suffix = ''): string {
  return `/api/v1/accounts/${config.chatwootAccountId}/teams${suffix}`;
}

export async function inicializarFilaConfig(): Promise<void> {
  await inicializarFilaContatos();
  await inicializarFilaRegras();
}

export async function listarFilasComMembros(): Promise<{
  ok: boolean;
  filas: Array<{
    id: number;
    name: string;
    description?: string | null;
    quando_transferir: string;
    membros: Array<{
      id: number;
      name: string;
      email: string;
      availability?: string;
      telefone: string;
    }>;
    proximo?: { id: number; name: string; email: string } | null;
  }>;
  agents: Array<{ id: number; name?: string; email: string }>;
  motivo?: string;
}> {
  await inicializarFilaContatos();
  const teams = await listarDepartamentosChatwoot();
  if (!teams.ok || !teams.departamentos) {
    return { ok: false, filas: [], agents: [], motivo: teams.motivo };
  }
  const agentsRes = await listarAgentsAccountApi();
  const regras = await listarRegrasFilas();
  const filas = [];
  for (const t of teams.departamentos) {
    const membros = await listarMembrosDepartamento(t.id);
    const tels = await obterTelefonesAtendentes(membros.map((m) => m.id));
    const prox = await escolherProximoDaFila(t.id);
    filas.push({
      id: t.id,
      name: t.name,
      description: t.description,
      quando_transferir: regras.get(t.id) || '',
      membros: membros.map((m) => ({
        ...m,
        telefone: tels.get(m.id) || '',
      })),
      proximo: prox
        ? { id: prox.id, name: prox.name, email: prox.email }
        : null,
    });
  }
  return {
    ok: true,
    filas,
    agents: agentsRes.ok ? agentsRes.agents : [],
  };
}

export async function criarFila(nome: string): Promise<{
  ok: boolean;
  fila?: DepartamentoCw;
  motivo?: string;
}> {
  const name = nome.trim();
  if (!name) return { ok: false, motivo: 'Nome obrigatorio' };
  try {
    const r = await chatwootFetch(teamsPath(), {
      method: 'POST',
      body: JSON.stringify({
        name,
        description: '',
        allow_auto_assign: true,
      }),
    });
    const body = (await r.json().catch(() => ({}))) as DepartamentoCw & {
      error?: string;
    };
    if (!r.ok || !body.id) {
      return { ok: false, motivo: `criar_fila_http_${r.status}` };
    }
    return {
      ok: true,
      fila: {
        id: Number(body.id),
        name: String(body.name || name),
        description: body.description ?? null,
        allow_auto_assign: body.allow_auto_assign,
      },
    };
  } catch (err) {
    return { ok: false, motivo: err instanceof Error ? err.message : String(err) };
  }
}

export async function atualizarMembrosFila(
  teamId: number,
  membros: Array<{ id: number; telefone?: string }>,
): Promise<{ ok: boolean; motivo?: string }> {
  const ids = membros.map((m) => Number(m.id)).filter((id) => id > 0);
  const sync = await sincronizarMembrosDoDepartamento(teamId, ids);
  if (!sync.ok) return { ok: false, motivo: sync.motivo };
  for (const m of membros) {
    if (!m.id) continue;
    if (m.telefone !== undefined) {
      const tel = String(m.telefone || '').trim();
      if (tel) await salvarTelefoneAtendente(m.id, tel);
      else await removerTelefoneAtendente(m.id);
    }
  }
  return { ok: true };
}

/** Apaga a fila (team) no Atendimento e a regra local. */
export async function excluirFila(teamId: number): Promise<{ ok: boolean; motivo?: string }> {
  if (!teamId) return { ok: false, motivo: 'id invalido' };
  try {
    const r = await chatwootFetch(teamsPath(`/${teamId}`), { method: 'DELETE' });
    if (!r.ok && r.status !== 404) {
      const detail = await r.text().catch(() => '');
      return { ok: false, motivo: `excluir_fila_http_${r.status}: ${detail.slice(0, 160)}` };
    }
    await apagarRegraFila(teamId).catch(() => undefined);
    return { ok: true };
  } catch (err) {
    return { ok: false, motivo: err instanceof Error ? err.message : String(err) };
  }
}

export async function atualizarRegraFila(
  teamId: number,
  quandoTransferir: string,
): Promise<{ ok: boolean; motivo?: string }> {
  if (!teamId) return { ok: false, motivo: 'id invalido' };
  try {
    await salvarRegraFila(teamId, quandoTransferir);
    return { ok: true };
  } catch (err) {
    return { ok: false, motivo: err instanceof Error ? err.message : String(err) };
  }
}

export { obterRegraFila, listarRegrasFilas };
