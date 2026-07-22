/**
 * Consulta Postgres Master T.I.: a linha Evolution tem licença de IA?
 * Sem URL configurada: só a instância principal (EVOLUTION_INSTANCE) responde.
 */
import pg from 'pg';
import { config } from './config.js';
import { carregarInstanciasWa } from './lib/whatsapp-instancias.js';

type CacheEntry = { ok: boolean; exp: number };

let pool: pg.Pool | null = null;
const cache = new Map<string, CacheEntry>();
const CACHE_MS = 45_000;

function normalizarInstance(name: string): string {
  return String(name || '').trim().toLowerCase();
}

function obterPool(): pg.Pool | null {
  const url = process.env.LICENCA_IA_DATABASE_URL?.trim();
  if (!url) return null;
  if (!pool) pool = new pg.Pool({ connectionString: url, max: 3 });
  return pool;
}

async function consultarPostgres(instance: string): Promise<boolean | null> {
  const p = obterPool();
  if (!p) return null;
  try {
    const { rows } = await p.query<{ habilitada: boolean }>(
      `SELECT habilitada FROM ia_licenca_linha
       WHERE lower(instance_name) = $1
       LIMIT 1`,
      [normalizarInstance(instance)],
    );
    if (!rows.length) return false;
    return rows[0].habilitada === true;
  } catch (err) {
    console.error('[licenca-ia] falha ao consultar master:', err);
    return null;
  }
}

/** true = IA pode responder nesta linha WhatsApp. */
export async function linhaTemLicencaIa(instance?: string | null): Promise<boolean> {
  const pUrl = process.env.LICENCA_IA_DATABASE_URL?.trim();
  if (!pUrl) {
    // Instalação padrão sem servidor central de licenças: autoriza todas as instâncias locais
    return true;
  }

  let inst = (instance && String(instance).trim()) || config.evolutionInstance;
  // Aliases genéricos (Uaz usa nomes curtos) → instância principal cadastrada na licença
  if (
    /^atendimento$/i.test(inst)
    || /^tilit$/i.test(inst)
    || (config.uazapiInstanceName && inst === config.uazapiInstanceName)
  ) {
    inst = config.licencaInstancePrincipal;
  }
  const key = normalizarInstance(inst);
  // Também testa o nome pedido além do alias
  const keys = new Set([key, normalizarInstance(instance || '')].filter(Boolean));

  for (const k of keys) {
    const hit = cache.get(k);
    if (hit && hit.exp > Date.now()) {
      if (hit.ok) return true;
      continue;
    }
  }

  let ok = false;
  for (const nome of keys) {
    const doPg = await consultarPostgres(nome);
    if (doPg === true) {
      ok = true;
      break;
    }
    if (doPg === null) {
      // Se não há banco de licença central, cai no fallback local
      if (nome === normalizarInstance(config.evolutionInstance)) {
        ok = true;
        break;
      }
      // Verifica se a instância existe e está ativa nas instâncias locais
      const ativas = await carregarInstanciasWa().catch(() => []);
      const ativaEncontrada = ativas.some(
        (i) => normalizarInstance(i.name) === nome || normalizarInstance(i.label) === nome
      );
      if (ativaEncontrada) {
        ok = true;
        break;
      }
    }
  }

  for (const k of keys) {
    cache.set(k, { ok, exp: Date.now() + CACHE_MS });
  }
  return ok;
}

/** Invalida cache (útil em testes). */
export function limparCacheLicencaIa(): void {
  cache.clear();
}
