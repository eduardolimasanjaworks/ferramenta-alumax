/**
 * Após transferência: espelha assignee no CRM e confirma pausa da IA.
 * Sem envio de mensagem ao cliente — só atribuição + pausa.
 */
import { definirPausa } from './pausa-minasplaca.js';
import { cancelarFollowup } from './followup-minasplaca.js';
import { resolverPorAgentId } from './crm-assignee-map.js';
import {
  definirResponsavelContato,
  obterContatoPorTelefone,
} from './crm-store.js';

export async function aposTransferenciaAtribuirEPausar(opts: {
  telefone: string;
  departamento: string;
  motivo: string;
  toolName: string;
  assigneeId?: number;
  assigneeNome?: string;
}): Promise<void> {
  const { telefone, departamento, motivo, toolName, assigneeId, assigneeNome } = opts;

  try {
    await definirPausa(telefone, true, {
      motivo: `Transferência IA → ${departamento}: ${motivo}`,
      origem: `ia:${toolName}`,
    });
    await cancelarFollowup(telefone).catch(() => {});
  } catch (err) {
    console.error('[transfer] pausa IA falhou:', err);
  }

  if (!assigneeId) return;
  try {
    const contato = await obterContatoPorTelefone(telefone);
    if (!contato) return;
    const painel = await resolverPorAgentId(assigneeId);
    await definirResponsavelContato(contato.id, {
      responsavel: painel?.nome || assigneeNome || '',
      responsavelUsuarioId: painel?.usuarioId ?? null,
    });
  } catch (err) {
    console.error('[transfer] espelho CRM falhou:', err);
  }
}
