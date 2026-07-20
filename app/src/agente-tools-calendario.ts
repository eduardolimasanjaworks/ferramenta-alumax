/**
 * Definições das tools de Calendário para o agente (OpenRouter).
 * Disponibilidade + CRUD de eventos sem side effects neste módulo.
 */
export const TOOLS_CALENDARIO = [
  {
    type: 'function' as const,
    function: {
      name: 'listar_agendas',
      description:
        'Lista os calendários/agendas ativos e QUANDO usar cada um (comercial, atendimento, visitas…). Chame antes de consultar disponibilidade se houver dúvida de qual agenda.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'consultar_disponibilidade',
      description: `Consulta horários LIVRES de uma agenda (timezone America/Sao_Paulo).
Respeita antecedência mínima, limite de dias futuros, dias da semana e intervalos da config.
OBRIGATÓRIO antes de oferecer horário ao cliente. NÃO invente slots.`,
      parameters: {
        type: 'object',
        properties: {
          agenda: {
            type: 'string',
            description: 'ID ou nome da agenda (ex.: Comercial Tilit, ag-atendimento).',
          },
          data: {
            type: 'string',
            description: 'Opcional YYYY-MM-DD. Se omitido, varre os próximos dias.',
          },
          dias: {
            type: 'number',
            description: 'Quantos dias à frente varrer (padrão 7–14, limitado pela agenda).',
          },
          duracao_min: {
            type: 'number',
            description: 'Duração desejada em minutos (padrão = intervalo da agenda).',
          },
        },
        required: ['agenda'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'marcar_evento',
      description:
        'Marca/cria um evento em horário livre já validado. Só chame após o cliente escolher um horário da consultar_disponibilidade.',
      parameters: {
        type: 'object',
        properties: {
          agenda: { type: 'string', description: 'ID ou nome da agenda.' },
          data: { type: 'string', description: 'YYYY-MM-DD' },
          hora_inicio: { type: 'string', description: 'HH:mm' },
          hora_fim: { type: 'string', description: 'HH:mm opcional' },
          titulo: { type: 'string' },
          convidado: { type: 'string', description: 'Nome do cliente' },
          telefone: { type: 'string' },
          notas: { type: 'string' },
          duracao_min: { type: 'number' },
        },
        required: ['agenda', 'data', 'hora_inicio'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'reagendar_evento',
      description: 'Reagenda um evento existente para nova data/hora (valida disponibilidade).',
      parameters: {
        type: 'object',
        properties: {
          evento_id: { type: 'string' },
          telefone: { type: 'string', description: 'Alternativa para achar o evento do cliente' },
          nova_data: { type: 'string' },
          nova_hora_inicio: { type: 'string' },
          nova_hora_fim: { type: 'string' },
        },
        required: ['nova_data', 'nova_hora_inicio'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'cancelar_evento',
      description: 'Cancela um evento existente por ID ou telefone (+ data opcional).',
      parameters: {
        type: 'object',
        properties: {
          evento_id: { type: 'string' },
          telefone: { type: 'string' },
          data: { type: 'string' },
        },
      },
    },
  },
];

export function textoRegrasCalendarioTools(): string {
  return `CALENDÁRIO / AGENDAMENTO (TOOLS):
- listar_agendas → saber qual calendário usar (cada um tem “quando usar”).
- consultar_disponibilidade → obter dias/horários livres REAIS (antecedência + limite futuro).
- marcar_evento → só após o cliente escolher um horário oferecido.
- reagendar_evento / cancelar_evento → mudanças; confirme com o cliente.
- Nunca invente disponibilidade. Fuso: America/Sao_Paulo.`;
}
