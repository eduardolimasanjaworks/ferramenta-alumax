/**
 * Rotas da fila de atendimento: toggle global + config de filas/membros.
 * Vocabulário da API: "fila" / "atendente" — sem termos de plataforma.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { obterUsuarioDaSessao } from './auth-minasplaca.js';
import {
  filaAtendimentoHabilitada,
  inicializarFilaAtendimento,
  setFilaAtendimentoHabilitada,
} from './fila-atendimento.js';
import {
  atualizarMembrosFila,
  atualizarRegraFila,
  criarFila,
  excluirFila,
  inicializarFilaConfig,
  listarFilasComMembros,
} from './fila-config.js';
import { mensagemPublicaAtendimento } from './mensagens-publicas.js';

async function exigirAdmin(req: FastifyRequest, reply: FastifyReply) {
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

export async function rotasFilaAtendimento(app: FastifyInstance): Promise<void> {
  await inicializarFilaAtendimento();
  await inicializarFilaConfig();

  app.get('/api/ia/fila-atendimento', async () => {
    const habilitada = await filaAtendimentoHabilitada();
    return { ok: true, habilitada };
  });

  app.post('/api/ia/fila-atendimento', async (req, reply) => {
    if (!(await exigirAdmin(req, reply))) return;
    const body = (req.body ?? {}) as { habilitada?: boolean };
    if (typeof body.habilitada !== 'boolean') {
      return reply.code(400).send({ ok: false, erro: 'habilitada boolean obrigatorio' });
    }
    const habilitada = await setFilaAtendimentoHabilitada(body.habilitada);
    return { ok: true, habilitada };
  });

  app.get('/api/ia/fila-atendimento/filas', async (req, reply) => {
    if (!(await exigirAdmin(req, reply))) return;
    const res = await listarFilasComMembros();
    if (!res.ok) {
      return reply.code(502).send({
        ok: false,
        erro: mensagemPublicaAtendimento(res.motivo || 'falha filas'),
      });
    }
    return { ok: true, filas: res.filas, agents: res.agents };
  });

  app.post('/api/ia/fila-atendimento/filas', async (req, reply) => {
    if (!(await exigirAdmin(req, reply))) return;
    const body = (req.body ?? {}) as { nome?: string };
    const res = await criarFila(String(body.nome || ''));
    if (!res.ok || !res.fila) {
      return reply.code(400).send({
        ok: false,
        erro: mensagemPublicaAtendimento(res.motivo || 'nao foi possivel criar a fila'),
      });
    }
    return { ok: true, fila: res.fila };
  });

  app.put('/api/ia/fila-atendimento/filas/:id/membros', async (req, reply) => {
    if (!(await exigirAdmin(req, reply))) return;
    const teamId = Number((req.params as { id: string }).id);
    if (!teamId) return reply.code(400).send({ ok: false, erro: 'id invalido' });
    const body = (req.body ?? {}) as {
      membros?: Array<{ id?: number; telefone?: string }>;
    };
    const membros = Array.isArray(body.membros)
      ? body.membros
          .map((m) => ({ id: Number(m.id), telefone: m.telefone }))
          .filter((m) => m.id > 0)
      : [];
    const res = await atualizarMembrosFila(teamId, membros);
    if (!res.ok) {
      return reply.code(502).send({
        ok: false,
        erro: mensagemPublicaAtendimento(res.motivo || 'falha ao salvar membros'),
      });
    }
    return { ok: true };
  });

  app.patch('/api/ia/fila-atendimento/filas/:id', async (req, reply) => {
    if (!(await exigirAdmin(req, reply))) return;
    const teamId = Number((req.params as { id: string }).id);
    if (!teamId) return reply.code(400).send({ ok: false, erro: 'id invalido' });
    const body = (req.body ?? {}) as { quando_transferir?: string };
    if (typeof body.quando_transferir !== 'string') {
      return reply.code(400).send({
        ok: false,
        erro: 'quando_transferir (texto) e obrigatorio',
      });
    }
    const res = await atualizarRegraFila(teamId, body.quando_transferir);
    if (!res.ok) {
      return reply.code(502).send({
        ok: false,
        erro: mensagemPublicaAtendimento(res.motivo || 'falha ao salvar regra'),
      });
    }
    return { ok: true };
  });

  app.delete('/api/ia/fila-atendimento/filas/:id', async (req, reply) => {
    if (!(await exigirAdmin(req, reply))) return;
    const teamId = Number((req.params as { id: string }).id);
    if (!teamId) return reply.code(400).send({ ok: false, erro: 'id invalido' });
    const res = await excluirFila(teamId);
    if (!res.ok) {
      return reply.code(502).send({
        ok: false,
        erro: mensagemPublicaAtendimento(res.motivo || 'nao foi possivel apagar a fila'),
      });
    }
    return { ok: true };
  });
}
