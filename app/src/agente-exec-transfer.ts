/**
 * Execução das tools de transferência (depto / atendente).
 * Atribui no Atendimento + CRM e pausa a IA — sem enviar WhatsApp.
 */
import {
  transferirDepartamentoPorTelefone,
  type TransferMode,
} from './chatwoot-assignments.js';
import { transferirAtendentePorTelefone } from './chatwoot-atendentes.js';
import { aposTransferenciaAtribuirEPausar } from './transfer-pos.js';

export async function executarToolTransferencia(opts: {
  toolName: string;
  args: Record<string, unknown>;
  telefone: string;
  pushName?: string;
}): Promise<string> {
  const { toolName, args, telefone } = opts;

  if (toolName === 'transferir_departamento' || toolName === 'transferir_humano') {
    const motivo = String(args.motivo || 'Solicitação de atendimento humano').trim();
    const departamento = String(args.departamento || 'atendimento').trim();
    // Modo interno fixo — não expor jargon (cegueira/handoff) à IA nem ao painel.
    const transferMode = 'handoff_new_conversation' as TransferMode;

    const assign = await transferirDepartamentoPorTelefone({
      telefone,
      departamento,
      transferMode,
      transferNote: motivo,
    });

    await aposTransferenciaAtribuirEPausar({
      telefone,
      departamento,
      motivo,
      toolName,
      assigneeId: assign.assigneeId,
      assigneeNome: assign.assigneeNome,
    });

    if (assign.ok) {
      const filaMsg = assign.assigneeNome
        ? ` Atendente atribuído: ${assign.assigneeNome}.`
        : ' Fila/departamento atribuído (aguardando atendente).';
      return (
        `Conversa transferida para "${departamento}".${filaMsg} ` +
        'IA pausada. Avise o cliente que o setor dará continuidade. NÃO cite nomes.'
      );
    }
    return `Transferência parcial (${assign.motivo || 'erro'}). IA pausada. Diga que será atendido em breve.`;
  }

  if (toolName === 'transferir_atendente') {
    const motivo = String(args.motivo || 'Solicitação de atendente específico').trim();
    const nomeOuEmail = String(args.nome_ou_email || args.nome || '').trim();
    const departamento = String(args.departamento || '').trim() || undefined;

    const assign = await transferirAtendentePorTelefone({
      telefone,
      nomeOuEmail,
      departamento,
      transferNote: motivo,
    });

    await aposTransferenciaAtribuirEPausar({
      telefone,
      departamento: departamento || 'atendimento',
      motivo,
      toolName,
      assigneeId: assign.assigneeId,
      assigneeNome: assign.assigneeNome || nomeOuEmail,
    });

    if (assign.ok) {
      return (
        'Conversa transferida para atendente. IA pausada. ' +
        'Avise o cliente que alguém dará continuidade. NÃO diga o nome.'
      );
    }
    return `Falha ao atribuir atendente (${assign.motivo || 'erro'}). IA pausada. Diga que será atendido em breve.`;
  }

  return `Tool ${toolName} nao reconhecida`;
}
