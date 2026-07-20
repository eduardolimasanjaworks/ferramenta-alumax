/**
 * Ponto de entrada — Tilit.
 */
import { config } from './config.js';
import { iniciarServidor } from './servidor.js';
import { inicializarBancoPrompt } from './prompt-minasplaca.js';
import { inicializarBancoHistorico } from './historico-minasplaca.js';
import { garantirColecaoConhecimento } from './rag-minasplaca.js';
import { iniciarWorkerDebounce } from './debounce-minasplaca.js';
import { iniciarWorkerFollowup } from './followup-minasplaca.js';
import { obterRedis } from './lib/redis.js';
import { inicializarBancoEstado } from './estado-minasplaca.js';
import { inicializarBancoPausa } from './pausa-minasplaca.js';
import { inicializarBancoNotificacao } from './notificacao-minasplaca.js';
import { inicializarBancoFollowup } from './followup-config.js';
import { inicializarBancoDelay } from './delay-config.js';
import { inicializarCredenciais } from './auth-store.js';
import { inicializarBancoUsuarios } from './usuarios-store.js';
import { inicializarBancoCrm } from './crm-store.js';
import { inicializarFilaAtendimento } from './fila-atendimento.js';
import { inicializarBancoCalendario } from './calendario-pg.js';
import { iniciarWorkerCalendario } from './calendario-jobs.js';
import { garantirAgendasDemoIa } from './calendario-servico-ia.js';
import { inicializarBancoCampanhas } from './campanhas-pg.js';
import { iniciarWorkerCampanhas } from './campanhas-jobs.js';

async function aguardarDependencias(): Promise<void> {
  const redis = obterRedis();
  for (let i = 0; i < 40; i++) {
    try {
      await redis.ping();
      const { default: pg } = await import('pg');
      const pool = new pg.Pool({ connectionString: config.databaseUrl });
      await pool.query('SELECT 1');
      await pool.end();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error('Dependencias nao ficaram prontas a tempo');
}

async function main(): Promise<void> {
  if (!config.openrouterToken) {
    console.error('[init] ERRO: configure OPENROUTER_TOKEN no .env');
    process.exit(1);
  }

  console.log('[init] Tilit clean build', config.buildId);
  await aguardarDependencias();

  await inicializarBancoPrompt();
  await inicializarBancoHistorico();
  await inicializarBancoEstado();
  await inicializarBancoPausa();
  await inicializarBancoNotificacao();
  await inicializarBancoFollowup();
  await inicializarBancoDelay();
  await inicializarCredenciais();
  await inicializarBancoUsuarios();
  await inicializarBancoCrm();
  await inicializarFilaAtendimento();
  if (config.calendarioHabilitado) {
    await inicializarBancoCalendario();
    await garantirAgendasDemoIa().catch((err) =>
      console.error('[init] agendas calendario demo:', err),
    );
  } else {
    console.log('[init] Calendário desabilitado (CALENDARIO_HABILITADO=false)');
  }
  await inicializarBancoCampanhas();
  await garantirColecaoConhecimento();
  console.log('[init] Banco e vetores prontos');

  iniciarWorkerDebounce();
  iniciarWorkerFollowup();
  if (config.calendarioHabilitado) iniciarWorkerCalendario();
  iniciarWorkerCampanhas();
  await iniciarServidor();

  setTimeout(() => {
    import('./crm-chatwoot-sync.js')
      .then((m) => m.sincronizarTodosContatosChatwoot())
      .catch((err) => console.error('[init] sync CRM Chatwoot falhou:', err));
  }, 4_000);
}

main().catch((err) => {
  console.error('[init] Falha fatal:', err);
  process.exit(1);
});
