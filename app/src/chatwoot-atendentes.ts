/**
 * Resolve e atribui atendente específico na conversa (por nome/e-mail).
 * Usado pela tool transferir_atendente da IA Tilit.
 */
import { config } from './config.js';
import { chatwootFetch } from './chatwoot-sync.js';
import {
  atribuirConversa,
  obterDisplayIdConversaAberta,
  resolverTeamId,
} from './chatwoot-assignments.js';
import { registrarAtribuicaoFila } from './fila-atendimento.js';

export type AtendenteCw = { id: number; name: string; email: string };

function norm(s: string): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export async function listarAtendentesConta(): Promise<AtendenteCw[]> {
  if (process.env.TRANSFER_STUB === '1') {
    return [
      { id: 42, name: 'Gabriela Silveira', email: 'gabriela.silveira@tilitgroup.com' },
      { id: 44, name: 'Giulia Gregorio', email: 'giulia.gregorio@tilitgroup.com' },
      { id: 41, name: 'Dulcinea Ribeiro', email: 'dulcinea.ribeiro@tilitgroup.com' },
      { id: 46, name: 'Nathalia Silveira', email: 'nathalia.silveira@tilitgroup.com' },
      { id: 40, name: 'Driele Silva', email: 'driele.silva@tilitgroup.com' },
      { id: 43, name: 'Gabriella Trinkel', email: 'gabriella.trinkel@tilitgroup.com' },
    ];
  }
  const r = await chatwootFetch(`/api/v1/accounts/${config.chatwootAccountId}/agents`);
  if (!r.ok) return [];
  const data = (await r.json().catch(() => [])) as AtendenteCw[] | { payload?: AtendenteCw[] };
  const lista = Array.isArray(data) ? data : Array.isArray(data.payload) ? data.payload : [];
  return lista
    .map((a) => ({
      id: Number(a.id),
      name: String(a.name || ''),
      email: String(a.email || ''),
    }))
    .filter((a) => a.id > 0);
}

export function acharAtendente(lista: AtendenteCw[], nomeOuEmail: string): AtendenteCw | null {
  const q = norm(nomeOuEmail);
  if (!q) return null;
  const porEmail = lista.find((a) => norm(a.email) === q || norm(a.email).startsWith(q));
  if (porEmail) return porEmail;
  const porNomeExato = lista.find((a) => norm(a.name) === q);
  if (porNomeExato) return porNomeExato;
  const partes = q.split(/\s+/).filter(Boolean);
  return (
    lista.find((a) => {
      const n = norm(a.name);
      return partes.every((p) => n.includes(p));
    }) ?? null
  );
}

export async function transferirAtendentePorTelefone(opts: {
  telefone: string;
  nomeOuEmail: string;
  departamento?: string;
  transferNote?: string;
}): Promise<{
  ok: boolean;
  displayId?: number;
  assigneeId?: number;
  assigneeNome?: string;
  teamId?: number;
  motivo?: string;
}> {
  const lista = await listarAtendentesConta();
  const hit = acharAtendente(lista, opts.nomeOuEmail);
  if (!hit) {
    return { ok: false, motivo: `atendente_nao_encontrado: ${opts.nomeOuEmail}` };
  }
  if (process.env.TRANSFER_STUB === '1') {
    return {
      ok: true,
      displayId: 999001,
      assigneeId: hit.id,
      assigneeNome: hit.name,
      teamId: opts.departamento ? resolverTeamId(opts.departamento) ?? undefined : undefined,
      motivo: 'stub',
    };
  }
  const conv = await obterDisplayIdConversaAberta(opts.telefone);
  if (!conv.ok || !conv.displayId) {
    return { ok: false, motivo: conv.motivo || 'sem_conversa' };
  }
  const teamId = opts.departamento ? resolverTeamId(opts.departamento) : null;
  if (teamId) {
    await atribuirConversa({
      displayId: conv.displayId,
      teamId,
      departmentTransfer: true,
      transferMode: 'handoff_new_conversation',
      transferNote: opts.transferNote,
    });
  }
  const res = await atribuirConversa({ displayId: conv.displayId, assigneeId: hit.id });
  if (res.ok) await registrarAtribuicaoFila(hit.id);
  return {
    ok: res.ok,
    displayId: conv.displayId,
    assigneeId: hit.id,
    assigneeNome: hit.name,
    teamId: teamId ?? undefined,
    motivo: res.motivo,
  };
}
