/**
 * Operações UazAPI para a inbox Atendimento (status, QR, disconnect).
 * Bridge real: Uaz ↔ Chatwoot nativo — aqui só controlamos a sessão WhatsApp.
 */
import { config } from '../config.js';
import { uazFetch } from './uazapi-http.js';

export type StatusUaz = {
  conectado: boolean;
  state: string;
  telefone?: string | null;
  profileName?: string | null;
  profilePicUrl?: string | null;
  instanceName: string;
};

type StatusResp = {
  instance?: {
    name?: string;
    status?: string;
    owner?: string;
    profileName?: string;
    profilePicUrl?: string;
  };
  status?: string | { connected?: boolean; loggedIn?: boolean };
  owner?: string;
  profileName?: string;
};

function stateOk(s: string): boolean {
  const x = s.toLowerCase();
  return x === 'connected' || x === 'open';
}

function digitos(jid?: string | null): string | null {
  if (!jid) return null;
  const n = jid.replace(/@.*/, '').replace(/\D/g, '');
  return n || null;
}

export async function uazStatus(): Promise<StatusUaz> {
  const data = await uazFetch<StatusResp>('/instance/status');
  const inst = data.instance ?? {};
  const stObj = typeof data.status === 'object' && data.status ? data.status : null;
  const stateRaw = String(
    inst.status
      ?? (typeof data.status === 'string' ? data.status : undefined)
      ?? 'unknown',
  ).toLowerCase();
  const conectado =
    stateOk(stateRaw) || stObj?.connected === true || stObj?.loggedIn === true;
  return {
    conectado,
    state: conectado ? 'connected' : stateRaw || 'disconnected',
    telefone: digitos(inst.owner ?? data.owner),
    profileName: inst.profileName ?? data.profileName ?? null,
    profilePicUrl: inst.profilePicUrl ?? null,
    instanceName: inst.name ?? config.uazapiInstanceName ?? 'uaz',
  };
}

export async function uazConnect(): Promise<{
  connected?: boolean;
  code?: string;
  pairingCode?: string | null;
}> {
  const st = await uazStatus().catch(() => null);
  if (st?.conectado) return { connected: true };

  const data = await uazFetch<Record<string, unknown>>('/instance/connect', {
    method: 'POST',
    body: {},
  });
  const inst =
    data.instance && typeof data.instance === 'object'
      ? (data.instance as Record<string, unknown>)
      : {};

  const candidatos = [inst.qrcode, data.qrcode, data.base64, data.qr, data.code, inst.base64];
  let code: string | undefined;
  for (const c of candidatos) {
    if (typeof c === 'string' && c.trim()) {
      code = c.trim();
      break;
    }
  }

  if ((data.loggedIn === true || data.connected === true) && !code) {
    return { connected: true };
  }
  return {
    connected: false,
    code,
    pairingCode:
      (typeof data.pairingCode === 'string' ? data.pairingCode : null)
      ?? (typeof inst.paircode === 'string' ? inst.paircode : null)
      ?? null,
  };
}

export async function uazDisconnect(): Promise<void> {
  await uazFetch('/instance/disconnect', { method: 'POST', body: {} });
}

/** Lê /chatwoot/config — só leitura; PUT exige body completo. */
export async function uazChatwootConfig(): Promise<Record<string, unknown>> {
  return uazFetch<Record<string, unknown>>('/chatwoot/config');
}

/** Envia texto via Uaz (número com DDI, sem +). */
export async function uazEnviarTexto(numero: string, texto: string): Promise<void> {
  await uazFetch('/send/text', {
    method: 'POST',
    body: { number: numero, text: texto },
  });
}

/** Aponta webhook da instância para o painel Tilit. */
export async function uazConfigurarWebhook(
  url = process.env.UAZAPI_WEBHOOK_URL || `${config.publicUrl}/webhook/uazapi`,
): Promise<void> {
  await uazFetch('/webhook', {
    method: 'POST',
    body: {
      url,
      enabled: true,
      events: ['messages', 'connection', 'qrcode'],
    },
  });
}

export async function uazPing(): Promise<boolean> {
  try {
    if (!config.uazapiToken) return false;
    await uazStatus();
    return true;
  } catch {
    return false;
  }
}
