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
import { inicializarBancoWaInstancias } from './wa-instancias-store.js';
import { carregarInstanciasWa } from './lib/whatsapp-instancias.js';
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
  try {
    await redis.ping();
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({ connectionString: config.databaseUrl });
    await pool.query('SELECT 1');
    await pool.end();
    console.log('[init] Conectado ao Postgres e Redis com sucesso.');
  } catch (err) {
    console.warn('[init] AVISO: Postgres/Redis locais indisponíveis. Servidor Web iniciando em modo dev/fallback.');
  }
}

async function main(): Promise<void> {
  if (!config.openrouterToken) {
    console.error('[init] ERRO: configure OPENROUTER_TOKEN no .env');
    process.exit(1);
  }

  console.log('[init] Tilit clean build', config.buildId);
  await aguardarDependencias();

  await inicializarBancoPrompt().catch((e) => console.warn('[init] prompt db offline:', e.message));
  await inicializarBancoHistorico().catch((e) => console.warn('[init] historico db offline:', e.message));
  await inicializarBancoEstado().catch((e) => console.warn('[init] estado db offline:', e.message));
  await inicializarBancoPausa().catch((e) => console.warn('[init] pausa db offline:', e.message));
  await inicializarBancoNotificacao().catch((e) => console.warn('[init] notificacao db offline:', e.message));
  await inicializarBancoFollowup().catch((e) => console.warn('[init] followup db offline:', e.message));
  await inicializarBancoDelay().catch((e) => console.warn('[init] delay db offline:', e.message));
  await inicializarCredenciais().catch((e) => console.warn('[init] credenciais db offline:', e.message));
  await inicializarBancoUsuarios().catch((e) => console.warn('[init] usuarios db offline:', e.message));
  await inicializarBancoCrm().catch((e) => console.warn('[init] crm db offline:', e.message));
  await inicializarBancoWaInstancias().catch((e) => console.warn('[init] wa_instancias db offline:', e.message));
  await carregarInstanciasWa().catch((e) => console.warn('[init] falha ao carregar wa cache:', e.message));
  await inicializarFilaAtendimento().catch((e) => console.warn('[init] fila db offline:', e.message));
  if (config.calendarioHabilitado) {
    await inicializarBancoCalendario().catch((e) => console.warn('[init] calendario db offline:', e.message));
    await garantirAgendasDemoIa().catch((err) =>
      console.error('[init] agendas calendario demo:', err),
    );
  } else {
    console.log('[init] Calendário desabilitado (CALENDARIO_HABILITADO=false)');
  }
  await inicializarBancoCampanhas().catch((e) => console.warn('[init] campanhas db offline:', e.message));
  await garantirColecaoConhecimento().catch((e) => console.warn('[init] qdrant offline:', e.message));
  console.log('[init] Inicialização concluída (servidor pronto)');

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
