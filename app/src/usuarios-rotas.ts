/**
 * Rotas de CRUD de usuarios do painel.
 * Espelha create/delete/status com o Atendimento (account Tilit).
 */
import type { FastifyInstance } from 'fastify';
import {
  abasDisponiveisApp,
  alterarSenhaUsuario,
  atualizarUsuario,
  criarUsuario,
  excluirUsuario,
  obterCredenciaisParaCopia,
  obterUsuarioPorId,
  paraPublico,
  type RolePainel,
} from './usuarios-store.js';
import { listarUsuariosComDepartamentos } from './usuarios-sync-agents.js';
import {
  desprovisionarAtendimento,
  desprovisionarAtendimentoDoUsuario,
  provisionarAtendimento,
  resolverAtendimentoUserId,
} from './usuarios-atendimento-sync.js';
import { atualizarUsuarioChatwoot } from './chatwoot-usuarios.js';
import {
  departamentosDoUsuarioChatwoot,
  listarDepartamentosChatwoot,
  sincronizarDepartamentosUsuario,
} from './chatwoot-departamentos.js';
import { erroPub, exigirAdmin, parseDepartamentoIds } from './usuarios-rotas-helpers.js';
import { sincronizarEspelhoAtendimentoAposPatch } from './usuarios-rotas-sync.js';

export async function rotasUsuariosPainel(app: FastifyInstance): Promise<void> {
  app.get('/api/ia/usuarios/abas', async () => ({ ok: true, abas: [...abasDisponiveisApp()] }));

  app.get('/api/ia/usuarios/departamentos', async (req, reply) => {
    if (!(await exigirAdmin(req, reply))) return;
    const res = await listarDepartamentosChatwoot();
    if (!res.ok) {
      return reply.code(502).send({ ok: false, erro: erroPub(res.motivo || 'falha departamentos') });
    }
    return { ok: true, departamentos: res.departamentos };
  });

  app.get('/api/ia/usuarios/:id/departamentos', async (req, reply) => {
    if (!(await exigirAdmin(req, reply))) return;
    const userId = Number((req.params as { id: string }).id);
    if (!userId) return reply.code(400).send({ ok: false, erro: 'id invalido' });
    const u = await obterUsuarioPorId(userId);
    if (!u) return reply.code(404).send({ ok: false, erro: 'Usuario nao encontrado' });
    const cwId = await resolverAtendimentoUserId({
      id: u.id,
      email: u.email,
      chatwootUserId: u.chatwoot_user_id,
    });
    if (!cwId) return { ok: true, team_ids: [], atendimento_user_id: null };
    const res = await departamentosDoUsuarioChatwoot(cwId);
    if (!res.ok) {
      return reply.code(502).send({ ok: false, erro: erroPub(res.motivo || 'falha_membros') });
    }
    return { ok: true, team_ids: res.team_ids, atendimento_user_id: cwId };
  });

  app.get('/api/ia/usuarios', async (req, reply) => {
    if (!(await exigirAdmin(req, reply))) return;
    const res = await listarUsuariosComDepartamentos();
    return {
      ok: true,
      usuarios: res.usuarios,
      sync: res.sync || null,
      aviso: res.motivo ? erroPub(res.motivo) : null,
    };
  });

  app.get('/api/ia/usuarios/:id/credenciais', async (req, reply) => {
    if (!(await exigirAdmin(req, reply))) return;
    const userId = Number((req.params as { id: string }).id);
    if (!userId) return reply.code(400).send({ ok: false, erro: 'id invalido' });
    try {
      // regenerar só se admin pediu cópia e não há cofre — NUNCA puxa senha do Atendimento
      const cred = await obterCredenciaisParaCopia(userId, { regenerarSeSemCofre: true });
      let atendimento: { ok: boolean; motivo?: string } | null = null;
      const u = await obterUsuarioPorId(userId);
      if (cred.gerada && u?.chatwoot_user_id) {
        const r = await atualizarUsuarioChatwoot(u.chatwoot_user_id, { senha: cred.senha });
        atendimento = { ok: r.ok, motivo: erroPub(r.motivo || (r.ok ? 'ok' : 'falha')) };
      }
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '')
        .split(',')[0]
        ?.trim();
      const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0]?.trim();
      const urlPainel = host ? `${proto}://${host}/` : '/';
      return {
        ok: true,
        email: cred.email,
        senha: cred.senha,
        nome: cred.nome,
        gerada: cred.gerada,
        texto: `Painel: ${urlPainel}\nNome: ${cred.nome}\nE-mail: ${cred.email}\nSenha: ${cred.senha}`,
        atendimento,
      };
    } catch (err) {
      return reply.code(400).send({
        ok: false,
        erro: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.post('/api/ia/usuarios', async (req, reply) => {
    const admin = await exigirAdmin(req, reply);
    if (!admin) return;
    const body = (req.body ?? {}) as {
      email?: string;
      nome?: string;
      senha?: string;
      role?: RolePainel;
      abas?: string[];
      departamento_ids?: unknown;
    };
    const email = String(body.email || '').trim();
    const nome = String(body.nome || '').trim();
    const senha = String(body.senha || '');
    const deptIds = parseDepartamentoIds(body.departamento_ids);
    if (!email || !nome || !senha) {
      return reply.code(400).send({ ok: false, erro: 'nome, email e senha obrigatorios' });
    }

    const atend = await provisionarAtendimento({
      nome,
      email,
      senha,
      role: body.role === 'admin' ? 'admin' : 'agente',
    });
    if (!atend.ok || !atend.userId) {
      return reply.code(502).send({
        ok: false,
        erro: erroPub(atend.motivo || 'Falha ao criar usuario no Atendimento'),
        atendimento: { ok: false, motivo: erroPub(atend.motivo) },
      });
    }

    try {
      const usuario = await criarUsuario({
        email,
        nome,
        senha,
        role: body.role === 'admin' ? 'admin' : 'agente',
        abas: body.abas,
        chatwoot_user_id: atend.userId,
      });
      let departamentos: Awaited<ReturnType<typeof sincronizarDepartamentosUsuario>> | null = null;
      if (deptIds && deptIds.length > 0) {
        departamentos = await sincronizarDepartamentosUsuario(atend.userId, deptIds);
        if (departamentos && !departamentos.ok) {
          departamentos = { ...departamentos, motivo: erroPub(departamentos.motivo) };
        }
      }
      return {
        ok: true,
        usuario,
        atendimento: { ok: true, userId: atend.userId, motivo: atend.motivo },
        departamentos,
      };
    } catch (err) {
      await desprovisionarAtendimento(atend.userId).catch(() => undefined);
      return reply.code(400).send({
        ok: false,
        erro: err instanceof Error ? err.message : String(err),
        atendimento: { ok: true, userId: atend.userId, motivo: 'Rollback do Atendimento feito.' },
      });
    }
  });

  app.patch('/api/ia/usuarios/:id', async (req, reply) => {
    const admin = await exigirAdmin(req, reply);
    if (!admin) return;
    const userId = Number((req.params as { id: string }).id);
    if (!userId) return reply.code(400).send({ ok: false, erro: 'id invalido' });

    const body = (req.body ?? {}) as {
      nome?: string;
      role?: RolePainel;
      abas?: string[];
      ativo?: boolean;
      senha?: string;
      sync_chatwoot?: boolean;
      departamento_ids?: unknown;
    };

    const antes = await obterUsuarioPorId(userId);
    if (!antes) return reply.code(404).send({ ok: false, erro: 'Usuario nao encontrado' });
    const cwId = await resolverAtendimentoUserId({
      id: antes.id,
      email: antes.email,
      chatwootUserId: antes.chatwoot_user_id,
    });

    const deptIds = parseDepartamentoIds(body.departamento_ids);
    if (deptIds && deptIds.length > 0 && !cwId) {
      return reply.code(400).send({
        ok: false,
        erro: 'Usuario sem vinculo no Atendimento — nao da para associar departamentos.',
      });
    }

    try {
      const usuario = await atualizarUsuario(userId, {
        nome: body.nome,
        role: body.role,
        abas: body.abas,
        ativo: body.ativo,
        senha: body.senha,
        chatwoot_user_id: cwId,
      });

      const atendimento = await sincronizarEspelhoAtendimentoAposPatch({
        antes,
        usuario,
        cwId,
        body,
      });

      let departamentos: Awaited<ReturnType<typeof sincronizarDepartamentosUsuario>> | null = null;
      const idDept = usuario.chatwoot_user_id || cwId;
      if (deptIds !== undefined && idDept) {
        departamentos = await sincronizarDepartamentosUsuario(idDept, deptIds);
        if (departamentos && !departamentos.ok) {
          departamentos = { ...departamentos, motivo: erroPub(departamentos.motivo) };
        }
      }

      return { ok: true, usuario, atendimento, departamentos };
    } catch (err) {
      return reply.code(400).send({
        ok: false,
        erro: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.delete('/api/ia/usuarios/:id', async (req, reply) => {
    const admin = await exigirAdmin(req, reply);
    if (!admin) return;
    const userId = Number((req.params as { id: string }).id);
    const alvo = await obterUsuarioPorId(userId);
    if (!alvo) return reply.code(404).send({ ok: false, erro: 'Usuario nao encontrado' });

    const atendimento = await desprovisionarAtendimentoDoUsuario({
      chatwootUserId: alvo.chatwoot_user_id,
      email: alvo.email,
    });
    if (!atendimento.ok) {
      return reply.code(502).send({
        ok: false,
        erro: erroPub(
          atendimento.motivo ||
            'Nao foi possivel remover o usuario no Atendimento. Painel nao foi apagado.',
        ),
        atendimento: { ...atendimento, motivo: erroPub(atendimento.motivo) },
      });
    }

    try {
      await excluirUsuario(userId, admin.id);
      return {
        ok: true,
        atendimento: { ...atendimento, motivo: erroPub(atendimento.motivo || 'ok') },
      };
    } catch (err) {
      return reply.code(400).send({
        ok: false,
        erro: err instanceof Error ? err.message : String(err),
        atendimento: { ...atendimento, motivo: erroPub(atendimento.motivo) },
      });
    }
  });
}

export { alterarSenhaUsuario, paraPublico };
