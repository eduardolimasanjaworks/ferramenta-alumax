/**
 * Testes: disponibilidade + CRUD calendário + respostas da IA com horários livres.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'data/teste-calendario-ia-resultado.json');

async function main() {
  mkdirSync(resolve(ROOT, 'data'), { recursive: true });

  const {
    garantirAgendasDemoIa,
    listarAgendasParaIa,
    consultarDisponibilidadeIa,
    marcarEventoIa,
    reagendarEventoIa,
    cancelarEventoIa,
  } = await import('../app/src/calendario-servico-ia.ts');

  await garantirAgendasDemoIa();
  const agendas = await listarAgendasParaIa();
  console.log('agendas', agendas.map((a) => a.nome));

  const unitarios = [];

  const dispCom = await consultarDisponibilidadeIa({
    agenda: 'Comercial Tilit',
    dias: 10,
  });
  unitarios.push({
    id: 'unit-disp-comercial',
    ok: dispCom.ok && (dispCom.slots?.length ?? 0) > 0,
    detalhe: dispCom.ok
      ? `slots=${dispCom.slots.length} primeiro=${dispCom.slots[0]?.data} ${dispCom.slots[0]?.horaInicio}`
      : dispCom.erro,
  });

  const dispAte = await consultarDisponibilidadeIa({ agenda: 'Atendimento Tilit', dias: 7 });
  unitarios.push({
    id: 'unit-disp-atendimento',
    ok: dispAte.ok && (dispAte.slots?.length ?? 0) > 0,
    detalhe: dispAte.ok ? `slots=${dispAte.slots.length}` : dispAte.erro,
  });

  const slot = dispCom.ok ? dispCom.slots[0] : null;
  let marcar = { ok: false };
  if (slot) {
    marcar = await marcarEventoIa({
      agenda: 'Comercial Tilit',
      data: slot.data,
      horaInicio: slot.horaInicio,
      convidado: 'Cliente Teste',
      telefone: '5511999000011',
      titulo: 'Call comercial teste',
    });
  }
  unitarios.push({
    id: 'unit-marcar',
    ok: !!marcar.ok,
    detalhe: JSON.stringify(marcar).slice(0, 200),
  });

  const eventoId = marcar.ok ? marcar.evento?.id : null;
  let reag = { ok: false };
  if (eventoId && dispCom.ok && dispCom.slots[1]) {
    reag = await reagendarEventoIa({
      eventoId,
      novaData: dispCom.slots[1].data,
      novaHoraInicio: dispCom.slots[1].horaInicio,
    });
  }
  unitarios.push({
    id: 'unit-reagendar',
    ok: !!reag.ok,
    detalhe: JSON.stringify(reag).slice(0, 180),
  });

  let cancel = { ok: false };
  if (reag.ok && reag.evento?.id) {
    cancel = await cancelarEventoIa({ eventoId: reag.evento.id });
  } else if (eventoId) {
    cancel = await cancelarEventoIa({ eventoId });
  }
  unitarios.push({
    id: 'unit-cancelar',
    ok: !!cancel.ok,
    detalhe: JSON.stringify(cancel).slice(0, 160),
  });

  // —— LLM battery ——
  process.env.TRANSFER_STUB = '1';
  process.env.TRANSFER_STUB_NOTIF = '1';
  process.env.TRANSFER_STUB_PAUSA = '1';
  const { gerarRespostaAgente } = await import('../app/src/agente-minasplaca.ts');

  const frases = [
    'quais horarios livres vocês tem essa semana no comercial?',
    'quero agendar uma reunião comercial, me passa opções de dia e hora',
    'tem horário amanhã no atendimento?',
    'preciso marcar visita presencial, o que tem disponível?',
  ];

  const llm = [];
  for (let i = 0; i < frases.length; i++) {
    const telefone = `5511977${String(200000 + i).slice(-6)}`;
    const t0 = Date.now();
    let resposta = '';
    let erro = null;
    try {
      resposta = await gerarRespostaAgente({
        telefone,
        mensagem: frases[i],
        historico: [],
        pushName: 'CalTest',
      });
    } catch (e) {
      erro = e instanceof Error ? e.message : String(e);
    }
    const temHora = /\d{1,2}:\d{2}/.test(resposta);
    const temData =
      /\d{1,2}\/\d{1,2}/.test(resposta) ||
      /\d{4}-\d{2}-\d{2}/.test(resposta) ||
      /segunda|terça|terca|quarta|quinta|sexta|amanhã|amanha|hoje/i.test(resposta);
    llm.push({
      id: `llm-${i + 1}`,
      frase: frases[i],
      ok: !erro && temHora && (temData || /horario|horário|dispon/i.test(resposta)),
      temHora,
      temData,
      ms: Date.now() - t0,
      resposta: String(resposta).slice(0, 400),
      erro,
    });
    console.log(
      `${llm[i].ok ? 'OK' : 'FAIL'} llm-${i + 1} (${llm[i].ms}ms) hora=${temHora} data=${temData}`,
    );
  }

  const all = [...unitarios, ...llm];
  const passed = all.filter((x) => x.ok).length;
  const summary = {
    total: all.length,
    passed,
    failed: all.length - passed,
    taxa: Math.round((passed / all.length) * 100),
    agendas,
    all,
  };
  writeFileSync(OUT, JSON.stringify(summary, null, 2));
  console.log(`\n${passed}/${all.length} OK (${summary.taxa}%) → ${OUT}`);
  if (passed < all.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
