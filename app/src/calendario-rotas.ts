/**
 * Rotas REST do Calendário — estado compartilhado + jobs + stubs Google.
 * Autenticado via sessão do painel (mesmo cookie).
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { obterUsuarioDaSessao } from './auth-minasplaca.js';
import {
  inicializarBancoCalendario,
  obterEstadoCalendario,
  salvarEstadoCalendario,
} from './calendario-pg.js';
import {
  processarJobsCalendario,
  sincronizarJobsDoEstado,
} from './calendario-jobs.js';
import type { CalEstado } from './calendario-tipos.js';

async function exigirLogado(req: FastifyRequest, reply: FastifyReply) {
  const u = await obterUsuarioDaSessao(req);
  if (!u) {
    reply.code(401).send({ ok: false, erro: 'Nao autenticado' });
    return null;
  }
  return u;
}

export async function rotasCalendario(app: FastifyInstance): Promise<void> {
  await inicializarBancoCalendario();

  app.get('/api/calendario/estado', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    const estado = await obterEstadoCalendario();
    return { ok: true, estado, timezone: 'America/Sao_Paulo' };
  });

  app.put('/api/calendario/estado', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    const body = (req.body ?? {}) as { estado?: CalEstado };
    if (!body.estado || typeof body.estado !== 'object') {
      return reply.code(400).send({ ok: false, erro: 'estado obrigatorio' });
    }
    const estado = await salvarEstadoCalendario(body.estado);
    const jobs = await sincronizarJobsDoEstado();
    return { ok: true, estado, jobs };
  });

  app.post('/api/calendario/jobs/sync', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    const jobs = await sincronizarJobsDoEstado();
    return { ok: true, ...jobs };
  });

  app.post('/api/calendario/jobs/tick', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    const processados = await processarJobsCalendario();
    return { ok: true, processados };
  });

  /** Stub Google: só valida presença do ID até haver credencial real. */
  app.post('/api/calendario/google/testar', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    const body = (req.body ?? {}) as { calendarId?: string };
    const id = String(body.calendarId || '').trim();
    if (!id) {
      return reply.code(400).send({ ok: false, erro: 'Informe o ID da agenda Google' });
    }
    if (!process.env.GOOGLE_CALENDAR_CREDENTIALS_JSON && !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      return {
        ok: false,
        erro:
          'Google ainda não configurado no servidor (defina GOOGLE_CALENDAR_CREDENTIALS_JSON). O ID foi aceito localmente.',
        calendarId: id,
        stub: true,
      };
    }
    return { ok: true, calendarId: id, stub: false };
  });
}
