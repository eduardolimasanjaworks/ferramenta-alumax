/**
 * Rotas WhatsApp do painel Tilit.
 * Atendimento → Uaz sanjaworks; Comercial → Evolution.
 */
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { config } from './config.js';
import {
  desconectarInstancia,
  obterInfoInstancia,
  reiniciarInstancia,
} from './lib/evolution.js';
import {
  uazConnect,
  uazDisconnect,
  uazStatus,
} from './lib/uazapi.js';
import { erroWaPublico } from './lib/wa-msg-publico.js';
import {
  eUazAtendimento,
  listaInstanciasWa,
  resolverMetaInstancia,
} from './lib/whatsapp-instancias.js';

export function resolverInstancia(raw?: string | null): string {
  const meta = resolverMetaInstancia(raw);
  if (meta.provider === 'uazapi') return config.uazapiInstanceName || 'tilit';
  return meta.name;
}

function metaDoReq(req: FastifyRequest) {
  const q = (req.query ?? {}) as { instance?: string };
  const body = (req.body ?? {}) as { instance?: string };
  return resolverMetaInstancia(body.instance || q.instance);
}

export async function rotasWhatsappPainel(app: FastifyInstance): Promise<void> {
  // O GET /api/whatsapp/instancias foi movido para wa-instancias-rotas.ts

  app.get('/api/whatsapp/status', async (req, reply) => {
    try {
      const meta = metaDoReq(req);
      if (meta.provider === 'uazapi') {
        const st = await uazStatus();
        return {
          connected: st.conectado,
          state: st.state,
          telefone: st.telefone,
          profileName: st.profileName,
          instanceName: st.instanceName,
          provider: 'uazapi',
        };
      }
      const info = await obterInfoInstancia(meta.name);
      return {
        connected: info.connected,
        state: info.state,
        telefone: info.telefone,
        profileName: info.profileName,
        instanceName: info.instanceName,
        provider: 'evolution',
      };
    } catch (err) {
      return reply.status(502).send({ error: erroWaPublico(err) });
    }
  });

  app.get('/api/whatsapp/info', async (req, reply) => {
    try {
      const meta = metaDoReq(req);
      if (meta.provider === 'uazapi') {
        const st = await uazStatus();
        return {
          ok: true,
          connected: st.conectado,
          state: st.state,
          telefone: st.telefone,
          profileName: st.profileName,
          instanceName: meta.name,
          provider: 'uazapi',
        };
      }
      const info = await obterInfoInstancia(meta.name);
      return { ok: true, ...info, instanceName: meta.name, provider: 'evolution' };
    } catch (err) {
      return reply.status(502).send({ ok: false, erro: erroWaPublico(err) });
    }
  });

  app.get('/api/whatsapp/uazapi/chatwoot-config', async (_req, reply) => {
    return reply.status(410).send({
      ok: false,
      erro: 'Use o painel Atendimento / QR desta instância.',
    });
  });

  app.post('/api/whatsapp/reiniciar', async (req, reply) => {
    try {
      const meta = metaDoReq(req);
      if (meta.provider === 'uazapi') {
        const qr = await uazConnect();
        const st = await uazStatus();
        return { ok: true, state: st.state, info: st, qr, provider: 'uazapi' };
      }
      const resultado = await reiniciarInstancia(meta.name);
      const info = await obterInfoInstancia(meta.name);
      return { ok: true, state: resultado.state, info, provider: 'evolution' };
    } catch (err) {
      return reply.status(502).send({ ok: false, erro: erroWaPublico(err) });
    }
  });

  app.post('/api/whatsapp/desconectar', async (req, reply) => {
    try {
      const meta = metaDoReq(req);
      if (meta.provider === 'uazapi') {
        await uazDisconnect();
        const st = await uazStatus();
        return { ok: true, state: st.state, info: st, provider: 'uazapi' };
      }
      const resultado = await desconectarInstancia(meta.name);
      const info = await obterInfoInstancia(meta.name);
      return { ok: true, state: resultado.state, info, provider: 'evolution' };
    } catch (err) {
      return reply.status(502).send({ ok: false, erro: erroWaPublico(err) });
    }
  });

  app.get('/api/whatsapp/qr', async (req, reply) => {
    try {
      const meta = metaDoReq(req);
      if (meta.provider === 'uazapi') {
        const data = await uazConnect();
        const { uazConfigurarWebhook } = await import('./lib/uazapi.js');
        await uazConfigurarWebhook(
          process.env.UAZAPI_WEBHOOK_URL || `${config.publicUrl}/webhook/uazapi`,
        ).catch((err) => console.error('[whatsapp] webhook uaz:', err));
        return {
          connected: data.connected === true,
          code: data.code,
          pairingCode: data.pairingCode,
          instance: 'atendimento',
          provider: 'uazapi',
        };
      }

      const instance = meta.name;
      const state = await fetch(
        `${config.evolutionUrl}/instance/connectionState/${instance}`,
        { headers: { apikey: config.evolutionApiKey } },
      );
      const stateData = (await state.json()) as {
        state?: string;
        instance?: { state?: string };
      };
      const currentState = String(
        stateData.instance?.state ?? stateData.state ?? '',
      ).toLowerCase();
      if (currentState === 'open' || currentState === 'connected') {
        return { connected: true, instance, provider: 'evolution' };
      }

      const res = await fetch(`${config.evolutionUrl}/instance/connect/${instance}`, {
        headers: { apikey: config.evolutionApiKey },
      });
      const data = (await res.json()) as {
        code?: string;
        qrcode?: string;
        base64?: string;
        pairingCode?: string | null;
        message?: unknown;
        error?: unknown;
      };
      const rawMsg = data.message ?? data.error;
      const msg =
        typeof rawMsg === 'string'
          ? erroWaPublico(rawMsg)
          : rawMsg
            ? erroWaPublico(JSON.stringify(rawMsg))
            : undefined;
      return {
        code: data.base64 ?? data.code ?? data.qrcode,
        pairingCode: data.pairingCode,
        message: msg,
        instance,
        provider: 'evolution',
      };
    } catch (err) {
      console.error('[whatsapp] Erro QR:', err);
      return reply.status(502).send({ error: erroWaPublico(err) });
    }
  });
}

export { eUazAtendimento };
