/**
 * Rotas REST das Campanhas — CRUD, agendar/pausar e meta (tags/instâncias).
 * Autenticado com o mesmo cookie do painel.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { obterUsuarioDaSessao } from './auth-minasplaca.js';
import {
  contarContatosPorTag,
  excluirCampanhaDb,
  inicializarBancoCampanhas,
  listarCampanhasDb,
  listarTagsCampanha,
  obterCampanha,
  setStatusCampanha,
  upsertCampanha,
} from './campanhas-pg.js';
import { cancelarJobsPendentes, criarJobsDisparo } from './campanhas-fila.js';
import { processarJobsCampanhas } from './campanhas-jobs.js';
import type { CampanhaRow } from './campanhas-tipos.js';
import { resolverInstancia } from './whatsapp-rotas.js';
import { listarTemplatesMeta, criarTemplateMeta } from './lib/meta-api.js';

async function exigirLogado(req: FastifyRequest, reply: FastifyReply) {
  const u = await obterUsuarioDaSessao(req);
  if (!u) {
    reply.code(401).send({ ok: false, erro: 'Nao autenticado' });
    return null;
  }
  return u;
}

function bodyCampanha(raw: unknown): Partial<CampanhaRow> & { nome: string } {
  const b = (raw ?? {}) as Record<string, unknown>;
  return {
    id: b.id ? String(b.id) : undefined,
    nome: String(b.nome || '').trim(),
    tag: b.tag != null ? String(b.tag) : undefined,
    instancia: b.instancia != null ? String(b.instancia) : undefined,
    modo: (b.modo === 'template' ? 'template' : b.modo === 'meta_template' ? 'meta_template' : 'livre') as 'livre' | 'template' | 'meta_template',
    metaTemplateName: b.metaTemplateName != null ? String(b.metaTemplateName) : undefined,
    metaTemplateLang: b.metaTemplateLang != null ? String(b.metaTemplateLang) : undefined,
    mensagens: Array.isArray(b.mensagens)
      ? (b.mensagens as CampanhaRow['mensagens'])
      : undefined,
    delayMinSec: b.delayMinSec != null ? Number(b.delayMinSec) : undefined,
    delayMaxSec: b.delayMaxSec != null ? Number(b.delayMaxSec) : undefined,
    usarHorarios: b.usarHorarios != null ? Boolean(b.usarHorarios) : undefined,
    horarioInicio: b.horarioInicio != null ? String(b.horarioInicio) : undefined,
    horarioFim: b.horarioFim != null ? String(b.horarioFim) : undefined,
    agendadoEm: b.agendadoEm != null ? String(b.agendadoEm) : undefined,
    status: b.status as CampanhaRow['status'] | undefined,
  };
}

export async function rotasCampanhas(app: FastifyInstance): Promise<void> {
  await inicializarBancoCampanhas().catch((e) => console.warn('[campanhas] db offline:', e.message));

  app.get('/api/campanhas', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    const campanhas = await listarCampanhasDb();
    return { ok: true, campanhas };
  });

  app.post('/api/campanhas', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    const body = bodyCampanha(req.body);
    if (!body.nome) return reply.code(400).send({ ok: false, erro: 'nome obrigatorio' });
    const campanha = await upsertCampanha({ ...body, status: body.status || 'rascunho' });
    return { ok: true, campanha };
  });

  app.put('/api/campanhas/:id', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    const { id } = req.params as { id: string };
    const body = bodyCampanha(req.body);
    if (!body.nome) return reply.code(400).send({ ok: false, erro: 'nome obrigatorio' });
    const campanha = await upsertCampanha({ ...body, id });
    return { ok: true, campanha };
  });

  app.delete('/api/campanhas/:id', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    const { id } = req.params as { id: string };
    const ok = await excluirCampanhaDb(id);
    if (!ok) return reply.code(404).send({ ok: false, erro: 'nao encontrada' });
    return { ok: true };
  });

  app.post('/api/campanhas/:id/agendar', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    const { id } = req.params as { id: string };
    const c = await obterCampanha(id);
    if (!c) return reply.code(404).send({ ok: false, erro: 'nao encontrada' });
    try {
      resolverInstancia(c.instancia);
      const jobs = await criarJobsDisparo(c);
      const campanha = await obterCampanha(id);
      return { ok: true, jobs, campanha };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.code(400).send({ ok: false, erro: msg });
    }
  });

  /** Dispara na hora: remonta a fila com enviar_em ≈ agora. */
  app.post('/api/campanhas/:id/enviar-agora', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    const { id } = req.params as { id: string };
    const c = await obterCampanha(id);
    if (!c) return reply.code(404).send({ ok: false, erro: 'nao encontrada' });
    try {
      resolverInstancia(c.instancia);
      // Sempre remonta a fila (mesmo se estava em andamento / falhou).
      const jobs = await criarJobsDisparo(c, { agora: true });
      const campanha = await obterCampanha(id);
      return { ok: true, jobs, campanha };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.code(400).send({ ok: false, erro: msg });
    }
  });

  app.post('/api/campanhas/:id/pausar', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    const { id } = req.params as { id: string };
    await cancelarJobsPendentes(id);
    const campanha = await setStatusCampanha(id, 'pausada');
    if (!campanha) return reply.code(404).send({ ok: false, erro: 'nao encontrada' });
    return { ok: true, campanha };
  });

  app.post('/api/campanhas/tick', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    const processados = await processarJobsCampanhas();
    return { ok: true, processados };
  });

  app.get('/api/campanhas/meta/tags', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    const tags = await listarTagsCampanha();
    return { ok: true, tags };
  });

  app.get('/api/campanhas/meta/instancias', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    const { listaInstanciasWa } = await import('./lib/whatsapp-instancias.js');
    const instancias = listaInstanciasWa().map((i) => ({
      name: i.name,
      label: i.label,
      provider: i.provider,
    }));
    return { ok: true, instancias };
  });

  app.get('/api/campanhas/meta/estimar', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    const q = (req.query ?? {}) as { tag?: string };
    const total = await contarContatosPorTag(String(q.tag || ''));
    return { ok: true, total };
  });

  // Endpoints para gerenciamento oficial do Meta (WABA)
  app.get('/api/campanhas/meta-templates', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    try {
      const templates = await listarTemplatesMeta();
      return { ok: true, templates };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.code(400).send({ ok: false, erro: msg });
    }
  });

  app.post('/api/campanhas/meta-templates', async (req, reply) => {
    if (!(await exigirLogado(req, reply))) return;
    const body = (req.body ?? {}) as { name: string; category: 'MARKETING' | 'UTILITY'; text: string; language?: string };
    try {
      const res = await criarTemplateMeta(body.name, body.category, body.text, body.language);
      return { ok: true, resultado: res };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.code(400).send({ ok: false, erro: msg });
    }
  });
}
