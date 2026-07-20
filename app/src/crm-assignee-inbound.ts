/**
 * Atendimento → CRM: lê assignee do webhook/payload e
 * atualiza responsável do card (por chatwoot_user_id / e-mail).
 */
import { resolverPorAgentId, resolverUsuarioPainel } from './crm-assignee-map.js';
import { foiAssigneeOutboundRecente } from './crm-assignee-write.js';
import {
  definirResponsavelContato,
  obterContatoPorChatwootId,
  obterContatoPorTelefone,
  type CrmContato,
} from './crm-store.js';
import { extrairTelefoneDoPayloadChatwoot } from './chatwoot-sync.js';

export type AssigneeInfo = {
  id: number;
  name?: string;
  email?: string;
};

function pegarObj(
  payload: Record<string, unknown>,
  ...keys: string[]
): Record<string, unknown> | undefined {
  let cur: unknown = payload;
  for (const k of keys) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur && typeof cur === 'object'
    ? (cur as Record<string, unknown>)
    : undefined;
}

/**
 * Extrai assignee do payload.
 * `null` = desatribuído; `undefined` = não veio no payload.
 */
export function extrairAssigneeDoPayload(
  payload: Record<string, unknown>,
): AssigneeInfo | null | undefined {
  const candidates: unknown[] = [
    payload.assignee,
    pegarObj(payload, 'conversation', 'meta', 'assignee'),
    pegarObj(payload, 'meta', 'assignee'),
    pegarObj(payload, 'conversation', 'assignee'),
  ];

  for (const c of candidates) {
    if (c === null) return null;
    if (!c || typeof c !== 'object') continue;
    const o = c as Record<string, unknown>;
    const id = Number(o.id);
    if (!id || Number.isNaN(id)) continue;
    return {
      id,
      name: typeof o.name === 'string' ? o.name : undefined,
      email: typeof o.email === 'string' ? o.email : undefined,
    };
  }

  const changed = payload.changed_attributes;
  if (Array.isArray(changed)) {
    for (const item of changed) {
      if (!item || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      const aid = row.assignee_id as Record<string, unknown> | undefined;
      if (!aid) continue;
      if (aid.current_value === null || aid.current_value === 0) return null;
      const id = Number(aid.current_value);
      if (id > 0) return { id };
    }
  }

  return undefined;
}

function contatoIdCw(payload: Record<string, unknown>): string | null {
  const contact =
    pegarObj(payload, 'contact') ||
    pegarObj(payload, 'meta', 'sender') ||
    pegarObj(payload, 'conversation', 'meta', 'sender');
  if (contact?.id != null) return String(contact.id);
  return null;
}

export type ResultadoAssigneeInbound = {
  ok: boolean;
  alterado?: boolean;
  contatoId?: string;
  motivo?: string;
};

/**
 * Atualiza responsável CRM se o assignee mudou no Atendimento.
 * Ignora eco de escrita recente CRM→Atendimento.
 */
export async function aplicarAssigneeDoPayloadAtendimento(
  payload: Record<string, unknown>,
): Promise<ResultadoAssigneeInbound> {
  const evento = String(payload.event ?? payload.tipo ?? '').toLowerCase();
  const eventosUteis = new Set([
    'conversation_updated',
    'assignee_changed',
    'conversation_status_changed',
    'message_created',
  ]);

  const assignee = extrairAssigneeDoPayload(payload);
  if (assignee === undefined) {
    if (!eventosUteis.has(evento)) {
      return { ok: true, alterado: false, motivo: 'evento_irrelevante' };
    }
    return { ok: true, alterado: false, motivo: 'sem_assignee' };
  }

  const cwId = contatoIdCw(payload);
  const telefone = extrairTelefoneDoPayloadChatwoot(payload);

  let contato: CrmContato | null = null;
  if (cwId) contato = await obterContatoPorChatwootId(cwId);
  if (!contato && telefone) contato = await obterContatoPorTelefone(telefone);
  if (!contato) return { ok: false, motivo: 'contato_crm_ausente' };

  if (foiAssigneeOutboundRecente(contato.id)) {
    return {
      ok: true,
      alterado: false,
      motivo: 'eco_outbound',
      contatoId: contato.id,
    };
  }

  if (assignee === null) {
    if (!contato.responsavel && contato.responsavelUsuarioId == null) {
      return { ok: true, alterado: false, contatoId: contato.id };
    }
    await definirResponsavelContato(contato.id, {
      responsavel: '',
      responsavelUsuarioId: null,
    });
    return { ok: true, alterado: true, contatoId: contato.id, motivo: 'limpo' };
  }

  const resolvido =
    (await resolverPorAgentId(assignee.id)) ||
    (await resolverUsuarioPainel({
      email: assignee.email,
      nome: assignee.name,
    }));

  if (!resolvido) {
    const nome = assignee.name || assignee.email || `Agent #${assignee.id}`;
    if (contato.responsavel === nome && contato.responsavelUsuarioId == null) {
      return { ok: true, alterado: false, contatoId: contato.id };
    }
    await definirResponsavelContato(contato.id, {
      responsavel: nome,
      responsavelUsuarioId: null,
    });
    return {
      ok: true,
      alterado: true,
      contatoId: contato.id,
      motivo: 'sem_usuario_painel',
    };
  }

  if (
    contato.responsavelUsuarioId === resolvido.usuarioId &&
    contato.responsavel === resolvido.nome
  ) {
    return { ok: true, alterado: false, contatoId: contato.id };
  }

  await definirResponsavelContato(contato.id, {
    responsavel: resolvido.nome,
    responsavelUsuarioId: resolvido.usuarioId,
  });
  return { ok: true, alterado: true, contatoId: contato.id };
}
