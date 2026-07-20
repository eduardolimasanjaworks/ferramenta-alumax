/**
 * Bateria: ~20 frases reais pedindo financeiro → tool transferir_humano.
 * TRANSFER_STUB=1 evita Chatwoot real; TRANSFER_TEST_LOG grava as tool calls.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const LOG = resolve(ROOT, 'data/teste-transfer-financeiro.jsonl');
const OUT = resolve(ROOT, 'data/teste-transfer-financeiro-resultado.json');

const FRASES = [
  'quero falar com o financeiro',
  'pode me passar para o financeiro por favor?',
  'preciso resolver um assunto com o financeiro',
  'me transfere pro setor financeiro',
  'gostaria de atendimento do financeiro',
  'tem como falar com alguém do financeiro?',
  'preciso tirar dúvida de boleto',
  'quero a segunda via da fatura',
  'preciso de ajuda com um pagamento em atraso',
  'recebi uma cobrança e quero entender',
  'preciso da nota fiscal do meu contrato',
  'NF da mensalidade não chegou, me ajuda',
  'quero renegociar um boleto',
  'assunto financeiro urgente',
  'manda eu pro financeiro aí',
  'me conecta com o financeiro pfv',
  'é sobre fatura, me passa pro financeiro',
  'preciso quitar um valor, alguém do financeiro?',
  'fala com o time financeiro pra mim',
  'nao quero o comercial, quero o financeiro',
];

function isFinanceiro(d) {
  const n = String(d || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  return n === 'financeiro' || n.includes('financeir');
}

async function main() {
  process.env.TRANSFER_TEST_LOG = LOG;
  process.env.TRANSFER_STUB = '1';
  process.env.TRANSFER_STUB_NOTIF = '1';
  process.env.TRANSFER_STUB_PAUSA = '1';

  mkdirSync(resolve(ROOT, 'data'), { recursive: true });
  if (existsSync(LOG)) unlinkSync(LOG);

  const { gerarRespostaAgente } = await import('../app/src/agente-minasplaca.ts');

  const jobs = FRASES.map(async (frase, i) => {
    const telefone = `5511999${String(100000 + i).slice(-6)}`;
    const t0 = Date.now();
    let resposta = '';
    let erro = null;
    try {
      resposta = await gerarRespostaAgente({
        telefone,
        mensagem: frase,
        historico: [],
        pushName: `Teste${i}`,
      });
    } catch (e) {
      erro = e instanceof Error ? e.message : String(e);
    }
    return {
      i,
      frase,
      telefone,
      ms: Date.now() - t0,
      resposta: String(resposta || '').slice(0, 280),
      erro,
    };
  });

  const runs = await Promise.all(jobs);
  const lines = existsSync(LOG)
    ? readFileSync(LOG, 'utf8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l))
    : [];

  const porTel = new Map();
  for (const l of lines) {
    if (!porTel.has(l.telefone)) porTel.set(l.telefone, []);
    porTel.get(l.telefone).push(l);
  }

  const detalhe = runs.map((r) => {
    const calls = porTel.get(r.telefone) || [];
    const ok = calls.some((c) => isFinanceiro(c.departamento));
    return { ...r, toolCalls: calls, passou: ok };
  });

  const passou = detalhe.filter((d) => d.passou).length;
  const resultado = {
    total: detalhe.length,
    passou,
    falhou: detalhe.length - passou,
    taxa: Number((passou / Math.max(detalhe.length, 1)).toFixed(3)),
    detalhe,
  };
  writeFileSync(OUT, JSON.stringify(resultado, null, 2));
  console.log(
    JSON.stringify(
      { total: resultado.total, passou, falhou: resultado.falhou, taxa: resultado.taxa },
      null,
      2,
    ),
  );
  for (const d of detalhe) {
    console.log(
      `${d.passou ? 'OK  ' : 'FAIL'} | ${d.frase} | tools=${
        d.toolCalls.map((c) => c.departamento).join(',') || '-'
      } | ${d.ms}ms${d.erro ? ' ERR=' + d.erro : ''}`,
    );
  }
  process.exit(passou === detalhe.length ? 0 : 2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
