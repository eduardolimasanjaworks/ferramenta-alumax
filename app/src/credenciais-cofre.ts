/**
 * Cofre de senhas do painel — AES-GCM para o admin copiar credenciais.
 * Hash de login continua separado; aqui só espelho criptografado.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { config } from './config.js';

function chaveAes(): Buffer {
  const raw =
    config.adminKey ||
    process.env.IAMINASPLACA_ADMIN_KEY ||
    process.env.CREDENCIAIS_COFRE_KEY ||
    'tilit-cofre-dev';
  return createHash('sha256').update(String(raw)).digest();
}

export function cifrarSenhaCofre(senha: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', chaveAes(), iv);
  const enc = Buffer.concat([cipher.update(senha, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decifrarSenhaCofre(blob: string): string | null {
  try {
    const [ver, ivHex, tagHex, dataHex] = String(blob || '').split(':');
    if (ver !== 'v1' || !ivHex || !tagHex || !dataHex) return null;
    const decipher = createDecipheriv('aes-256-gcm', chaveAes(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]);
    return plain.toString('utf8');
  } catch {
    return null;
  }
}

export function gerarSenhaProvisoria(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
  const bytes = randomBytes(12);
  let s = '';
  for (let i = 0; i < 12; i++) s += chars[bytes[i]! % chars.length];
  return s;
}
