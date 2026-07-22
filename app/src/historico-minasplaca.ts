/**
 * Histórico de conversas (Postgres) — Minas Placa.
 * Armazena mensagens trocadas no WhatsApp (user e assistant) e respostas de atendentes.
 */
import pg from 'pg';
import { config } from './config.js';
import { canonizarTelefoneBr, telefoneEhContatoValido, variantesTelefoneBr } from './util/telefone.js';
import type { RegistroHistorico } from './lib/tipos.js';

const pool = new pg.Pool({ connectionString: config.databaseUrl });

export async function inicializarBancoHistorico(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historico_conversa (
        id BIGSERIAL PRIMARY KEY,
        telefone TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_historico_telefone_ts ON historico_conversa (telefone, timestamp DESC);
    `);
  } catch (err) {
    console.warn('[historico] AVISO: Banco de dados indisponível no momento.');
  }
}

function mapRow(r: { role: string; content: string; timestamp: Date }): RegistroHistorico {
  const role = r.role === 'user' || r.role === 'assistant' ? r.role : 'assistant';
  const prefix = r.role === 'atendente' ? '[Atendente humano]: ' : '';
  return {
    role,
    content: `${prefix}${r.content}`,
    timestamp: new Date(r.timestamp).getTime(),
  };
}

async function obterMensagensProativas(variantes: string[], limite = 3): Promise<RegistroHistorico[]> {
  try {
    const res = await pool.query(
      `SELECT tipo, mensagem, criado_em FROM notificacao_fila
       WHERE telefone = ANY($1) AND status = 'enviada'
       ORDER BY criado_em DESC
       LIMIT $2`,
      [variantes, limite],
    );

    return res.rows.map((r) => {
      const rotulo = String(r.tipo || 'notificacao').replace(/_/g, ' ');
      return {
        role: 'assistant' as const,
        content: `[Mensagem proativa enviada pelo sistema (${rotulo})]: ${r.mensagem}`,
        timestamp: new Date(r.criado_em as string).getTime(),
      };
    });
  } catch {
    return [];
  }
}

function mesclarHistorico(
  mensagens: RegistroHistorico[],
  proativas: RegistroHistorico[],
): RegistroHistorico[] {
  const chaves = new Set(
    mensagens.map((m) => `${m.role}:${m.content.slice(0, 120)}`),
  );
  const extras: RegistroHistorico[] = [];
  for (const p of proativas) {
    const chave = `assistant:${p.content.slice(0, 120)}`;
    const chaveSemPrefixo = `assistant:${p.content.replace(/^\[Mensagem proativa[^\]]*\]\n/, '').slice(0, 120)}`;
    const jaTem = [...chaves].some(
      (k) => k.includes(chaveSemPrefixo.slice(10)) || chaveSemPrefixo.includes(k.slice(10)),
    );
    if (!chaves.has(chave) && !jaTem) {
      extras.push(p);
      chaves.add(chave);
    }
  }
  return [...mensagens, ...extras].sort((a, b) => a.timestamp - b.timestamp);
}

export async function obterHistorico(telefone: string, limite = 20): Promise<RegistroHistorico[]> {
  try {
    const canon = canonizarTelefoneBr(telefone);
    const variantes = variantesTelefoneBr(telefone);

    const res = await pool.query(
      `SELECT role, content, timestamp FROM historico_conversa
       WHERE telefone = ANY($1)
       ORDER BY timestamp DESC
       LIMIT $2`,
      [variantes, limite],
    );

    const mensagens = res.rows.map(mapRow).reverse();
    const proativas = await obterMensagensProativas(variantes, 3);
    return mesclarHistorico(mensagens, proativas);
  } catch {
    return [];
  }
}

export async function adicionarAoHistorico(
  telefone: string,
  mensagens: Array<{ role: 'user' | 'assistant' | 'atendente'; content: string; timestamp: number }>,
): Promise<void> {
  try {
    const canon = canonizarTelefoneBr(telefone);
    for (const m of mensagens) {
      await pool.query(
        'INSERT INTO historico_conversa (telefone, role, content, timestamp) VALUES ($1, $2, $3, $4)',
        [canon, m.role, m.content, new Date(m.timestamp).toISOString()],
      );
    }
  } catch {
    /* db offline - ignora persistencia em historico sem travar envio no canal */
  }
}

export interface ConversaIniciada {
  telefone: string;
  ultima_msg: string;
  total_mensagens: number;
  pausada: boolean;
}

/** Conversas com histórico recente + estado de pausa por contato. */
export async function listarConversasIniciadas(dias = 90): Promise<ConversaIniciada[]> {
  const diasNum = Math.min(365, Math.max(1, Number(dias) || 90));
  try {
    const res = await pool.query(
      `SELECT telefone, MAX(timestamp) AS ultima_msg, COUNT(*)::int AS total
       FROM historico_conversa
       WHERE timestamp > NOW() - ($1::text || ' days')::interval
       GROUP BY telefone
       ORDER BY ultima_msg DESC`,
      [String(diasNum)],
    );

    const mapa = new Map<string, { ultima_msg: Date; total: number }>();
    for (const row of res.rows) {
      const canon = canonizarTelefoneBr(String(row.telefone ?? ''));
      if (!telefoneEhContatoValido(canon)) continue;
      const ultima = new Date(row.ultima_msg as string);
      const total = Number(row.total) || 0;
      const existente = mapa.get(canon);
      if (!existente || ultima > existente.ultima_msg) {
        mapa.set(canon, {
          ultima_msg: ultima,
          total: (existente?.total || 0) + total,
        });
      }
    }

    const { obterEstadoPausa } = await import('./pausa-minasplaca.js');
    const resultado: ConversaIniciada[] = [];
    for (const [tel, v] of mapa.entries()) {
      const est = await obterEstadoPausa(tel);
      resultado.push({
        telefone: tel,
        ultima_msg: v.ultima_msg.toISOString(),
        total_mensagens: v.total,
        pausada: est?.pausada === true,
      });
    }
    resultado.sort((a, b) => new Date(b.ultima_msg).getTime() - new Date(a.ultima_msg).getTime());
    return resultado;
  } catch (err) {
    console.warn('[historico] DB offline em listarConversasIniciadas');
    return [];
  }
}
