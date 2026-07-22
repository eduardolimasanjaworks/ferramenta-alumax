/**
 * CRUD HTTP de linhas WhatsApp (Evolution + inbox Chatwoot).
 * Separado de whatsapp-rotas (status/QR) para manter arquivos curtos.
 */
import type { FastifyInstance } from 'fastify';
import { config } from './config.js';
import {
  criarInstanciaEvolution,
  excluirInstanciaEvolution,
} from './lib/evolution-instancia.js';
import {
  carregarInstanciasWa,
  invalidarCacheWaInstancias,
} from './lib/whatsapp-instancias.js';
import { erroWaPublico } from './lib/wa-msg-publico.js';
import {
  atualizarWaInstancia,
  excluirWaInstanciaDb,
  listarWaInstancias,
  upsertWaInstancia,
} from './wa-instancias-store.js';
import { salvarMetaConfig } from './meta-config.js';

function slugNome(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export async function rotasWaInstanciasCrud(app: FastifyInstance): Promise<void> {
  app.get('/api/whatsapp/instancias', async () => {
    const lista = await carregarInstanciasWa();
    const todas = await listarWaInstancias({ soAtivas: false }).catch(() => []);
    return {
      ok: true,
      instances: lista.map((i) => i.name),
      meta: lista,
      default: lista[0]?.name,
      labels: lista.map((i) => ({
        name: i.name,
        label: i.label,
        provider: i.provider,
        chatwootInboxName: i.chatwootInboxName,
      })),
      todas,
    };
  });

  app.post('/api/whatsapp/instancias', async (req, reply) => {
    try {
      const body = (req.body ?? {}) as {
        nome?: string;
        label?: string;
        inbox_name?: string;
        provider?: string;
        /** 'WHATSAPP-BAILEYS' (default) ou 'WHATSAPP-BUSINESS' (API Oficial Meta) */
        integration?: string;
        /** Meta Cloud API: Phone Number ID */
        phone_number_id?: string;
        /** Meta Cloud API: Access Token */
        access_token?: string;
        /** Meta Cloud API: Business Account ID */
        business_account_id?: string;
      };
      
      let base = slugNome(String(body.nome || body.label || ''));
      if (!base && body.integration !== 'WHATSAPP-BUSINESS') {
        return reply.code(400).send({ ok: false, erro: 'Informe nome ou label' });
      }

      const provider = body.provider === 'uazapi' ? 'uazapi' : 'evolution';
      if (provider === 'uazapi') {
        return reply.code(400).send({
          ok: false,
          erro: 'UazAPI usa a linha atendimento do .env — crie linhas Evolution aqui',
        });
      }

      const integration = body.integration === 'WHATSAPP-BUSINESS'
        ? 'WHATSAPP-BUSINESS' as const
        : 'WHATSAPP-BAILEYS' as const;

      if (integration === 'WHATSAPP-BUSINESS') {
        const phoneId = body.phone_number_id || config.metaPhoneNumberId;
        const accessToken = body.access_token || config.metaAccessToken;
        const businessId = body.business_account_id || config.metaBusinessAccountId;

        if (!phoneId || !accessToken || !businessId) {
          return reply.code(400).send({
            ok: false,
            erro: 'Para API Oficial Meta, informe Phone Number ID, Access Token e Business Account ID',
          });
        }
        
        body.phone_number_id = phoneId;
        body.access_token = accessToken;
        
        // Auto-generate name if empty for Meta
        if (!base) {
          base = `oficial-meta-${Date.now().toString().slice(-6)}`;
        }

        // Salvar as configurações no DB
        await salvarMetaConfig(phoneId, accessToken, businessId).catch(e => {
          console.error('[wa-instancias] Erro ao salvar configs no banco:', e);
        });
      }

      const slug = (process.env.APP_SLUG || 'app').trim();
      const nome = base.includes(slug) ? base : `${slug}-${base}`;
      const label = (body.label || base).trim();
      const inbox = (body.inbox_name || label).trim();
      const webhook =
        process.env.IAGMX_WEBHOOK_EVOLUTION_URL || `${config.publicUrl}/webhook/evolution`;

      await criarInstanciaEvolution({
        instanceName: nome,
        webhookUrl: webhook,
        inboxName: inbox,
        integration,
        phoneNumberId: body.phone_number_id,
        accessToken: body.access_token,
      });

      const row = await upsertWaInstancia({
        nome,
        label: integration === 'WHATSAPP-BUSINESS' ? `${label} (API Oficial)` : label,
        provider: 'evolution',
        chatwoot_inbox_name: inbox,
        webhook_url: webhook,
        ativo: true,
      });
      invalidarCacheWaInstancias();
      await carregarInstanciasWa();
      return { ok: true, instancia: row };
    } catch (err) {
      return reply.code(502).send({ ok: false, erro: erroWaPublico(err) });
    }
  });

  app.patch('/api/whatsapp/instancias/:nome', async (req, reply) => {
    try {
      const { nome } = req.params as { nome: string };
      const body = (req.body ?? {}) as {
        label?: string;
        inbox_name?: string;
        ativo?: boolean;
      };
      const row = await atualizarWaInstancia(decodeURIComponent(nome), {
        label: body.label,
        chatwoot_inbox_name: body.inbox_name,
        ativo: body.ativo,
      });
      invalidarCacheWaInstancias();
      return { ok: true, instancia: row };
    } catch (err) {
      return reply.code(400).send({ ok: false, erro: erroWaPublico(err) });
    }
  });

  app.delete('/api/whatsapp/instancias/:nome', async (req, reply) => {
    try {
      const { nome } = req.params as { nome: string };
      const id = decodeURIComponent(nome);
      if (id === 'atendimento') {
        return reply.code(400).send({ ok: false, erro: 'Nao e permitido excluir atendimento Uaz' });
      }
      await excluirInstanciaEvolution(id);
      await excluirWaInstanciaDb(id);
      invalidarCacheWaInstancias();
      return { ok: true };
    } catch (err) {
      return reply.code(502).send({ ok: false, erro: erroWaPublico(err) });
    }
  });
}
