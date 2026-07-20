/**
 * SSO do Atendimento no embed Conversas.
 * Sempre o agent vinculado ao usuário logado (chatwoot_user_id / e-mail) — nunca outro.
 */
import type { FastifyInstance } from 'fastify';
import { config } from './config.js';
import { obterUsuarioDaSessao } from './auth-minasplaca.js';
import { ssoUrlParaUsuario } from './chatwoot-sso-login.js';
import { usuarioTemAba } from './usuarios-store.js';
import { resolverAtendimentoUserId } from './usuarios-atendimento-sync.js';
import { mensagemPublicaAtendimento } from './mensagens-publicas.js';

export async function rotasChatwootSso(app: FastifyInstance): Promise<void> {
  app.get('/api/chatwoot/sso', async (req, reply) => {
    const usuario = await obterUsuarioDaSessao(req);
    if (!usuario) {
      return reply.status(401).send({ ok: false, erro: 'Nao autenticado' });
    }
    if (!usuarioTemAba(usuario, 'conversas')) {
      return reply.status(403).send({ ok: false, erro: 'Sem permissao para Conversas' });
    }

    if (!config.chatwootPlatformToken) {
      return reply.status(503).send({ ok: false, erro: 'Atendimento SSO nao configurado' });
    }

    const cwUserId = await resolverAtendimentoUserId({
      id: usuario.id,
      email: usuario.email,
      chatwootUserId: usuario.chatwoot_user_id,
    });

    if (!cwUserId) {
      return reply.status(503).send({
        ok: false,
        erro: 'Seu usuario ainda nao esta vinculado ao Atendimento',
      });
    }

    const sso = await ssoUrlParaUsuario(cwUserId, {
      email: usuario.email,
      nome: usuario.nome,
    });
    if (!sso.ok || !sso.iframeUrl) {
      return reply.status(502).send({
        ok: false,
        erro: mensagemPublicaAtendimento(sso.motivo || 'sso_failed'),
      });
    }
    return { ok: true, iframeUrl: sso.iframeUrl, atendimentoUserId: cwUserId };
  });
}
