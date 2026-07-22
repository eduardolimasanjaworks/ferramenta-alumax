/**
 * Fila de disparo WhatsApp das campanhas (jobs + claim + horários BR).
 * Separado do CRUD para manter arquivos ≤300 linhas.
 */
import { randomUUID } from 'node:crypto';
import {
  obterCampanha,
  poolCampanhas,
  setStatusCampanha,
  telefonesPorTag,
} from './campanhas-pg.js';
import { delayAleatorioSec } from './campanhas-horario.js';
import type { CampanhaRow, JobStatus, MensagemCampanha } from './campanhas-tipos.js';

export async function criarJobsDisparo(
  campanha: CampanhaRow,
  opts?: { agora?: boolean },
): Promise<number> {
  const pool = poolCampanhas();
  const tels = await telefonesPorTag(campanha.tag);
  if (!tels.length) throw new Error('Nenhum contato com telefone nesta tag');
  if (!campanha.mensagens.length) throw new Error('Campanha sem mensagens');

  await pool.query(
    // Nova fila = recomeça contagem (evita 0/8 → 0/9 com jobs velhos em erro).
    `DELETE FROM campanha_jobs WHERE campanha_id = $1`,
    [campanha.id],
  );

  let cursor = opts?.agora
    ? Date.now() + 3_000
    : campanha.agendadoEm
      ? new Date(campanha.agendadoEm).getTime()
      : Date.now() + 15_000;

  // Se a data agendada já passou, dispara em breve.
  if (!opts?.agora && cursor < Date.now()) cursor = Date.now() + 3_000;

  let n = 0;
  for (const tel of tels) {
    for (let mi = 0; mi < campanha.mensagens.length; mi++) {
      const id = `cj-${randomUUID().slice(0, 10)}`;
      await pool.query(
        `INSERT INTO campanha_jobs (id, campanha_id, telefone, mensagem_idx, status, enviar_em)
         VALUES ($1,$2,$3,$4,'pendente',$5)`,
        [id, campanha.id, tel, mi, new Date(cursor)],
      );
      n++;
      cursor += delayAleatorioSec(campanha.delayMinSec, campanha.delayMaxSec) * 1000;
    }
  }
  await setStatusCampanha(campanha.id, 'agendada');
  return n;
}

export async function cancelarJobsPendentes(campanhaId: string): Promise<void> {
  await poolCampanhas().query(
    `UPDATE campanha_jobs SET status = 'cancelado'
     WHERE campanha_id = $1 AND status IN ('pendente','enviando')`,
    [campanhaId],
  );
}

export type JobPendente = {
  id: string;
  campanhaId: string;
  telefone: string;
  mensagemIdx: number;
  instancia: string;
  texto: string;
  usarHorarios: boolean;
  horarioInicio: string | null;
  horarioFim: string | null;
  modo: 'livre' | 'template' | 'meta_template';
  metaTemplateName?: string;
  metaTemplateLang?: string;
};

export { estaDentroHorario, minutosAgoraBrasilia } from './campanhas-horario.js';

export async function claimJobsPendentes(limite = 5): Promise<JobPendente[]> {
  const pool = poolCampanhas();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT j.id, j.campanha_id, j.telefone, j.mensagem_idx,
              c.instancia, c.mensagens, c.usar_horarios, c.horario_inicio, c.horario_fim,
              c.modo, c.meta_template_name, c.meta_template_lang
       FROM campanha_jobs j
       JOIN campanhas c ON c.id = j.campanha_id
       WHERE j.status = 'pendente'
         AND j.enviar_em <= NOW()
         AND c.status IN ('agendada', 'em_andamento')
       ORDER BY j.enviar_em ASC
       FOR UPDATE OF j SKIP LOCKED
       LIMIT $1`,
      [limite],
    );
    const out: JobPendente[] = [];
    for (const r of rows) {
      const msgs = Array.isArray(r.mensagens) ? (r.mensagens as MensagemCampanha[]) : [];
      const msg = msgs[Number(r.mensagem_idx)] || msgs[0];
      if (!msg?.texto?.trim()) {
        await client.query(
          `UPDATE campanha_jobs SET status = 'erro', erro = 'sem texto' WHERE id = $1`,
          [r.id],
        );
        continue;
      }
      await client.query(
        `UPDATE campanha_jobs SET status = 'enviando' WHERE id = $1`,
        [r.id],
      );
      await client.query(
        `UPDATE campanhas SET status = 'em_andamento', atualizado_em = NOW()
         WHERE id = $1 AND status = 'agendada'`,
        [r.campanha_id],
      );
      out.push({
        id: String(r.id),
        campanhaId: String(r.campanha_id),
        telefone: String(r.telefone),
        mensagemIdx: Number(r.mensagem_idx),
        instancia: String(r.instancia),
        texto: String(msg.texto),
        usarHorarios: Boolean(r.usar_horarios),
        horarioInicio: r.horario_inicio ? String(r.horario_inicio) : null,
        horarioFim: r.horario_fim ? String(r.horario_fim) : null,
        modo: (r.modo === 'template' ? 'template' : r.modo === 'meta_template' ? 'meta_template' : 'livre') as 'livre' | 'template' | 'meta_template',
        metaTemplateName: r.meta_template_name ? String(r.meta_template_name) : undefined,
        metaTemplateLang: r.meta_template_lang ? String(r.meta_template_lang) : undefined,
      });
    }
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function marcarJob(
  id: string,
  status: JobStatus,
  erro?: string,
): Promise<void> {
  await poolCampanhas().query(
    `UPDATE campanha_jobs
     SET status = $2,
         enviado_em = CASE WHEN $2 = 'enviado' THEN NOW() ELSE enviado_em END,
         erro = $3
     WHERE id = $1`,
    [id, status, erro ?? null],
  );
}

export async function adiarJob(id: string, quando: Date): Promise<void> {
  await poolCampanhas().query(
    `UPDATE campanha_jobs SET status = 'pendente', enviar_em = $2, erro = NULL WHERE id = $1`,
    [id, quando],
  );
}

export async function finalizarCampanhaSeConcluida(campanhaId: string): Promise<void> {
  const { rows } = await poolCampanhas().query(
    `SELECT
       COUNT(*) FILTER (WHERE status IN ('pendente','enviando'))::int AS pend,
       COUNT(*)::int AS total
     FROM campanha_jobs WHERE campanha_id = $1`,
    [campanhaId],
  );
  if (Number(rows[0]?.pend ?? 0) === 0 && Number(rows[0]?.total ?? 0) > 0) {
    await setStatusCampanha(campanhaId, 'concluida');
  }
}

export async function obterCampanhaParaAgendar(id: string): Promise<CampanhaRow | null> {
  return obterCampanha(id);
}
