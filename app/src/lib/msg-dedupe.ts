/**
 * Dedup de messageId (Redis) — evita processar o mesmo webhook 2x.
 * TTL curto: mensagens reenviadas depois de minutos passam.
 */
import { obterRedis } from './redis.js';

const PREFIXO = 'msg:seen:';
const TTL_SEC = 6 * 60 * 60;

/** true se a mensagem é nova (primeira vez). */
export async function marcarMensagemNova(messageId?: string | null): Promise<boolean> {
  const id = String(messageId || '').trim();
  if (!id) return true;
  const redis = obterRedis();
  const ok = await redis.set(`${PREFIXO}${id}`, '1', 'EX', TTL_SEC, 'NX');
  return ok === 'OK';
}
