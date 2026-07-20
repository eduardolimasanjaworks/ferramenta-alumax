/**
 * Execução das tools de Calendário chamadas pelo agente.
 */
import {
  cancelarEventoIa,
  consultarDisponibilidadeIa,
  listarAgendasParaIa,
  marcarEventoIa,
  reagendarEventoIa,
} from './calendario-servico-ia.js';

export async function executarToolCalendario(opts: {
  toolName: string;
  args: Record<string, unknown>;
  telefone?: string;
}): Promise<string> {
  const { toolName, args, telefone } = opts;

  if (toolName === 'listar_agendas') {
    const listas = await listarAgendasParaIa();
    return JSON.stringify({ ok: true, agendas: listas }, null, 0);
  }

  if (toolName === 'consultar_disponibilidade') {
    const r = await consultarDisponibilidadeIa({
      agenda: String(args.agenda || ''),
      data: args.data ? String(args.data) : undefined,
      dias: args.dias != null ? Number(args.dias) : undefined,
      duracaoMin: args.duracao_min != null ? Number(args.duracao_min) : undefined,
    });
    return JSON.stringify(r);
  }

  if (toolName === 'marcar_evento') {
    const r = await marcarEventoIa({
      agenda: String(args.agenda || ''),
      data: String(args.data || ''),
      horaInicio: String(args.hora_inicio || args.horaInicio || ''),
      horaFim: args.hora_fim ? String(args.hora_fim) : undefined,
      titulo: args.titulo ? String(args.titulo) : undefined,
      convidado: args.convidado ? String(args.convidado) : undefined,
      telefone: String(args.telefone || telefone || ''),
      notas: args.notas ? String(args.notas) : undefined,
      duracaoMin: args.duracao_min != null ? Number(args.duracao_min) : undefined,
    });
    return JSON.stringify(r);
  }

  if (toolName === 'reagendar_evento') {
    const r = await reagendarEventoIa({
      eventoId: args.evento_id ? String(args.evento_id) : undefined,
      telefone: String(args.telefone || telefone || '') || undefined,
      novaData: String(args.nova_data || ''),
      novaHoraInicio: String(args.nova_hora_inicio || ''),
      novaHoraFim: args.nova_hora_fim ? String(args.nova_hora_fim) : undefined,
    });
    return JSON.stringify(r);
  }

  if (toolName === 'cancelar_evento') {
    const r = await cancelarEventoIa({
      eventoId: args.evento_id ? String(args.evento_id) : undefined,
      telefone: String(args.telefone || telefone || '') || undefined,
      data: args.data ? String(args.data) : undefined,
    });
    return JSON.stringify(r);
  }

  return `Ferramenta de calendario "${toolName}" nao reconhecida.`;
}
