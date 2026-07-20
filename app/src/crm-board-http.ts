/**
 * Cache curto + gzip do board por funil (pipelineId).
 * TTL pequeno; invalidateBoardCache() zera todos.
 */
import { gzipSync } from 'node:zlib';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CrmColuna } from './crm-store.js';
import type { CrmContatoBoard } from './crm-board-load.js';

const TTL_MS = 2000;

type BoardData = { colunas: CrmColuna[]; contatos: CrmContatoBoard[] };

const caches = new Map<string, { at: number; data: BoardData }>();

export function invalidateBoardCache(): void {
  caches.clear();
}

export async function obterBoardComCache(
  pipelineId: string | null,
  loader: () => Promise<BoardData>,
): Promise<BoardData> {
  const key = pipelineId || '__all__';
  const agora = Date.now();
  const hit = caches.get(key);
  if (hit && agora - hit.at < TTL_MS) return hit.data;
  const data = await loader();
  caches.set(key, { at: Date.now(), data });
  return data;
}

/** Monta JSON compacto (sem campos vazios) e gzip se o cliente aceitar. */
export function enviarBoardJson(
  req: FastifyRequest,
  reply: FastifyReply,
  board: BoardData,
): unknown {
  const contatos = board.contatos.map((c) => {
    const row: Record<string, unknown> = {
      id: c.id,
      nome: c.nome,
      colunaId: c.colunaId,
      criadoEm: c.criadoEm,
      automacaoAtiva: c.automacaoAtiva,
    };
    if (c.email) row.email = c.email;
    if (c.telefone) row.telefone = c.telefone;
    if (c.ddi && c.ddi !== '+55') row.ddi = c.ddi;
    else if (c.telefone) row.ddi = c.ddi || '+55';
    if (c.origem) row.origem = c.origem;
    if (c.valorOportunidade) row.valorOportunidade = c.valorOportunidade;
    if (c.responsavel) row.responsavel = c.responsavel;
    if (c.responsavelUsuarioId != null) row.responsavelUsuarioId = c.responsavelUsuarioId;
    if (c.tags?.length) row.tags = c.tags;
    if (c.chatwootContactId) row.chatwootContactId = c.chatwootContactId;
    return row;
  });

  const payload = JSON.stringify({ ok: true, colunas: board.colunas, contatos });
  const accept = String(req.headers['accept-encoding'] || '');
  if (accept.includes('gzip')) {
    const buf = gzipSync(Buffer.from(payload), { level: 6 });
    return reply
      .header('Content-Encoding', 'gzip')
      .type('application/json; charset=utf-8')
      .send(buf);
  }
  return reply.type('application/json; charset=utf-8').send(payload);
}
