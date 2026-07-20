/**
 * Regras de janela horária (America/Sao_Paulo) para disparos.
 * Extraído puro — sem DB — para testar a lógica de campanha.
 */
export function minutosAgoraBrasilia(agora = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(agora);
  const hh = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const mm = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  return hh * 60 + mm;
}

/** True se agora (BR) está entre inicio e fim (HH:MM). */
export function estaDentroHorario(
  inicio: string | null,
  fim: string | null,
  agora = new Date(),
): boolean {
  if (!inicio || !fim) return true;
  const [ih, im] = inicio.split(':').map(Number);
  const [fh, fm] = fim.split(':').map(Number);
  const agoraMin = minutosAgoraBrasilia(agora);
  const ini = (ih || 0) * 60 + (im || 0);
  const fimM = (fh || 0) * 60 + (fm || 0);
  if (ini <= fimM) return agoraMin >= ini && agoraMin <= fimM;
  return agoraMin >= ini || agoraMin <= fimM;
}

/** Delay aleatório inclusivo entre min e max (segundos de espera). */
export function delayAleatorioSec(min: number, max: number): number {
  const a = Math.min(min, max);
  const b = Math.max(min, max);
  return a + Math.floor(Math.random() * (b - a + 1));
}

/** Monta timestamps de envio em cadeia a partir de agendadoEm. */
export function montarCronogramaEnvios(opts: {
  telefones: string[];
  mensagens: number;
  delayMinSec: number;
  delayMaxSec: number;
  agendadoEmMs: number;
  rand?: (min: number, max: number) => number;
}): Date[] {
  const rand = opts.rand || delayAleatorioSec;
  const out: Date[] = [];
  let cursor = opts.agendadoEmMs;
  for (let t = 0; t < opts.telefones.length; t++) {
    for (let m = 0; m < opts.mensagens; m++) {
      out.push(new Date(cursor));
      cursor += rand(opts.delayMinSec, opts.delayMaxSec) * 1000;
    }
  }
  return out;
}
