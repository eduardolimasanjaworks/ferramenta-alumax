/**
 * Conta OpenRouter DESTE app (chat) — isolada do Master.
 * Clones EXIGEM OPENROUTER_TOKEN_APP; bases podem usar OPENROUTER_TOKEN.
 */
import { config } from '../config.js';

export type ContaOpenrouterApp = {
  token: string;
  workspaceId: string | null;
  workspaceNome: string | null;
  titulo: string;
  referer: string;
  isolada: boolean;
};

function slugDoApp(): string {
  const deEnv = (process.env.OPENROUTER_WORKSPACE_NAME
    || process.env.APP_SLUG
    || '').trim();
  if (deEnv) return deEnv;
  try {
    const host = new URL(config.publicUrl).hostname;
    const parte = host.split('.')[0];
    if (parte && parte !== 'iatilit' && parte !== 'iaminas') return parte;
  } catch { /* ignore */ }
  return 'tilit';
}

export function appPermiteTokenCompartilhado(): boolean {
  const slug = slugDoApp().toLowerCase();
  if ((process.env.OPENROUTER_EXIGIR_TOKEN_APP ?? '').trim() === 'true') return false;
  if ((process.env.OPENROUTER_EXIGIR_TOKEN_APP ?? '').trim() === 'false') return true;
  return slug === 'tilit' || slug === 'minasplaca' || slug === 'minas';
}

export function contaOpenrouterApp(): ContaOpenrouterApp {
  const slug = slugDoApp();
  const tokenApp = (process.env.OPENROUTER_TOKEN_APP ?? '').trim();
  const token =
    tokenApp
    || (appPermiteTokenCompartilhado() ? (config.openrouterToken ?? '') : '')
    || '';
  return {
    token,
    workspaceId: (process.env.OPENROUTER_WORKSPACE_ID ?? '').trim() || null,
    workspaceNome: (process.env.OPENROUTER_WORKSPACE_NAME ?? slug).trim() || slug,
    titulo: `SanjaWorks / ${slug}`,
    referer: config.publicUrl || `https://${slug}.ia.sanjaworks.com`,
    isolada: Boolean(tokenApp),
  };
}

export function openrouterProntoParaChat(): boolean {
  return Boolean(contaOpenrouterApp().token);
}

export function headersOpenrouterChat(conta = contaOpenrouterApp()): Record<string, string> {
  if (!conta.token) {
    throw new Error(
      'OPENROUTER_TOKEN_APP ausente — provisione no Master antes de ligar a IA',
    );
  }
  return {
    Authorization: `Bearer ${conta.token}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': conta.referer,
    'X-Title': conta.titulo,
  };
}
