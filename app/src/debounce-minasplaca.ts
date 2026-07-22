/**
 * Debounce de mensagens por contato.
 * Aguarda um tempo configurável (DEBOUNCE_MS) sem novas mensagens do mesmo contato
 * antes de enviar todas agrupadas para a IA.
 * 
 * Funciona com motor HÍBRIDO (Redis + Memória local) para garantir resiliência 100%.
 */

import { config } from './config.js';
import { obterRedis } from './lib/redis.js';
import { jidParaTelefone } from './util/telefone.js';
import { linhaTemLicencaIa } from './licenca-ia.js';
import { iaEstaPausada } from './pausa-minasplaca.js';
import { obterHistorico, adicionarAoHistorico } from './historico-minasplaca.js';
import { gerarRespostaAgente } from './agente-minasplaca.js';
import { tentarEnviarCanal } from './lib/canal-envio.js';
import { eUazAtendimento } from './lib/whatsapp-instancias.js';
import { agendarFollowup, cancelarFollowup } from './followup-minasplaca.js';

const redis = obterRedis();

export interface ItemDebounce {
  remoteJid: string;
  telefone: string;
  conteudo: string;
  tipo: string;
  pushName?: string;
  instance?: string;
  recebidoEm: number;
}

const PREFIXO_LISTA = 'debounce:lista:';
const PREFIXO_TIMER = 'debounce:timer:';
const PREFIXO_LOCK = 'debounce:lock:';
const TTL = 2 * 60 * 60;

// Armazenamento em memória local para resiliência imediata
const filaMemoria = new Map<string, ItemDebounce[]>();
const timersMemoria = new Map<string, NodeJS.Timeout>();

export async function adicionarAoDebounce(item: ItemDebounce): Promise<void> {
  const telefone = item.telefone;
  const instance = item.instance || config.evolutionInstance;

  if (!(await linhaTemLicencaIa(instance))) {
    console.log(`[debounce] sem licenca IA na linha ${instance} — nao enfileira`);
    return;
  }

  if (await iaEstaPausada(telefone)) {
    console.log(`[debounce] IA pausada para ${telefone} — mensagem nao enfileirada`);
    return;
  }

  const chaveLista = `${PREFIXO_LISTA}${telefone}`;
  const chaveTimer = `${PREFIXO_TIMER}${telefone}`;
  const executaEm = Date.now() + config.debounceMs;
  const ttlSegundos = Math.ceil((config.debounceMs + 5000) / 1000);

  // Cancela o follow-up porque o cliente está mandando mensagem ativamente
  await cancelarFollowup(telefone).catch(err => console.error('[debounce] erro ao cancelar follow-up:', err));

  // 1. Armazena na fila em memória local
  const listaAtual = filaMemoria.get(telefone) || [];
  listaAtual.push(item);
  filaMemoria.set(telefone, listaAtual);

  // Reset do timer em memória para debounce perfeito
  if (timersMemoria.has(telefone)) {
    clearTimeout(timersMemoria.get(telefone)!);
  }

  timersMemoria.set(
    telefone,
    setTimeout(() => {
      timersMemoria.delete(telefone);
      processarContato(`${telefone}@s.whatsapp.net`).catch((err) => {
        console.error(`[debounce] erro ao processar ${telefone}:`, err);
      });
    }, config.debounceMs + 100)
  );

  // 2. Tenta sincronizar no Redis (se disponível)
  try {
    const pipeline = redis.pipeline();
    pipeline.rpush(chaveLista, JSON.stringify(item));
    pipeline.expire(chaveLista, TTL);
    pipeline.set(chaveTimer, String(executaEm), 'EX', ttlSegundos);
    await pipeline.exec();
    console.log(`[debounce] mensagem adicionada para ${telefone}. Processamento agendado para daqui a ${config.debounceMs}ms`);
  } catch {
    console.log(`[debounce] mensagem mantida na memória local para ${telefone} (Redis offline)`);
  }
}

export async function processarContato(remoteJid: string): Promise<void> {
  const telefone = jidParaTelefone(remoteJid);
  const chaveLista = `${PREFIXO_LISTA}${telefone}`;
  const chaveLock = `${PREFIXO_LOCK}${telefone}`;

  // Tenta obter lock se Redis estiver disponível
  try {
    const lock = await redis.set(chaveLock, '1', 'EX', 30, 'NX');
    if (lock === null) {
      // Outro worker está processando
      return;
    }
  } catch {
    /* Redis offline - ignora lock e prossegue no worker local */
  }

  try {
    let itens: ItemDebounce[] = [];

    // Coleta itens da memória local
    if (filaMemoria.has(telefone)) {
      itens = filaMemoria.get(telefone) || [];
      filaMemoria.delete(telefone);
    }

    // Tenta complementar com itens do Redis
    try {
      const raw = await redis.lrange(chaveLista, 0, -1);
      if (raw.length) {
        await redis.del(chaveLista);
        const itensRedis: ItemDebounce[] = raw.map((s) => JSON.parse(s));
        // Evita duplicatas se já vieram da memória local
        for (const rItem of itensRedis) {
          if (!itens.some((i) => i.conteudo === rItem.conteudo && i.recebidoEm === rItem.recebidoEm)) {
            itens.push(rItem);
          }
        }
      }
    } catch {
      /* Redis offline */
    }

    console.log(`[debounce] processando ${telefone}: ${itens.length} mensagens acumuladas`);
    if (!itens.length) return;

    const textos = itens
      .filter((i) => i.conteudo)
      .map((i) => i.conteudo);
    const mensagem = textos.join('\n\n').trim();
    if (!mensagem) return;

    if (await iaEstaPausada(telefone)) {
      console.log(`[debounce] IA pausada para ${telefone} — processamento cancelado`);
      return;
    }

    const instanciaEnvio = itens[0]?.instance || config.evolutionInstance;
    if (!(await linhaTemLicencaIa(instanciaEnvio))) {
      console.log(`[debounce] sem licenca IA na linha ${instanciaEnvio} — processamento cancelado`);
      return;
    }

    const pushName = itens[0]?.pushName;
    const historico = await obterHistorico(telefone, 100);

    console.log(`[debounce] chamando agente para ${telefone} (${eUazAtendimento(instanciaEnvio) ? 'uaz' : 'evo'})`);
    const resposta = await gerarRespostaAgente({
      telefone,
      mensagem,
      historico,
      pushName,
    });

    await adicionarAoHistorico(telefone, [
      { role: 'user', content: mensagem, timestamp: Date.now() },
      { role: 'assistant', content: resposta, timestamp: Date.now() },
    ]);

    console.log(`[debounce] enviando resposta para ${telefone}: ${resposta.slice(0, 80)}`);
    const resultado = await tentarEnviarCanal(telefone, resposta, instanciaEnvio, {
      fragmentar: true,
    });
    console.log(`[debounce] resultado envio (${instanciaEnvio}):`, resultado);

    if (resultado.enviado) {
      await agendarFollowup(telefone).catch(err => console.error('[debounce] erro ao agendar follow-up:', err));
    }
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err);
    console.error(`[debounce] erro ao processar contato ${telefone}: ${motivo}`);
  } finally {
    try {
      await redis.del(chaveLock);
    } catch {}
  }
}

export function iniciarWorkerDebounce(intervaloMs = 300): void {
  console.log('[debounce] worker iniciado');
  async function tick() {
    try {
      const chaves = await redis.keys(`${PREFIXO_TIMER}*`);
      const agora = Date.now();
      
      for (const chave of chaves) {
        const valor = await redis.get(chave);
        if (!valor) continue;

        const executaEm = Number(valor);
        if (agora >= executaEm) {
          const telefone = chave.replace(PREFIXO_TIMER, '');
          const deletado = await redis.del(chave);
          if (deletado > 0) {
            await processarContato(`${telefone}@s.whatsapp.net`);
          }
        }
      }
    } catch (err) {
      // Redis offline - silencia aviso para não poluir os logs
    }
    setTimeout(tick, intervaloMs);
  }
  tick();
}
