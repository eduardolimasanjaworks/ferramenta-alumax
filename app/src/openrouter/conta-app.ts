/**
 * Conta OpenRouter DESTE app (chat) — isolada do Master.
 * Cada clone pode ter OPENROUTER_TOKEN próprio; enquanto não tiver,
 * usa o token compartilhado. X-Title/Referer marcam o slug no dashboard.
 */
import { config } from '../config.js';

export type ContaOpenrouterApp = {
  token: string;
  workspaceId: string | null;
  workspaceNome: string | null;
  /** Rótulo enviado à OpenRouter (atribuicao de uso). */
  titulo: string;
  referer: string;
};

/** Slug derivado da URL pública ou do nome do container. */
function slugDoApp(): string {
  const deEnv = (process.env.OPENROUTER_WORKSPACE_NAME
    || process.env.APP_SLUG
    || '').trim();
  if (deEnv) return deEnv;
  try {
    const host = new URL(config.publicUrl).hostname; // ex.: alumax.ia.sanjaworks.com
    const parte = host.split('.')[0];
    if (parte && parte !== 'iatilit' && parte !== 'iaminas') return parte;
  } catch { /* ignore */ }
  return 'tilit';
}

export function contaOpenrouterApp(): ContaOpenrouterApp {
  const slug = slugDoApp();
  const tokenApp = (process.env.OPENROUTER_TOKEN_APP ?? '').trim();
  const token = tokenApp || config.openrouterToken;
  return {
    token,
    workspaceId: (process.env.OPENROUTER_WORKSPACE_ID ?? '').trim() || null,
    workspaceNome: (process.env.OPENROUTER_WORKSPACE_NAME ?? slug).trim() || slug,
    titulo: `SanjaWorks / ${slug}`,
    referer: config.publicUrl || `https://${slug}.ia.sanjaworks.com`,
  };
}

/** Headers padrão nas calls chat/completions (billing por app no painel OR). */
export function headersOpenrouterChat(conta = contaOpenrouterApp()): Record<string, string> {
  return {
    Authorization: `Bearer ${conta.token}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': conta.referer,
    'X-Title': conta.titulo,
  };
}
