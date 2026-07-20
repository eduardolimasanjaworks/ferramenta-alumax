/**
 * Departamentos = Teams do Chatwoot (account da config).
 * Lista teams e sincroniza membership do atendente (add/remove),
 * sem PATCH no time inteiro — evita apagar outros membros.
 */
import { config } from './config.js';
import { chatwootFetch } from './chatwoot-sync.js';

export type DepartamentoCw = {
  id: number;
  name: string;
  description?: string | null;
  allow_auto_assign?: boolean;
};

function accountPath(suffix: string): string {
  return `/api/v1/accounts/${config.chatwootAccountId}${suffix}`;
}

export async function listarDepartamentosChatwoot(): Promise<{
  ok: boolean;
  departamentos?: DepartamentoCw[];
  motivo?: string;
}> {
  try {
    const r = await chatwootFetch(accountPath('/teams'));
    const data = (await r.json().catch(() => null)) as DepartamentoCw[] | { payload?: DepartamentoCw[] } | null;
    if (!r.ok) {
      return { ok: false, motivo: `list_teams_http_${r.status}` };
    }
    const lista = Array.isArray(data) ? data : Array.isArray(data?.payload) ? data.payload : [];
    return {
      ok: true,
      departamentos: lista
        .map((t) => ({
          id: Number(t.id),
          name: String(t.name || ''),
          description: t.description ?? null,
          allow_auto_assign: t.allow_auto_assign,
        }))
        .filter((t) => t.id > 0)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    };
  } catch (err) {
    return { ok: false, motivo: err instanceof Error ? err.message : String(err) };
  }
}

export type MembroDepartamento = {
  id: number;
  name: string;
  email: string;
  availability?: string;
};

export async function listarMembrosDepartamento(teamId: number): Promise<MembroDepartamento[]> {
  const r = await chatwootFetch(accountPath(`/teams/${teamId}/team_members`));
  if (!r.ok) return [];
  const data = (await r.json().catch(() => [])) as
    | Array<{ id?: number; name?: string; email?: string; availability_status?: string }>
    | { payload?: Array<{ id?: number; name?: string; email?: string; availability_status?: string }> };
  const lista = Array.isArray(data) ? data : Array.isArray(data?.payload) ? data.payload : [];
  return lista
    .map((u) => ({
      id: Number(u.id),
      name: String(u.name || ''),
      email: String(u.email || '').toLowerCase(),
      availability: String(u.availability_status || ''),
    }))
    .filter((u) => u.id > 0);
}

async function idsMembrosDoTeam(teamId: number): Promise<number[]> {
  const membros = await listarMembrosDepartamento(teamId);
  return membros.map((u) => u.id);
}

/** Teams em que o chatwoot_user_id já é membro. */
export async function departamentosDoUsuarioChatwoot(chatwootUserId: number): Promise<{
  ok: boolean;
  team_ids?: number[];
  motivo?: string;
}> {
  const list = await listarDepartamentosChatwoot();
  if (!list.ok || !list.departamentos) {
    return { ok: false, motivo: list.motivo || 'falha_listar_teams' };
  }
  try {
    const checks = await Promise.all(
      list.departamentos.map(async (d) => {
        const ids = await idsMembrosDoTeam(d.id);
        return ids.includes(chatwootUserId) ? d.id : null;
      }),
    );
    return { ok: true, team_ids: checks.filter((id): id is number => id != null) };
  } catch (err) {
    return { ok: false, motivo: err instanceof Error ? err.message : String(err) };
  }
}

async function adicionarMembro(teamId: number, userId: number): Promise<void> {
  const r = await chatwootFetch(accountPath(`/teams/${teamId}/team_members`), {
    method: 'POST',
    body: JSON.stringify({ user_ids: [userId] }),
  });
  if (!r.ok && r.status !== 422) {
    const detail = await r.text().catch(() => '');
    throw new Error(`add_team_${teamId}_http_${r.status}: ${detail.slice(0, 160)}`);
  }
}

async function removerMembro(teamId: number, userId: number): Promise<void> {
  const r = await chatwootFetch(accountPath(`/teams/${teamId}/team_members`), {
    method: 'DELETE',
    body: JSON.stringify({ user_ids: [userId] }),
  });
  if (!r.ok && r.status !== 404) {
    const detail = await r.text().catch(() => '');
    throw new Error(`del_team_${teamId}_http_${r.status}: ${detail.slice(0, 160)}`);
  }
}

/** Alinha a lista de membros de um departamento (fila) aos user_ids. */
export async function sincronizarMembrosDoDepartamento(
  teamId: number,
  userIds: number[],
): Promise<{ ok: boolean; adicionados: number[]; removidos: number[]; motivo?: string }> {
  const desejados = [...new Set(userIds.map(Number).filter((id) => id > 0))];
  const atuais = new Set(await idsMembrosDoTeam(teamId));
  const alvo = new Set(desejados);
  const adicionados = desejados.filter((id) => !atuais.has(id));
  const removidos = [...atuais].filter((id) => !alvo.has(id));

  // Preferência: PATCH com a lista completa (Chatwoot faz replace)
  try {
    const r = await chatwootFetch(accountPath(`/teams/${teamId}/team_members`), {
      method: 'PATCH',
      body: JSON.stringify({ user_ids: desejados }),
    });
    if (r.ok || r.status === 204) {
      return { ok: true, adicionados, removidos };
    }
    // fallback POST/DELETE por membro
  } catch {
    /* cai no fallback */
  }

  try {
    for (const userId of adicionados) await adicionarMembro(teamId, userId);
    for (const userId of removidos) await removerMembro(teamId, userId);
    return { ok: true, adicionados, removidos };
  } catch (err) {
    return {
      ok: false,
      adicionados,
      removidos,
      motivo: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Alinha membership do atendente aos team_ids desejados.
 * Só POST/DELETE desse user — não reescreve a lista do departamento.
 */
export async function sincronizarDepartamentosUsuario(
  chatwootUserId: number,
  teamIdsDesejados: number[],
): Promise<{ ok: boolean; adicionados: number[]; removidos: number[]; motivo?: string }> {
  const desejados = [...new Set(teamIdsDesejados.map(Number).filter((id) => id > 0))];
  const atuaisRes = await departamentosDoUsuarioChatwoot(chatwootUserId);
  if (!atuaisRes.ok || !atuaisRes.team_ids) {
    return { ok: false, adicionados: [], removidos: [], motivo: atuaisRes.motivo };
  }
  const atuais = new Set(atuaisRes.team_ids);
  const alvo = new Set(desejados);
  const adicionados = desejados.filter((id) => !atuais.has(id));
  const removidos = [...atuais].filter((id) => !alvo.has(id));

  try {
    for (const teamId of adicionados) await adicionarMembro(teamId, chatwootUserId);
    for (const teamId of removidos) await removerMembro(teamId, chatwootUserId);
    return { ok: true, adicionados, removidos };
  } catch (err) {
    return {
      ok: false,
      adicionados,
      removidos,
      motivo: err instanceof Error ? err.message : String(err),
    };
  }
}
