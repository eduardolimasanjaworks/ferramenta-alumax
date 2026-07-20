/**
 * Helpers compartilhados das rotas de usuários do painel.
 * Mantém usuarios-rotas.ts enxuto (auth admin + parse de IDs).
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { obterUsuarioDaSessao } from './auth-minasplaca.js';
import { mensagemPublicaAtendimento } from './mensagens-publicas.js';

export function parseDepartamentoIds(raw: unknown): number[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0))];
}

export function erroPub(raw: unknown): string {
  return mensagemPublicaAtendimento(raw);
}

export async function exigirAdmin(req: FastifyRequest, reply: FastifyReply) {
  const u = await obterUsuarioDaSessao(req);
  if (!u) {
    reply.code(401).send({ ok: false, erro: 'Nao autenticado' });
    return null;
  }
  if (u.role !== 'admin') {
    reply.code(403).send({ ok: false, erro: 'Apenas administradores' });
    return null;
  }
  return u;
}
