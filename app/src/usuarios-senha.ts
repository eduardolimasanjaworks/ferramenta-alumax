/**
 * Hash scrypt do login do painel (salt:hash).
 * Separado do store para reuso no bootstrap e nas rotas.
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashSenha(senha: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verificarSenha(senha: string, armazenado: string): boolean {
  const [salt, hash] = armazenado.split(':');
  if (!salt || !hash) return false;
  const calc = scryptSync(senha, salt, 64);
  const alvo = Buffer.from(hash, 'hex');
  return calc.length === alvo.length && timingSafeEqual(calc, alvo);
}
