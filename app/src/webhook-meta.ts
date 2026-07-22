import type { FastifyInstance } from 'fastify';
import { config } from './config.js';
import { chatwootFetch } from './chatwoot-sync.js';
import { adicionarAoDebounce } from './debounce-minasplaca.js';
import { iaEstaPausada } from './pausa-minasplaca.js';
import { linhaTemLicencaIa } from './licenca-ia.js';
import { marcarMensagemNova } from './lib/msg-dedupe.js';
import type { ItemDebounce } from './lib/tipos.js';

export async function rotasWebhookMeta(app: FastifyInstance): Promise<void> {
  // Rota GET para verificação do Webhook (hub.challenge)
  app.get('/webhook/meta', async (req, reply) => {
    const query = req.query as {
      'hub.mode'?: string;
      'hub.verify_token'?: string;
      'hub.challenge'?: string;
    };

    if (query['hub.mode'] === 'subscribe' && query['hub.verify_token'] === config.metaVerifyToken) {
      console.log('[webhook-meta] Webhook verificado com sucesso pelo Meta!');
      return reply.status(200).send(Number(query['hub.challenge']));
    }
    
    console.warn('[webhook-meta] Falha na verificação do webhook. Token inválido.');
    return reply.status(403).send('Forbidden');
  });

  // Rota POST para receber mensagens e eventos
  app.post('/webhook/meta', async (req, reply) => {
    const payload = req.body as any;

    // Retorna OK imediatamente para o Meta não reenviar (timeout é curto)
    reply.status(200).send({ ok: true, processado: true });

    // Processamento assíncrono (I.A. e Chatwoot API Channel)
    try {
      if (payload.object !== 'whatsapp_business_account' || !payload.entry) return;

      for (const entry of payload.entry) {
        for (const change of entry.changes || []) {
          if (change.field !== 'messages') continue;
          
          const val = change.value;
          if (!val || !val.messages || val.messages.length === 0) continue;

          for (const msg of val.messages) {
            // Ignora se não for texto (ou pode adaptar para áudio depois)
            if (msg.type !== 'text' || !msg.text?.body) continue;

            const messageId = msg.id;
            // Evitar duplicação
            if (!(await marcarMensagemNova(messageId))) {
              console.log(`[webhook-meta] Mensagem ${messageId} já processada (duplicada).`);
              continue;
            }

            // O telefone de quem enviou (já vem com código do país)
            const telefone = msg.from;
            if (!telefone) continue;

            // Pega o nome do contato (opcional, pode não vir se não for o primeiro contato)
            const pushName = val.contacts?.find((c: any) => c.wa_id === msg.from)?.profile?.name || 'Contato';

            const conteudo = msg.text.body.trim();
            if (!conteudo) continue;

            // Envia mensagem para o Chatwoot (API Inbox)
            if (config.chatwootMetaInboxId) {
              enviarParaChatwoot(telefone, pushName, conteudo).catch(err => {
                console.error('[webhook-meta] Erro ao enviar mensagem para Chatwoot:', err);
              });
            }

            // Valida licença e pausa da IA
            const instance = 'meta-principal'; // Pode customizar conforme necessário
            if (!(await linhaTemLicencaIa(instance))) {
              console.log(`[webhook-meta] Sem licença IA na linha ${instance}.`);
              continue;
            }
            
            if (await iaEstaPausada(telefone)) {
              console.log(`[webhook-meta] IA pausada para ${telefone} — mensagem ignorada.`);
              continue;
            }

            // Adiciona no debounce (fila da IA)
            await adicionarAoDebounce({
              remoteJid: `${telefone}@s.whatsapp.net`,
              telefone,
              conteudo,
              tipo: 'texto',
              pushName,
              instance,
              midiaId: messageId,
              recebidoEm: Date.now(),
            } as ItemDebounce);
          }
        }
      }
    } catch (err) {
      console.error('[webhook-meta] Erro ao processar payload para IA:', err);
    }
  });
}

// Função auxiliar para enviar a mensagem recebida para o Chatwoot
async function enviarParaChatwoot(telefone: string, nome: string, texto: string) {
  const accountId = config.chatwootAccountId;
  const inboxId = config.chatwootMetaInboxId;
  const phoneFormated = '+' + telefone;

  // 1. Procurar ou Criar Contato
  let cRes = await chatwootFetch(`/api/v1/accounts/${accountId}/contacts/search?q=${encodeURIComponent(phoneFormated)}`);
  let cData = (await cRes.json()) as any;
  let contactId = cData.payload && cData.payload.length > 0 ? cData.payload[0].id : null;

  if (!contactId) {
    let cCreate = await chatwootFetch(`/api/v1/accounts/${accountId}/contacts`, {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneFormated, name: nome })
    });
    let cCreateData = (await cCreate.json()) as any;
    contactId = cCreateData.payload.contact.id;
  }

  // 2. Procurar ou Criar Conversa
  let convRes = await chatwootFetch(`/api/v1/accounts/${accountId}/contacts/${contactId}/conversations`);
  let convData = (await convRes.json()) as any;
  let conv = convData.payload ? convData.payload.find((c: any) => c.inbox_id === inboxId) : null;
  let convId = conv ? conv.id : null;

  if (!convId) {
    let convCreate = await chatwootFetch(`/api/v1/accounts/${accountId}/conversations`, {
      method: 'POST',
      body: JSON.stringify({ inbox_id: inboxId, contact_id: contactId, source_id: phoneFormated })
    });
    let convCreateData = (await convCreate.json()) as any;
    convId = convCreateData.id;
  }

  // 3. Adicionar Mensagem
  await chatwootFetch(`/api/v1/accounts/${accountId}/conversations/${convId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content: texto, message_type: 'incoming' })
  });
}
