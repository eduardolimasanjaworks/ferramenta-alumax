/**
 * Catálogo WhatsApp — env (sync) + DB wa_instancias (async).
 * CRUD do painel usa carregarInstanciasWa; env fica como fallback/seed.
 */
import { config } from '../config.js';
import { listarWaInstancias } from '../wa-instancias-store.js';

export type WaProvider = 'uazapi' | 'evolution';

export type WaInstanciaMeta = {
  name: string;
  label: string;
  provider: WaProvider;
  chatwootInboxName?: string | null;
};

const ALIASES_ATENDIMENTO = new Set([
  'atendimento',
  'tilit',
  'tilit-atendimento',
  'tilit-atendimento-chatwoot',
]);

const ALIASES_EVO: Record<string, string> = {
  comercial: 'tilit-comercial-chatwoot',
  'tilit-comercial': 'tilit-comercial-chatwoot',
};

let cacheAsync: WaInstanciaMeta[] | null = null;

function labelDe(name: string): string {
  return name.replace(/-chatwoot$/i, '').replace(/^tilit-/i, '');
}

export function listaInstanciasWa(): WaInstanciaMeta[] {
  const out: WaInstanciaMeta[] = [];

  if (config.uazapiToken && config.uazapiBaseUrl) {
    out.push({ name: 'atendimento', label: 'atendimento', provider: 'uazapi' });
  }

  const evo = (config.evolutionInstances?.length
    ? config.evolutionInstances
    : [config.evolutionInstance]
  ).filter((n) => n && !/atendimento/i.test(n));

  for (const name of evo) {
    out.push({ name, label: labelDe(name), provider: 'evolution' });
  }
  return out;
}

/** Lista preferindo DB; se vazio, cai no env. */
export async function carregarInstanciasWa(): Promise<WaInstanciaMeta[]> {
  if (cacheAsync) return cacheAsync;
  try {
    const rows = await listarWaInstancias({ soAtivas: true });
    if (rows.length) {
      cacheAsync = rows.map((r) => ({
        name: r.nome,
        label: r.label,
        provider: r.provider,
        chatwootInboxName: r.chatwoot_inbox_name,
      }));
      return cacheAsync;
    }
  } catch {
    /* DB ainda nao migrado */
  }
  cacheAsync = listaInstanciasWa();
  return cacheAsync;
}

export function invalidarCacheWaInstancias(): void {
  cacheAsync = null;
}

export function resolverMetaInstancia(raw?: string | null): WaInstanciaMeta {
  const lista = cacheAsync && cacheAsync.length > 0 ? cacheAsync : listaInstanciasWa();
  
  if (!lista.length) throw new Error('nenhuma_instancia_whatsapp');

  const pedida = String(raw || '').trim().toLowerCase();
  if (!pedida) return lista[0];

  if (ALIASES_ATENDIMENTO.has(pedida) || pedida === 'atendimento') {
    const uaz = lista.find((i) => i.provider === 'uazapi');
    if (uaz) return uaz;
  }

  const canon = ALIASES_EVO[pedida] || pedida;
  const hit = lista.find(
    (i) =>
      i.name.toLowerCase() === canon
      || i.name.toLowerCase() === pedida
      || i.label.toLowerCase() === pedida
      || i.name.replace(/-chatwoot$/i, '').toLowerCase() === pedida.replace(/-chatwoot$/i, ''),
  );
  if (!hit) throw new Error(`instancia_invalida: ${raw}`);
  return hit;
}

export function eUazAtendimento(raw?: string | null): boolean {
  if (!config.uazapiToken || !config.uazapiBaseUrl) return false;
  const pedida = String(raw || '').trim().toLowerCase();
  if (!pedida) return resolverMetaInstancia(null).provider === 'uazapi';
  return resolverMetaInstancia(raw).provider === 'uazapi';
}
