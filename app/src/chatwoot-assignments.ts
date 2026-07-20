/**
 * Assignments Tilit: departamento (+ fila opcional) na conversa do telefone.
 */
import { config } from './config.js';
import { chatwootFetch } from './chatwoot-sync.js';
import { normalizarTelefone } from './util/telefone.js';
import {
  escolherProximoDaFila,
  filaAtendimentoHabilitada,
  registrarAtribuicaoFila,
} from './fila-atendimento.js';

export type TransferMode = 'handoff_new_conversation' | 'keep_thread';

export const TEAMS_TILIT: Record<string, number> = {
  atendimento: 7,
  financeiro: 8,
  comercial: 9,
  correspondencia: 10,
  correspondência: 10,
  recepcao: 10,
  recepção: 10,
  impressao: 11,
  impressão: 11,
  certificado: 11,
  'certificado digital': 11,
  reservas: 12,
  fornecedores: 13,
  'dr paulo ladeira': 14,
  'dr-paulo-ladeira': 14,
  marketing: 15,
  'recursos humanos': 16,
  rh: 16,
  'tela de atendimento': 17,
};

export const NOMES_DEPARTAMENTOS = [
  'atendimento',
  'financeiro',
  'comercial',
  'correspondencia',
  'recepcao',
  'impressao',
  'certificado digital',
  'reservas',
  'fornecedores',
  'dr paulo ladeira',
  'marketing',
  'recursos humanos',
  'tela de atendimento',
] as const;

function norm(s: string): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function resolverTeamId(departamento: string): number | null {
  const key = norm(departamento);
  for (const [nome, id] of Object.entries(TEAMS_TILIT)) {
    if (norm(nome) === key) return id;
  }
  const num = Number(departamento);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function accountPath(suffix: string): string {
  return `/api/v1/accounts/${config.chatwootAccountId}${suffix}`;
}

async function buscarContatoId(telefone: string): Promise<number | null> {
  const n = normalizarTelefone(telefone);
  const qs = [...new Set([n, n.slice(-11), n.slice(-10), `+${n}`])];
  for (const q of qs) {
    if (!q) continue;
    const r = await chatwootFetch(accountPath(`/contacts/search?q=${encodeURIComponent(q)}`));
    if (!r.ok) continue;
    const data = (await r.json()) as { payload?: Array<{ id?: number; phone_number?: string }> };
    const lista = data.payload ?? [];
    const hit =
      lista.find((c) => {
        if (!c.phone_number) return lista.length === 1;
        const p = normalizarTelefone(c.phone_number);
        return p === n || p.endsWith(n.slice(-11));
      }) ?? lista[0];
    if (hit?.id) return hit.id;
  }
  return null;
}

export async function obterDisplayIdConversaAberta(
  telefone: string,
  opts?: { contactId?: number | string | null },
): Promise<{
  ok: boolean;
  displayId?: number;
  motivo?: string;
}> {
  try {
    const cidOpt = opts?.contactId != null ? Number(opts.contactId) : NaN;
    let contactId =
      Number.isFinite(cidOpt) && cidOpt > 0 ? cidOpt : null;
    if (!contactId) contactId = await buscarContatoId(telefone);
    if (!contactId) return { ok: false, motivo: 'contato_nao_encontrado' };
    const r = await chatwootFetch(accountPath(`/contacts/${contactId}/conversations`));
    if (!r.ok) return { ok: false, motivo: `conversations_http_${r.status}` };
    const data = (await r.json()) as {
      payload?: Array<{ id?: number; display_id?: number; status?: string }>;
    };
    const lista = data.payload ?? [];
    const aberta =
      lista.find((c) => ['open', 'pending', 'snoozed'].includes(String(c.status || ''))) ??
      lista[0];
    const displayId = Number(aberta?.display_id ?? aberta?.id);
    if (!displayId) return { ok: false, motivo: 'conversa_nao_encontrada' };
    return { ok: true, displayId };
  } catch (err) {
    return { ok: false, motivo: err instanceof Error ? err.message : String(err) };
  }
}

export async function atribuirConversa(opts: {
  displayId: number;
  teamId?: number;
  /** null = desatribuir agent na conversa. */
  assigneeId?: number | null;
  departmentTransfer?: boolean;
  transferMode?: TransferMode;
  transferNote?: string;
}): Promise<{ ok: boolean; motivo?: string; body?: unknown }> {
  const body: Record<string, unknown> = {};
  if (opts.teamId != null) body.team_id = opts.teamId;
  if ('assigneeId' in opts) body.assignee_id = opts.assigneeId ?? null;
  if (opts.departmentTransfer) {
    body.department_transfer = true;
    body.transfer_mode = opts.transferMode ?? 'handoff_new_conversation';
    if (opts.transferNote) body.transfer_note = opts.transferNote;
  }
  if (!Object.keys(body).length) return { ok: false, motivo: 'payload_vazio' };
  try {
    const r = await chatwootFetch(accountPath(`/conversations/${opts.displayId}/assignments`), {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const raw = await r.json().catch(() => ({}));
    if (!r.ok) {
      return {
        ok: false,
        motivo: `assign_http_${r.status}: ${JSON.stringify(raw).slice(0, 200)}`,
        body: raw,
      };
    }
    return { ok: true, body: raw };
  } catch (err) {
    return { ok: false, motivo: err instanceof Error ? err.message : String(err) };
  }
}

async function talvezAtribuirFila(
  displayId: number,
  teamId: number,
): Promise<{ assigneeId?: number; nome?: string }> {
  if (!(await filaAtendimentoHabilitada())) return {};
  const prox = await escolherProximoDaFila(teamId);
  if (!prox) return {};
  const r = await atribuirConversa({ displayId, assigneeId: prox.id });
  if (!r.ok) return {};
  await registrarAtribuicaoFila(prox.id);
  return { assigneeId: prox.id, nome: prox.name };
}

export async function transferirDepartamentoPorTelefone(opts: {
  telefone: string;
  departamento: string;
  transferMode?: TransferMode;
  transferNote?: string;
}): Promise<{
  ok: boolean;
  displayId?: number;
  teamId?: number;
  assigneeId?: number;
  assigneeNome?: string;
  motivo?: string;
}> {
  if (process.env.TRANSFER_STUB === '1') {
    const teamId = resolverTeamId(opts.departamento);
    const filaOn =
      process.env.TRANSFER_STUB_FILA === '1' ||
      (await filaAtendimentoHabilitada().catch(() => false));
    return {
      ok: !!teamId,
      displayId: 999001,
      teamId: teamId ?? undefined,
      assigneeId: filaOn ? 42 : undefined,
      assigneeNome: filaOn ? 'Gabriela Silveira' : undefined,
      motivo: teamId ? 'stub' : 'departamento_invalido_stub',
    };
  }
  const teamId = resolverTeamId(opts.departamento);
  if (!teamId) {
    return {
      ok: false,
      motivo: `departamento_invalido: use um de [${NOMES_DEPARTAMENTOS.join(', ')}]`,
    };
  }
  const conv = await obterDisplayIdConversaAberta(opts.telefone);
  if (!conv.ok || !conv.displayId) {
    return { ok: false, motivo: conv.motivo || 'sem_conversa', teamId };
  }
  const res = await atribuirConversa({
    displayId: conv.displayId,
    teamId,
    departmentTransfer: true,
    transferMode: opts.transferMode ?? 'handoff_new_conversation',
    transferNote: opts.transferNote,
  });
  if (!res.ok) {
    return { ok: false, displayId: conv.displayId, teamId, motivo: res.motivo };
  }
  const fila = await talvezAtribuirFila(conv.displayId, teamId);
  return {
    ok: true,
    displayId: conv.displayId,
    teamId,
    assigneeId: fila.assigneeId,
    assigneeNome: fila.nome,
  };
}
