/**
 * Normaliza campos de responsável no PATCH do CRM
 * (id do painel ↔ nome) antes de persistir.
 */
import { resolverUsuarioPainel } from './crm-assignee-map.js';
import type { CrmContato } from './crm-store.js';

export type BodyResponsavel = Partial<CrmContato> & {
  responsavelUsuarioId?: number | string | null;
};

export function patchTemResponsavel(body: BodyResponsavel): boolean {
  return body.responsavel !== undefined || body.responsavelUsuarioId !== undefined;
}

/** Mutates body with resolved responsavel + responsavelUsuarioId. */
export async function normalizarBodyResponsavel(
  body: BodyResponsavel,
): Promise<void> {
  if (!patchTemResponsavel(body)) return;

  const uidRaw = body.responsavelUsuarioId as number | string | null | undefined;
  const uid =
    uidRaw === null || uidRaw === undefined || String(uidRaw).trim() === ''
      ? null
      : Number(uidRaw);

  if (uid != null && !Number.isNaN(uid) && uid > 0) {
    const r = await resolverUsuarioPainel({ usuarioId: uid });
    body.responsavelUsuarioId = r?.usuarioId ?? uid;
    body.responsavel = r?.nome ?? body.responsavel ?? '';
    return;
  }

  if (body.responsavel) {
    const r = await resolverUsuarioPainel({ nome: body.responsavel });
    body.responsavelUsuarioId = r?.usuarioId ?? null;
    if (r) body.responsavel = r.nome;
    return;
  }

  body.responsavel = '';
  body.responsavelUsuarioId = null;
}
