#!/usr/bin/env node
/**
 * Testes unitários da lógica pura de campanhas (horário + cronograma).
 * Não depende de API/Docker — só da regra de negócio.
 *
 * Uso: node --import tsx scripts/teste-campanhas-unidade.mjs
 *   ou: npm run test:campanhas:unidade (a partir de app/)
 */
import {
  delayAleatorioSec,
  estaDentroHorario,
  montarCronogramaEnvios,
} from '../app/src/campanhas-horario.ts';

const results = [];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function run(name, fn) {
  const t0 = Date.now();
  try {
    fn();
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`PASS  ${name}`);
  } catch (e) {
    results.push({ name, ok: false, erro: e.message });
    console.error(`FAIL  ${name}: ${e.message}`);
  }
}

/** Fixa hora em America/Sao_Paulo via Date UTC conhecido. */
function instanteBrasil(h, m = 0) {
  // Usa string ISO com offset -03 (sem DST no BR)
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return new Date(`2026-07-14T${hh}:${mm}:00-03:00`);
}

console.log('\n=== Campanhas UNIT (horário/delay) ===\n');

run('01 sem janela → sempre true', () => {
  assert(estaDentroHorario(null, null, instanteBrasil(3)) === true, 'null');
  assert(estaDentroHorario('', '18:00', instanteBrasil(12)) === true, 'inicio vazio');
});

run('02 dentro do horário comercial', () => {
  assert(estaDentroHorario('09:00', '18:00', instanteBrasil(12, 30)) === true, '12:30');
  assert(estaDentroHorario('09:00', '18:00', instanteBrasil(9, 0)) === true, '09:00');
  assert(estaDentroHorario('09:00', '18:00', instanteBrasil(18, 0)) === true, '18:00');
});

run('03 fora do horário comercial', () => {
  assert(estaDentroHorario('09:00', '18:00', instanteBrasil(8, 59)) === false, '08:59');
  assert(estaDentroHorario('09:00', '18:00', instanteBrasil(18, 1)) === false, '18:01');
  assert(estaDentroHorario('09:00', '18:00', instanteBrasil(23)) === false, '23:00');
});

run('04 janela noturna (cruza meia-noite)', () => {
  assert(estaDentroHorario('22:00', '06:00', instanteBrasil(23)) === true, '23');
  assert(estaDentroHorario('22:00', '06:00', instanteBrasil(3)) === true, '03');
  assert(estaDentroHorario('22:00', '06:00', instanteBrasil(12)) === false, '12');
});

run('05 delayAleatorioSec dentro do intervalo', () => {
  for (let i = 0; i < 40; i++) {
    const d = delayAleatorioSec(30, 120);
    assert(d >= 30 && d <= 120, `fora: ${d}`);
  }
  assert(delayAleatorioSec(10, 5) >= 5 && delayAleatorioSec(10, 5) <= 10, 'min/max invertidos');
});

run('06 cronograma: N contatos × M msgs com delay fixo', () => {
  const rand = () => 60; // 60s fixo
  const times = montarCronogramaEnvios({
    telefones: ['111', '222'],
    mensagens: 2,
    delayMinSec: 60,
    delayMaxSec: 60,
    agendadoEmMs: Date.parse('2026-07-20T10:00:00-03:00'),
    rand,
  });
  assert(times.length === 4, `jobs=${times.length}`);
  assert(times[0].toISOString() === new Date('2026-07-20T10:00:00-03:00').toISOString(), 't0');
  assert(times[1].getTime() - times[0].getTime() === 60_000, 'gap1');
  assert(times[3].getTime() - times[0].getTime() === 180_000, 'gap3');
});

run('07 cronograma ordenado crescente', () => {
  const times = montarCronogramaEnvios({
    telefones: ['a', 'b', 'c'],
    mensagens: 1,
    delayMinSec: 30,
    delayMaxSec: 30,
    agendadoEmMs: Date.now(),
    rand: () => 30,
  });
  for (let i = 1; i < times.length; i++) {
    assert(times[i].getTime() > times[i - 1].getTime(), 'ordem');
  }
});

const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== UNIT: ${results.length - fail}/${results.length} ok ===\n`);
process.exit(fail ? 1 : 0);
