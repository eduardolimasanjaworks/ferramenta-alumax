/**
 * SSO Platform do Atendimento: claim do user + URL de login embed.
 * POST sem senha reclama o agent sem trocar a senha dele.
 */
import { config } from './config.js';

function baseUrl(): string {
  return config.chatwootUrl.replace(/\/$/, '');
}

function platformToken(): string | null {
  return config.chatwootPlatformToken || null;
}

async function platformFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = platformToken();
  if (!token) throw new Error('chatwoot_platform_token_ausente');
  const headers = new Headers(init.headers);
  headers.set('Api-Access-Token', token);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${baseUrl()}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(20_000),
  });
}

export async function garantirPermissaoSso(dados: {
  chatwootUserId: number;
  email: string;
  nome?: string;
}): Promise<{ ok: boolean; motivo?: string }> {
  if (!platformToken()) return { ok: false, motivo: 'chatwoot_platform_token_ausente' };
  const email = dados.email.trim().toLowerCase();
  if (!email) return { ok: false, motivo: 'email_ausente' };
  try {
    const r = await platformFetch('/platform/api/v1/users', {
      method: 'POST',
      body: JSON.stringify({
        name: (dados.nome || email).trim(),
        email,
      }),
    });
    const body = (await r.json().catch(() => ({}))) as { id?: number };
    if (!r.ok && r.status !== 422) {
      return {
        ok: false,
        motivo: `sso_claim_http_${r.status}: ${JSON.stringify(body).slice(0, 160)}`,
      };
    }
    return { ok: true, motivo: body.id ? `claim_${body.id}` : 'claim_ok' };
  } catch (err) {
    return { ok: false, motivo: err instanceof Error ? err.message : String(err) };
  }
}

export async function ssoUrlParaUsuario(
  chatwootUserId: number,
  opts?: { email?: string; nome?: string },
): Promise<{ ok: boolean; iframeUrl?: string; motivo?: string }> {
  if (!platformToken()) return { ok: false, motivo: 'chatwoot_platform_token_ausente' };
  try {
    const tentar = async () => {
      const r = await platformFetch(`/platform/api/v1/users/${chatwootUserId}/login`);
      const data = (await r.json()) as { url?: string };
      return { r, data };
    };
    let { r, data } = await tentar();
    if ((!r.ok || !data.url) && opts?.email) {
      await garantirPermissaoSso({
        chatwootUserId,
        email: opts.email,
        nome: opts.nome,
      });
      ({ r, data } = await tentar());
    }
    if (!r.ok || !data.url) return { ok: false, motivo: `sso_http_${r.status}` };
    const sep = data.url.includes('?') ? '&' : '?';
    return {
      ok: true,
      iframeUrl: `${data.url}${sep}sso_account_id=${config.chatwootAccountId}`,
    };
  } catch (err) {
    return { ok: false, motivo: err instanceof Error ? err.message : String(err) };
  }
}
