/**
 * Webhook UazAPI → debounce da IA (linha Atendimento).
 * Eventos "messages"; ignora fromMe; dedupe por messageid.
 */
import type { FastifyInstance } from 'fastify';
import { adicionarAoDebounce } from './debounce-minasplaca.js';
import { iaEstaPausada } from './pausa-minasplaca.js';
import { linhaTemLicencaIa } from './licenca-ia.js';
import { jidParaTelefone } from './util/telefone.js';
import { marcarMensagemNova } from './lib/msg-dedupe.js';
import type { ItemDebounce } from './lib/tipos.js';

type MsgUaz = {
  fromMe?: boolean;
  isGroup?: boolean;
  chatid?: string;
  messageid?: string;
  id?: string;
  text?: string;
  senderName?: string;
};

type PayloadUaz = {
  EventType?: string;
  event?: string;
  message?: MsgUaz;
  chat?: { phone?: string; wa_chatid?: string; name?: string };
};

export async function rotasWebhookUazapi(app: FastifyInstance): Promise<void> {
  app.post('/webhook/uazapi', async (req, reply) => {
    const payload = (req.body ?? {}) as PayloadUaz;
    const evento = String(payload.EventType ?? payload.event ?? '').toLowerCase();
    if (evento && evento !== 'messages' && !evento.includes('message')) {
      return reply.status(200).send({ ok: true, ignorado: evento });
    }

    const msg = payload.message;
    if (!msg) return reply.status(200).send({ ok: true, ignorado: 'sem_message' });
    if (msg.fromMe) return reply.status(200).send({ ok: true, ignorado: 'fromMe' });
    if (msg.isGroup) return reply.status(200).send({ ok: true, ignorado: 'grupo' });

    const messageId = msg.messageid || msg.id;
    if (!(await marcarMensagemNova(messageId))) {
      return reply.status(200).send({ ok: true, ignorado: 'duplicada', messageId });
    }

    const remoteJid = msg.chatid || payload.chat?.wa_chatid || '';
    const telefone =
      jidParaTelefone(remoteJid) || String(payload.chat?.phone ?? '').replace(/\D/g, '');
    if (!telefone) return reply.status(200).send({ ok: true, ignorado: 'sem_telefone' });

    const instance = 'atendimento';
    if (!(await linhaTemLicencaIa(instance))) {
      return reply.status(200).send({ ok: true, ignorado: 'sem_licenca_ia', instance });
    }
    if (await iaEstaPausada(telefone)) {
      return reply.status(200).send({ ok: true, ignorado: 'ia_pausada', telefone });
    }

    const conteudo = String(msg.text ?? '').trim();
    if (!conteudo) return reply.status(200).send({ ok: true, ignorado: 'sem_conteudo' });

    await adicionarAoDebounce({
      remoteJid: remoteJid || `${telefone}@s.whatsapp.net`,
      telefone,
      conteudo,
      tipo: 'texto',
      pushName: msg.senderName || payload.chat?.name,
      instance,
      midiaId: messageId,
      recebidoEm: Date.now(),
    } as ItemDebounce);

    return reply.status(200).send({ ok: true, processado: true, provider: 'uazapi' });
  });
}
