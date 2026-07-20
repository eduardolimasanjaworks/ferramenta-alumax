/**
 * Smoke stub: valida aliases de depto + tools de transferência + fila stub.
 */
import {
  transferirDepartamentoPorTelefone,
  resolverTeamId,
} from '../app/src/chatwoot-assignments.js';
import { transferirAtendentePorTelefone } from '../app/src/chatwoot-atendentes.js';
import { TOOLS_TRANSFERENCIA } from '../app/src/agente-transferencias.js';

async function main() {
  console.log('aliases', {
    recepcao: resolverTeamId('recepção'),
    certificado: resolverTeamId('certificado digital'),
    fin: resolverTeamId('financeiro'),
  });
  process.env.TRANSFER_STUB = '1';
  process.env.TRANSFER_STUB_FILA = '1';
  const d = await transferirDepartamentoPorTelefone({
    telefone: '5511999999999',
    departamento: 'financeiro',
  });
  console.log('depto+fila', d);
  const a = await transferirAtendentePorTelefone({
    telefone: '5511999999999',
    nomeOuEmail: 'Gabriela Silveira',
    departamento: 'financeiro',
  });
  console.log('atendente', a);
  console.log(
    'tools',
    TOOLS_TRANSFERENCIA.map((t) => t.function.name),
  );
  if (!d.ok || !d.assigneeId) throw new Error('fila stub falhou');
  if (!a.ok || a.assigneeId !== 42) throw new Error('atendente stub falhou');
  console.log('OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
