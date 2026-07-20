/**
 * Follow-up: a cada X min após a última fala do LADO DA TILIT (IA ou atendente).
 * Não dispara se o último a falar foi o cliente/contato.
 */
import pg from 'pg';
import { obterRedis } from './lib/redis.js';
import { config } from './config.js';
import { gerarRespostaAgente } from './agente-minasplaca.js';
import { tentarEnviarResposta } from './lib/evolution.js';
import { obterHistorico, adicionarAoHistorico } from './historico-minasplaca.js';
import { logEvento } from './util/log-eventos.js';
import { iaEstaPausada } from './pausa-minasplaca.js';
import { obterConfigFollowup } from './followup-config.js';

const redis = obterRedis();
const pool = new pg.Pool({ connectionString: config.databaseUrl });

const PREFIXO_TIMER = 'followup:timer:';
const PREFIXO_SENT = 'followup:sent:';

/** Quem fala pelo lado Tilit (vale follow-up). Cliente = `user`. */
export function ehRespostaLadoTilit(role: string): boolean {
  const r = String(role || '').toLowerCase();
  return r === 'assistant' || r === 'atendente' || r === 'humano' || r === 'equipe';
}

export async function agendarFollowup(telefone: string): Promise<void> {
  const cfg = await obterConfigFollowup();
  if (!cfg.ativo) {
    await cancelarFollowup(telefone).catch(() => {});
    console.log(`[followup] desativado no painel — nao agendado para ${telefone}`);
    return;
  }

  const chaveTimer = `${PREFIXO_TIMER}${telefone}`;
  const chaveSent = `${PREFIXO_SENT}${telefone}`;
  const atrasoMs = cfg.minutos * 60000;
  const executaEm = Date.now() + atrasoMs;

  const pipeline = redis.pipeline();
  pipeline.set(chaveTimer, String(executaEm));
  pipeline.del(chaveSent);
  await pipeline.exec();
  console.log(`[followup] agendado para ${telefone} em timestamp ${executaEm} (daqui a ${cfg.minutos} min)`);
}

export async function cancelarFollowup(telefone: string): Promise<void> {
  const chaveTimer = `${PREFIXO_TIMER}${telefone}`;
  const chaveSent = `${PREFIXO_SENT}${telefone}`;

  const pipeline = redis.pipeline();
  pipeline.del(chaveTimer);
  pipeline.del(chaveSent);
  await pipeline.exec();
  console.log(`[followup] cancelado/resetado para ${telefone}`);
}

/** Religa timer se a última fala no histórico foi da Tilit (IA/atendente). */
export async function reagendarSeUltimoFoiLadoTilit(telefone: string): Promise<boolean> {
  try {
    const res = await pool.query(
      `SELECT role FROM historico_conversa WHERE telefone = $1 ORDER BY timestamp DESC LIMIT 1`,
      [telefone],
    );
    const role = String(res.rows[0]?.role || '');
    if (!ehRespostaLadoTilit(role)) return false;
    await agendarFollowup(telefone);
    return true;
  } catch (err) {
    console.error('[followup] reagendarSeUltimoFoiLadoTilit falhou:', err);
    return false;
  }
}

export async function processarFollowup(telefone: string): Promise<void> {
  const chaveSent = `${PREFIXO_SENT}${telefone}`;

  const cfg = await obterConfigFollowup();
  if (!cfg.ativo) {
    console.log(`[followup] desativado no painel. Ignorando follow-up para ${telefone}.`);
    return;
  }

  if (await iaEstaPausada(telefone)) {
    console.log(`[followup] IA pausada para ${telefone}. Ignorando follow-up.`);
    return;
  }

  const jaEnviado = await redis.get(chaveSent);
  if (jaEnviado === '1') {
    console.log(`[followup] já enviado para ${telefone}. Ignorando.`);
    return;
  }

  let row: { role: string; content: string; timestamp: Date | string };
  try {
    const res = await pool.query(
      `SELECT role, content, timestamp FROM historico_conversa
       WHERE telefone = $1 ORDER BY timestamp DESC LIMIT 1`,
      [telefone],
    );
    if (res.rowCount === 0) {
      console.log(`[followup] sem histórico para ${telefone}. Ignorando.`);
      return;
    }
    row = res.rows[0];
  } catch (err) {
    console.error(`[followup] erro ao buscar último histórico para ${telefone}:`, err);
    return;
  }

  const { role, content, timestamp } = row;
  const tsMensagem = new Date(timestamp).getTime();
  const agora = Date.now();

  // Último a falar precisa ser IA ou atendente Tilit — NÃO o cliente.
  if (!ehRespostaLadoTilit(role)) {
    console.log(
      `[followup] última mensagem de ${telefone} foi do contato (role=${role}). Ignorando follow-up.`,
    );
    return;
  }

  const atrasoMs = cfg.minutos * 60000;
  const tempoDecorrido = agora - tsMensagem;
  if (tempoDecorrido < atrasoMs - 5000) {
    console.log(
      `[followup] inatividade recente para ${telefone} (${tempoDecorrido}ms < ${atrasoMs}ms). Ignorando.`,
    );
    return;
  }

  const transferido =
    /transferindo|transferir|setor dará continuidade|time de .* dará|vou te conectar/i.test(
      content,
    );
  if (transferido) {
    console.log(`[followup] possível handoff em ${telefone}. Ignorando follow-up.`);
    return;
  }

  await redis.set(chaveSent, '1', 'EX', 86400);

  try {
    console.log(`[followup] gerando acompanhamento para ${telefone} (último lado=${role})...`);
    const historico = await obterHistorico(telefone, 100);
    const mensagemInstrucao =
      `[SISTEMA: O cliente está em silêncio há ${cfg.minutos} minutos após a última mensagem do nosso lado ` +
      `(IA ou atendente). Siga as regras de follow-up abaixo. Se NÃO fizer sentido, responda exatamente SEM_FOLLOWUP.\n\n` +
      `REGRAS DE FOLLOW-UP:\n${cfg.instrucoes}]`;

    const resposta = await gerarRespostaAgente({
      telefone,
      mensagem: mensagemInstrucao,
      historico,
    });

    if (!resposta || resposta.includes('Desculpe, ocorreu um erro')) {
      console.warn(`[followup] resposta inválida para ${telefone}: "${resposta}". Abortando.`);
      await redis.del(chaveSent);
      return;
    }

    if (/^\s*sem_followup\s*$/i.test(resposta) || /\bSEM_FOLLOWUP\b/.test(resposta)) {
      console.log(`[followup] IA decidiu SEM_FOLLOWUP para ${telefone}.`);
      return;
    }

    await adicionarAoHistorico(telefone, [
      { role: 'assistant', content: resposta, timestamp: Date.now() },
    ]);

    console.log(`[followup] enviando para ${telefone}: ${resposta.slice(0, 80)}`);
    const remoteJid = `${telefone}@s.whatsapp.net`;
    const resultado = await tentarEnviarResposta(telefone, resposta, config.evolutionInstance, {
      remoteJid,
      fragmentar: true,
    });
    console.log(`[followup] resultado envio para ${telefone}:`, resultado);
    logEvento('followup', 'Follow-up enviado com sucesso', { telefone, resposta }, 'info');
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err);
    console.error(`[followup] erro ao processar follow-up para ${telefone}: ${motivo}`);
    logEvento('followup', 'Erro ao enviar follow-up', { telefone, motivo }, 'error');
    await redis.del(chaveSent);
  }
}

export function iniciarWorkerFollowup(intervaloMs = 10000): void {
  console.log('[followup] worker iniciado');
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
            await processarFollowup(telefone);
          }
        }
      }
    } catch (err) {
      console.error('[followup] erro no tick do worker de follow-up:', err);
    }
    setTimeout(tick, intervaloMs);
  }
  tick();
}
