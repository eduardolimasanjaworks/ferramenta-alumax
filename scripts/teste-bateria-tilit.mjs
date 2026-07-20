/**
 * Bateria ~30 conversas reais Tilit: tools, departamentos, tom, follow-up helpers.
 * TRANSFER_STUB=1; grava resultados em data/teste-bateria-tilit-resultado.json
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const LOG = resolve(ROOT, 'data/teste-bateria-tilit.jsonl');
const OUT = resolve(ROOT, 'data/teste-bateria-tilit-resultado.json');

/** @type {{ id: string; mensagem: string; historico?: {role:string;content:string}[]; expect: (ctx: any) => { ok: boolean; motivo?: string } }[]} */
const CASOS = [
  // —— Financeiro (tool imediata) ——
  { id: 'fin-01', mensagem: 'quero falar com o financeiro', expect: expDepto('financeiro') },
  { id: 'fin-02', mensagem: 'preciso da segunda via do boleto', expect: expDepto('financeiro') },
  { id: 'fin-03', mensagem: 'NF da mensalidade não chegou', expect: expDepto('financeiro') },
  { id: 'fin-04', mensagem: 'recebi uma cobrança e quero entender', expect: expDepto('financeiro') },
  { id: 'fin-05', mensagem: 'quero quitar um valor em atraso', expect: expDepto('financeiro') },
  { id: 'fin-06', mensagem: 'me passa pro setor financeiro pfv', expect: expDepto('financeiro') },

  // —— Outros departamentos ——
  { id: 'res-01', mensagem: 'quero reservar uma sala de reunião amanhã', expect: expDepto('reservas') },
  { id: 'rec-01', mensagem: 'tem uma encomenda pra mim na recepção', expect: expDepto(['correspondencia', 'recepcao']) },
  { id: 'imp-01', mensagem: 'preciso de certificado digital, quanto custa?', expect: expDepto(['impressao', 'impressão']) },
  { id: 'com-01', mensagem: 'quero ser cliente e falar com o comercial', expect: expDepto('comercial') },
  { id: 'for-01', mensagem: 'sou fornecedor e quero parceria', expect: expDepto('fornecedores') },
  { id: 'ate-01', mensagem: 'preciso de ajuda geral do atendimento', expect: expDepto('atendimento') },

  // —— Atendente específico (roteiro) ——
  {
    id: 'pes-01',
    mensagem: 'pode me passar pra Nathalia da recepção?',
    expect: (ctx) => {
      const tools = ctx.tools || [];
      const aten = tools.find((t) => t.tool === 'transferir_atendente');
      const depto = tools.find((t) =>
        ['transferir_departamento', 'transferir_humano'].includes(t.tool),
      );
      if (aten || depto) return { ok: true };
      return { ok: false, motivo: 'esperava transferir_atendente ou departamento recepcao' };
    },
  },

  // —— Tom / humanização ——
  {
    id: 'tom-01',
    mensagem: 'oi',
    expect: (ctx) => {
      const r = (ctx.resposta || '').toLowerCase();
      if (/sou uma ia|sou um bot|assistente virtual|chatgpt|inteligência artificial/.test(r)) {
        return { ok: false, motivo: 'revelou ser IA' };
      }
      if (!r.trim()) return { ok: false, motivo: 'resposta vazia' };
      return { ok: true };
    },
  },
  {
    id: 'tom-02',
    mensagem: 'bom dia, tudo bem?',
    expect: (ctx) => {
      const r = ctx.resposta || '';
      if (r.length < 8) return { ok: false, motivo: 'resposta curta demais' };
      if (/sou uma ia|sou um bot/i.test(r)) return { ok: false, motivo: 'revelou IA' };
      return { ok: true };
    },
  },
  {
    id: 'tom-03',
    mensagem: 'obrigado!',
    historico: [
      { role: 'user', content: 'quero falar com o financeiro' },
      { role: 'assistant', content: 'Claro! Já conecto você com o time financeiro.' },
    ],
    expect: (ctx) => {
      if (!(ctx.resposta || '').trim()) return { ok: false, motivo: 'sem resposta' };
      return { ok: true };
    },
  },

  // —— Preço → transferir, sem inventar valores absurdos ——
  {
    id: 'preco-01',
    mensagem: 'quanto custa o certificado digital A1?',
    expect: (ctx) => {
      const tools = ctx.tools || [];
      const transferiu = tools.some((t) =>
        ['transferir_departamento', 'transferir_humano', 'transferir_atendente'].includes(t.tool),
      );
      const r = ctx.resposta || '';
      if (/R\$\s*\d{2,}/.test(r) && !transferiu) {
        return { ok: false, motivo: 'inventou preço sem transferir' };
      }
      return transferiu || /conectar|time|setor|especialista/i.test(r)
        ? { ok: true }
        : { ok: false, motivo: 'não encaminhou preço ao setor' };
    },
  },

  // —— Não citar nomes de atendentes ao cliente ——
  {
    id: 'nome-01',
    mensagem: 'me passa pro financeiro',
    expect: (ctx) => {
      const r = ctx.resposta || '';
      if (/gabriela|giulia|nathalia|dulcin[eé]ia|érica|erica/i.test(r)) {
        return { ok: false, motivo: 'citou nome de atendente' };
      }
      return expDepto('financeiro')(ctx);
    },
  },

  // —— Menu / intenção vaga ——
  {
    id: 'menu-01',
    mensagem: 'preciso de uma informação',
    expect: (ctx) => {
      const r = (ctx.resposta || '').toLowerCase();
      if (!r.trim()) return { ok: false, motivo: 'vazio' };
      return { ok: true };
    },
  },
  {
    id: 'menu-02',
    mensagem: 'sou cliente',
    expect: (ctx) => {
      if (!(ctx.resposta || '').trim()) return { ok: false, motivo: 'vazio' };
      return { ok: true };
    },
  },

  // —— Aliases departamento no tool log ——
  { id: 'alias-01', mensagem: 'assunto de correspondência / encomenda', expect: expDepto(['correspondencia', 'recepcao']) },
  { id: 'alias-02', mensagem: 'quero imprimir uns documentos aí', expect: expDepto(['impressao', 'impressão']) },

  // —— Continuidade após histórico ——
  {
    id: 'cont-01',
    mensagem: 'pode transferir agora',
    historico: [
      { role: 'user', content: 'tenho dúvida de boleto' },
      { role: 'assistant', content: 'Posso te conectar com o financeiro. Posso transferir?' },
    ],
    expect: expDepto('financeiro'),
  },

  // —— RH / marketing (departamentos extras) ——
  { id: 'rh-01', mensagem: 'quero falar com recursos humanos sobre férias', expect: expDepto(['recursos humanos', 'rh']) },
  { id: 'mkt-01', mensagem: 'assunto de marketing e redes sociais', expect: expDepto('marketing') },

  // —— Dr Paulo ——
  { id: 'dr-01', mensagem: 'preciso falar com o Dr Paulo Ladeira', expect: expDepto(['dr paulo ladeira', 'dr-paulo-ladeira']) },

  // —— Não transferir sem necessidade em pingue-pongue ——
  {
    id: 'notr-01',
    mensagem: 'só queria dizer que o atendimento de vocês é ótimo',
    expect: (ctx) => {
      const tools = ctx.tools || [];
      if (tools.length > 0) return { ok: false, motivo: 'transferiu sem necessidade' };
      return (ctx.resposta || '').trim() ? { ok: true } : { ok: false, motivo: 'sem resposta' };
    },
  },

  // —— After hours style ——
  {
    id: 'hora-01',
    mensagem: 'alguém aí?',
    expect: (ctx) => ((ctx.resposta || '').trim() ? { ok: true } : { ok: false, motivo: 'vazio' }),
  },

  // —— Follow-up helpers (unitário embutido, sem LLM) ——
  {
    id: 'fup-unit-01',
    mensagem: '__UNIT__',
    expect: () => {
      return { ok: true, motivo: 'placeholder' };
    },
  },
];

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function expDepto(alvo) {
  const alvos = (Array.isArray(alvo) ? alvo : [alvo]).map(norm);
  return (ctx) => {
    const tools = ctx.tools || [];
    const hit = tools.find((t) =>
      ['transferir_departamento', 'transferir_humano'].includes(t.tool),
    );
    if (!hit) {
      // às vezes a IA só responde e transfer_mode em segunda volta — aceita menção + keyword
      const r = norm(ctx.resposta);
      if (alvos.some((a) => r.includes(a.split(' ')[0])) && /conect|transfer|setor|time/.test(r)) {
        return { ok: false, motivo: 'falou em transferir sem chamar tool' };
      }
      return { ok: false, motivo: 'tool departamento não chamada' };
    }
    const d = norm(hit.departamento);
    if (alvos.some((a) => d === a || d.includes(a) || a.includes(d))) return { ok: true };
    return { ok: false, motivo: `departamento="${hit.departamento}" ≠ ${alvos.join('|')}` };
  };
}

function lerToolsDoLog(telefone) {
  if (!existsSync(LOG)) return [];
  return readFileSync(LOG, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter((x) => x && x.telefone === telefone)
    .map((x) => ({
      tool: x.tool || 'transferir_humano',
      departamento: x.departamento,
      motivo: x.motivo,
    }));
}

async function main() {
  process.env.TRANSFER_TEST_LOG = LOG;
  process.env.TRANSFER_STUB = '1';
  process.env.TRANSFER_STUB_NOTIF = '1';
  process.env.TRANSFER_STUB_PAUSA = '1';
  process.env.TRANSFER_STUB_FILA = '1';

  mkdirSync(resolve(ROOT, 'data'), { recursive: true });
  if (existsSync(LOG)) unlinkSync(LOG);

  const { ehRespostaLadoTilit } = await import('../app/src/followup-minasplaca.ts');
  const { gerarRespostaAgente } = await import('../app/src/agente-minasplaca.ts');

  // substitui caso fup-unit
  const casos = CASOS.map((c) => {
    if (c.id !== 'fup-unit-01') return c;
    return {
      ...c,
      expect: () => {
        const ok =
          ehRespostaLadoTilit('assistant') &&
          ehRespostaLadoTilit('atendente') &&
          !ehRespostaLadoTilit('user') &&
          !ehRespostaLadoTilit('cliente');
        return ok
          ? { ok: true }
          : { ok: false, motivo: 'ehRespostaLadoTilit falhou' };
      },
    };
  });

  // completa até ~30 se necessário
  while (casos.length < 30) {
    const n = casos.length + 1;
    casos.push({
      id: `extra-${n}`,
      mensagem: 'quero falar com o financeiro sobre boleto ' + n,
      expect: expDepto('financeiro'),
    });
  }

  const resultados = [];
  for (let i = 0; i < casos.length; i++) {
    const c = casos[i];
    const telefone = `5511988${String(100000 + i).slice(-6)}`;
    const t0 = Date.now();
    let resposta = '';
    let erro = null;

    if (c.mensagem === '__UNIT__') {
      const ev = c.expect({ tools: [], resposta: '' });
      resultados.push({
        id: c.id,
        ok: ev.ok,
        motivo: ev.motivo,
        ms: Date.now() - t0,
        resposta: '(unit)',
        tools: [],
      });
      console.log(`${ev.ok ? 'OK' : 'FAIL'} ${c.id}`);
      continue;
    }

    try {
      resposta = await gerarRespostaAgente({
        telefone,
        mensagem: c.mensagem,
        historico: (c.historico || []).map((h) => ({
          role: h.role,
          content: h.content,
          timestamp: Date.now(),
        })),
        pushName: `Bateria${i}`,
      });
    } catch (e) {
      erro = e instanceof Error ? e.message : String(e);
    }

    const tools = lerToolsDoLog(telefone);
    const ev = erro
      ? { ok: false, motivo: erro }
      : c.expect({ tools, resposta, telefone });

    resultados.push({
      id: c.id,
      ok: ev.ok,
      motivo: ev.motivo || null,
      ms: Date.now() - t0,
      resposta: String(resposta || '').slice(0, 320),
      tools,
      mensagem: c.mensagem,
    });
    console.log(`${ev.ok ? 'OK' : 'FAIL'} ${c.id} (${Date.now() - t0}ms)${ev.motivo ? ' — ' + ev.motivo : ''}`);
  }

  const passed = resultados.filter((r) => r.ok).length;
  const summary = {
    total: resultados.length,
    passed,
    failed: resultados.length - passed,
    taxa: Math.round((passed / resultados.length) * 100),
    em: new Date().toISOString(),
    resultados,
  };
  writeFileSync(OUT, JSON.stringify(summary, null, 2));
  console.log('\n==== RESUMO ====');
  console.log(`${passed}/${resultados.length} OK (${summary.taxa}%)`);
  console.log('Arquivo:', OUT);
  if (passed < resultados.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
