import { config } from '../config.js';

export async function criarInstanciaEvolution(input: {
  instanceName: string;
  webhookUrl: string;
  inboxName: string;
  /** 'WHATSAPP-BAILEYS' (QR Code) ou 'WHATSAPP-BUSINESS' (API Oficial Meta) */
  integration?: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS';
  /** Obrigatório quando integration = WHATSAPP-BUSINESS */
  phoneNumberId?: string;
  /** Obrigatório quando integration = WHATSAPP-BUSINESS */
  accessToken?: string;
}): Promise<void> {
  const integration = input.integration || 'WHATSAPP-BAILEYS';
  const isCloudApi = integration === 'WHATSAPP-BUSINESS';

  const urlCreate = `${config.evolutionUrl}/instance/create`;
  const bodyCreate: Record<string, unknown> = {
    instanceName: input.instanceName,
    token: config.evolutionApiKey,
    integration,
  };

  if (isCloudApi) {
    if (!input.phoneNumberId || !input.accessToken) {
      throw new Error('phoneNumberId e accessToken são obrigatórios para a API Oficial Meta');
    }
    bodyCreate.number = input.phoneNumberId;
    bodyCreate.business = {
      phoneNumberId: input.phoneNumberId,
      accessToken: input.accessToken,
    };
  } else {
    bodyCreate.qrcode = true;
  }
  
  const resCreate = await fetch(urlCreate, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.evolutionApiKey,
    },
    body: JSON.stringify(bodyCreate),
  });
  
  if (!resCreate.ok) {
    throw new Error(`Erro ao criar instancia Evolution: ${await resCreate.text()}`);
  }

  // Configure Webhook
  const urlWebhook = `${config.evolutionUrl}/webhook/set/${input.instanceName}`;
  const bodyWebhook = {
    webhook: {
      enabled: true,
      url: input.webhookUrl,
      webhook_by_events: false,
      webhook_base64: true,
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
    },
  };
  
  const resWebhook = await fetch(urlWebhook, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.evolutionApiKey,
    },
    body: JSON.stringify(bodyWebhook),
  });
  
  if (!resWebhook.ok) {
    console.error(`[evolution-instancia] falha ao setar webhook: ${await resWebhook.text()}`);
  }

  // Configure Chatwoot if available
  if (config.chatwootUrl && config.chatwootAccountId && config.chatwootPlatformToken) {
    const urlChatwoot = `${config.evolutionUrl}/chatwoot/set/${input.instanceName}`;
    const bodyChatwoot = {
      enabled: true,
      accountId: config.chatwootAccountId,
      url: config.chatwootUrl,
      token: config.chatwootPlatformToken,
      inboxName: input.inboxName,
      signMsg: true,
      reopenConversation: false,
      conversationPending: false,
    };
    
    const resChatwoot = await fetch(urlChatwoot, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.evolutionApiKey,
      },
      body: JSON.stringify(bodyChatwoot),
    });
    
    if (!resChatwoot.ok) {
      console.error(`[evolution-instancia] falha ao configurar chatwoot: ${await resChatwoot.text()}`);
    }
  }
}

export async function excluirInstanciaEvolution(instanceName: string): Promise<void> {
  const urlDelete = `${config.evolutionUrl}/instance/delete/${instanceName}`;
  const res = await fetch(urlDelete, {
    method: 'DELETE',
    headers: {
      apikey: config.evolutionApiKey,
    },
  });
  
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.warn(`[evolution-instancia] falha ao deletar instancia no evolution: ${res.status} ${txt}`);
  }
}
