/**
 * Envio WhatsApp Tilit: Atendimento → Uaz (sanjaworks); demais → Evolution.
 * Nunca usa tokens/config da Minas.
 */
import { config } from '../config.js';
import { enviarTextoSimples as evoTexto, obterStatusConexao as evoStatus } from './evolution.js';
import { uazEnviarTexto, uazStatus } from './uazapi.js';
import { eUazAtendimento, resolverMetaInstancia } from './whatsapp-instancias.js';
import { canonizarTelefoneBr } from '../util/telefone.js';
import { dividirResposta, normalizarRespostaWhatsapp } from './mensagem.js';
import { obterDelayAleatorioMs } from '../delay-config.js';

export async function statusCanal(instance?: string | null): Promise<{
  conectado: boolean;
  state?: string;
  provider: string;
}> {
  if (eUazAtendimento(instance)) {
    const s = await uazStatus();
    return { conectado: s.conectado, state: s.state, provider: 'uazapi' };
  }
  const inst = resolverMetaInstancia(instance || config.evolutionInstance).name;
  const s = await evoStatus(inst);
  return { conectado: s.conectado, state: s.state, provider: 'evolution' };
}

export async function enviarTextoCanal(
  instance: string | null | undefined,
  telefone: string,
  texto: string,
  delayMs = 800,
): Promise<void> {
  const tel = canonizarTelefoneBr(telefone);
  if (eUazAtendimento(instance)) {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    await uazEnviarTexto(tel, texto);
    return;
  }
  const meta = resolverMetaInstancia(instance || config.evolutionInstance);
  await evoTexto(meta.name, tel, texto, delayMs);
}

export async function tentarEnviarCanal(
  telefone: string,
  textoCompleto: string,
  instance: string,
  opts?: { fragmentar?: boolean },
): Promise<{ enviado: boolean; fragmentos: number; motivo?: string }> {
  const st = await statusCanal(instance);
  if (!st.conectado) {
    return { enviado: false, fragmentos: 0, motivo: 'whatsapp_desconectado' };
  }
  try {
    const textos = opts?.fragmentar === false
      ? [normalizarRespostaWhatsapp(textoCompleto)]
      : dividirResposta(normalizarRespostaWhatsapp(textoCompleto));
    let n = 0;
    for (const t of textos) {
      const delayMs = await obterDelayAleatorioMs();
      await enviarTextoCanal(instance, telefone, t, delayMs);
      n++;
    }
    return { enviado: true, fragmentos: n };
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err);
    return { enviado: false, fragmentos: 0, motivo };
  }
}
