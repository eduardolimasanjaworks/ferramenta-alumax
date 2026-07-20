/**
 * CRM → Atendimento: ao mudar responsável no contato,
 * atribui (ou limpa) o agent na conversa aberta.
 */
import {
  atribuirConversa,
  obterDisplayIdConversaAberta,
} from './chatwoot-assignments.js';
import { resolverUsuarioPainel } from './crm-assignee-map.js';
import type { CrmContato } from './crm-store.js';

/** Evita loop CRM↔Atendimento por alguns segundos após write outbound. */
const outboundRecente = new Map<string, number>();
const TTL_MS = 8_000;

export function marcarAssigneeOutbound(contatoId: string): void {
  outboundRecente.set(contatoId, Date.now());
}

export function foiAssigneeOutboundRecente(contatoId: string): boolean {
  const t = outboundRecente.get(contatoId);
  if (!t) return false;
  if (Date.now() - t > TTL_MS) {
    outboundRecente.delete(contatoId);
    return false;
  }
  return true;
}

export type ResultadoAssigneeWrite = {
  ok: boolean;
  motivo?: string;
  displayId?: number;
  assigneeId?: number | null;
};

/**
 * Espelha responsável do contato CRM na conversa do Atendimento.
 * Sem conversa → ok:false (não quebra o PATCH do CRM).
 */
export async function sincronizarResponsavelCrmParaAtendimento(
  contato: CrmContato,
): Promise<ResultadoAssigneeWrite> {
  const telefone = String(contato.telefone || '').replace(/\D/g, '');
  const temVinculo =
    (contato.chatwootContactId && Number(contato.chatwootContactId) > 0) ||
    telefone.length >= 8;
  if (!temVinculo) return { ok: false, motivo: 'sem_vinculo_atendimento' };

  const limpo =
    !contato.responsavel &&
    (contato.responsavelUsuarioId == null || Number(contato.responsavelUsuarioId) <= 0);

  let assigneeId: number | null = null;
  if (!limpo) {
    const resolvido = await resolverUsuarioPainel({
      usuarioId: contato.responsavelUsuarioId,
      nome: contato.responsavel,
    });
    if (!resolvido) return { ok: false, motivo: 'usuario_nao_mapeado' };
    if (!resolvido.chatwootUserId) {
      return { ok: false, motivo: 'sem_chatwoot_user_id' };
    }
    assigneeId = resolvido.chatwootUserId;
  }

  const conv = await obterDisplayIdConversaAberta(telefone, {
    contactId: contato.chatwootContactId,
  });
  if (!conv.ok || !conv.displayId) {
    return { ok: false, motivo: conv.motivo || 'sem_conversa' };
  }

  const res = await atribuirConversa({
    displayId: conv.displayId,
    assigneeId,
  });

  if (res.ok) marcarAssigneeOutbound(contato.id);

  return {
    ok: res.ok,
    motivo: res.ok ? (limpo ? 'desatribuido' : undefined) : res.motivo,
    displayId: conv.displayId,
    assigneeId,
  };
}
