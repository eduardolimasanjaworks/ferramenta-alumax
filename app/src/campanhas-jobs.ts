/**
 * Worker de campanhas WhatsApp — Uaz (Atendimento) ou Evolution.
 * Respeita delay da fila e janela America/Sao_Paulo.
 */
import { enviarTextoCanal } from './lib/canal-envio.js';
import { estaDentroHorario } from './campanhas-horario.js';
import {
  adiarJob,
  claimJobsPendentes,
  finalizarCampanhaSeConcluida,
  marcarJob,
} from './campanhas-fila.js';

const INTERVAL_MS = 8_000;

function erroDisparoPublico(raw: string): string {
  if (/exist|not.?on.?whatsapp|not.?registered/i.test(raw)) {
    return 'Número inválido ou sem WhatsApp';
  }
  if (/401|403|unauthorized|invalid token/i.test(raw)) {
    return 'Instância WhatsApp sem permissão / desconectada';
  }
  if (/400/.test(raw)) return 'Falha ao enviar (número ou conexão)';
  return raw.slice(0, 180);
}

export async function processarJobsCampanhas(): Promise<number> {
  const jobs = await claimJobsPendentes(5);
  let n = 0;
  for (const job of jobs) {
    try {
      if (
        job.usarHorarios &&
        !estaDentroHorario(job.horarioInicio, job.horarioFim)
      ) {
        await adiarJob(job.id, new Date(Date.now() + 15 * 60_000));
        continue;
      }
      await enviarTextoCanal(job.instancia, job.telefone, job.texto, 800);
      await marcarJob(job.id, 'enviado');
      n++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[campanhas] falha envio', job.telefone, msg.slice(0, 200));
      await marcarJob(job.id, 'erro', erroDisparoPublico(msg));
    }
    await finalizarCampanhaSeConcluida(job.campanhaId);
  }
  return n;
}

export function iniciarWorkerCampanhas(): void {
  console.log('[campanhas] worker iniciado (fuso America/Sao_Paulo)');
  const tick = async () => {
    try {
      await processarJobsCampanhas();
    } catch (err) {
      console.error('[campanhas] worker erro:', err);
    }
  };
  void tick();
  setInterval(() => void tick(), INTERVAL_MS);
}
