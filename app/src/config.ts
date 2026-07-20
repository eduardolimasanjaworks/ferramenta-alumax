/**
 * Configuracao central — Tilit (isolado da Minas Placa).
 */

function token(
  nome: string,
  varPrincipal: string,
  varAlternativa?: string,
): string | undefined {
  const v = process.env[varPrincipal] ?? (varAlternativa ? process.env[varAlternativa] : undefined);
  if (v && v.trim().length > 0) return v.trim();
  console.warn(`[config] ${nome} nao configurado (${varPrincipal})`);
  return undefined;
}

export const config = {
  porta: Number(process.env.PORT ?? '8096'),
  buildId: 'tilit-clean-2026-07-10',

  /** URL pública do painel (CORS, HTTP-Referer). Cada clone define a sua via env. */
  publicUrl: (process.env.PUBLIC_URL ?? 'https://iatilit.sanjaworks.com').replace(/\/$/, ''),

  // LLM
  openrouterToken: token('openrouter', 'OPENROUTER_TOKEN'),
  openrouterHabilitado: (process.env.OPENROUTER_HABILITADO ?? 'true') === 'true',
  modeloChat: (process.env.MODELO_CHAT_OPENROUTER ?? 'openai/gpt-4o-mini').trim(),
  openaiApiKey: token('openai', 'OPENAI_API_KEY'),

  /**
   * Calendário na UI/worker. false = some o menu e não agenda jobs.
   * Religue com CALENDARIO_HABILITADO=true (ver LIGAR-CALENDARIO.md).
   */
  calendarioHabilitado: (process.env.CALENDARIO_HABILITADO ?? 'false') === 'true',

  // WhatsApp / Evolution (só Comercial no Evolution; Atendimento = Uaz)
  evolutionUrl: process.env.EVOLUTION_URL ?? 'http://evolution-api:8080',
  evolutionApiKey: process.env.EVOLUTION_API_KEY ?? 'tilit-evolution-key-2026',
  evolutionInstance: process.env.EVOLUTION_INSTANCE ?? 'tilit-comercial-chatwoot',
  evolutionInstances: (process.env.EVOLUTION_INSTANCES ?? 'tilit-comercial-chatwoot')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  /** Nome cadastrado no painel de licença para a linha principal (alias curto do Uaz aponta para cá). */
  licencaInstancePrincipal: (process.env.LICENCA_INSTANCE_PRINCIPAL ?? 'tilit-atendimento-chatwoot').trim(),

  // UazAPI pago Tilit (sanjaworks) — separado da Minas.
  uazapiBaseUrl: (process.env.UAZAPI_BASE_URL ?? '').replace(/\/$/, ''),
  uazapiAdminToken: process.env.UAZAPI_ADMIN_TOKEN?.trim() || undefined,
  uazapiToken: process.env.UAZAPI_TOKEN?.trim() || undefined,
  uazapiInstanceName: process.env.UAZAPI_INSTANCE_NAME?.trim() || undefined,

  // Banco / cache / vetores
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://tilit:tilit_secret_2026@tilit_postgres:5432/tilit',
  redisUrl: process.env.REDIS_URL ?? 'redis://tilit_redis:6379/0',
  qdrantUrl: process.env.QDRANT_URL ?? 'http://tilit_qdrant:6333',
  /** Collection do RAG no Qdrant. Cada clone precisa da sua para não misturar conhecimento. */
  qdrantCollection: (process.env.QDRANT_COLLECTION ?? 'tilit_conhecimento').trim(),

  // Directus
  directusUrl: process.env.DIRECTUS_URL ?? 'http://tilit_directus:8055',
  directusToken: token('directus', 'DIRECTUS_TOKEN', 'VITE_DIRECTUS_TOKEN'),
  directusAdminEmail: process.env.IAMINASPLACA_ADMIN_EMAIL ?? 'admin@tilitgroup.com',
  directusAdminPassword: process.env.IAMINASPLACA_ADMIN_PASSWORD ?? 'Tilit2026!',

  // Admin / webhook Chatwoot
  adminKey:
    process.env.TILIT_WEBHOOK_KEY
    ?? process.env.MINASPLACA_WEBHOOK_KEY
    ?? process.env.IAMINASPLACA_ADMIN_KEY
    ?? 'tilit-pausa-2026',
  adminEmail: process.env.IAMINASPLACA_ADMIN_EMAIL ?? 'admin@tilitgroup.com',
  adminPassword: process.env.IAMINASPLACA_ADMIN_PASSWORD ?? 'Tilit2026!',

  // Debounce
  debounceMs: Number(process.env.DEBOUNCE_MS ?? '2500'),

  // Follow-up (padrão 30 minutos)
  followupMs: Number(process.env.FOLLOWUP_MS ?? '1800000'),

  // n8n
  n8nUrl: process.env.N8N_URL ?? 'http://localhost:5678',

  // Chatwoot SSO (embed painel) — conta 12 = Tilit
  chatwootUrl: process.env.CHATWOOT_URL ?? 'https://chat.sanjaworks.com',
  chatwootAccountId: process.env.CHATWOOT_ACCOUNT_ID ?? '12',
  chatwootSsoUserId: process.env.CHATWOOT_SSO_USER_ID ?? '',
  chatwootPlatformToken: token('chatwoot platform', 'CHATWOOT_PLATFORM_TOKEN'),
  /** Secret do webhook Chatwoot (HMAC X-Chatwoot-Signature) — opcional. */
  chatwootWebhookSecret: process.env.CHATWOOT_WEBHOOK_SECRET?.trim() || undefined,
  /** Opcional — se vazio, obtido via Platform API do usuario SSO. */
  chatwootApiAccessToken: token('chatwoot api', 'CHATWOOT_API_ACCESS_TOKEN'),
};
