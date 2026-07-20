/**
 * Regras OpenAI-tools de transferência + texto injetado no system prompt.
 * Inclui regras editáveis por fila (quando transferir).
 */
import { NOMES_DEPARTAMENTOS } from './chatwoot-assignments.js';
import { listarFilasComMembros } from './fila-config.js';

export const TOOLS_TRANSFERENCIA = [
  {
    type: 'function' as const,
    function: {
      name: 'transferir_departamento',
      description: `Transfere a conversa para um DEPARTAMENTO e pausa a IA.
Departamentos: ${NOMES_DEPARTAMENTOS.join(', ')}.
Respeite as regras "quando transferir" de cada fila (injetadas no system).`,
      parameters: {
        type: 'object',
        properties: {
          motivo: { type: 'string', description: 'Motivo resumido.' },
          departamento: {
            type: 'string',
            description: `Um de: ${NOMES_DEPARTAMENTOS.join(', ')}.`,
          },
        },
        required: ['motivo', 'departamento'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'transferir_humano',
      description: 'Alias de transferir_departamento.',
      parameters: {
        type: 'object',
        properties: {
          motivo: { type: 'string' },
          departamento: { type: 'string' },
        },
        required: ['motivo', 'departamento'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'transferir_atendente',
      description:
        'Transfere para ATENDENTE específico e pausa a IA. Não diga o nome ao cliente.',
      parameters: {
        type: 'object',
        properties: {
          motivo: { type: 'string' },
          nome_ou_email: { type: 'string' },
          departamento: { type: 'string', description: 'Opcional: alinhar time.' },
        },
        required: ['motivo', 'nome_ou_email'],
      },
    },
  },
];

export async function textoRegrasTransferencia(): Promise<string> {
  let blocosFila = '';
  try {
    const { filas } = await listarFilasComMembros();
    const comRegra = (filas || []).filter((f) => String(f.quando_transferir || '').trim());
    if (comRegra.length) {
      blocosFila =
        '\nREGRAS POR FILA (quando transferir):\n' +
        comRegra
          .map(
            (f) =>
              `- Fila "${f.name}": faça transferir_departamento departamento="${f.name}" quando: ${String(f.quando_transferir).trim()}`,
          )
          .join('\n');
    }
  } catch {
    /* filas indisponíveis — segue regra base */
  }

  return `REGRA DE TRANSFERÊNCIA:
- Setor → transferir_departamento (alias transferir_humano).
- Pessoa → transferir_atendente com nome_ou_email.
- Departamentos: ${NOMES_DEPARTAMENTOS.join(', ')}.
- Após tool: frase acolhedora; NÃO cite nomes; NÃO continue o assunto do setor.
- FINANCEIRO: boleto/fatura/pagamento/cobrança/NF → transferir_departamento departamento="financeiro".
${blocosFila}`;
}
