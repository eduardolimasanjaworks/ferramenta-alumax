/**
 * Serviço de integração com a API Oficial do Meta (WhatsApp Cloud API).
 * Permite listar, criar e enviar templates de mensagens aprovadas.
 */
import { config } from '../config.js';
import { obterMetaConfig } from '../meta-config.js';

async function checkCredentials() {
  const meta = await obterMetaConfig();
  if (!meta.accessToken) throw new Error('META_ACCESS_TOKEN não está configurado no banco de dados ou .env');
  if (!meta.phoneId) throw new Error('META_PHONE_NUMBER_ID não está configurado no banco de dados ou .env');
  if (!meta.businessAccountId) throw new Error('META_BUSINESS_ACCOUNT_ID não está configurado no banco de dados ou .env');
  return meta;
}

/**
 * Retorna os cabeçalhos padrão para a API do Meta.
 */
function headersMeta(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Lista todos os templates oficiais da conta WABA.
 */
export async function listarTemplatesMeta(): Promise<any[]> {
  const meta = await checkCredentials();
  const url = `https://graph.facebook.com/v20.0/${meta.businessAccountId}/message_templates`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: headersMeta(meta.accessToken!),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Meta API Error (List Templates): ${res.status} - ${errorText}`);
  }

  const data = await res.json() as { data: any[] };
  return data.data || [];
}

/**
 * Envia um novo template oficial para aprovação na conta WABA.
 */
export async function criarTemplateMeta(
  nome: string,
  categoria: 'MARKETING' | 'UTILITY',
  texto: string,
  idioma = 'pt_BR'
): Promise<any> {
  const meta = await checkCredentials();
  const url = `https://graph.facebook.com/v20.0/${meta.businessAccountId}/message_templates`;
  
  const payload = {
    name: nome.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    category: categoria,
    language: idioma,
    components: [
      {
        type: 'BODY',
        text: texto,
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: headersMeta(meta.accessToken!),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Meta API Error (Create Template): ${res.status} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Envia uma mensagem de template oficial para um número de celular do cliente.
 */
export async function enviarTemplateMeta(
  telefone: string,
  templateNome: string,
  idioma = 'pt_BR',
  componentes: any[] = []
): Promise<any> {
  const meta = await checkCredentials();
  const url = `https://graph.facebook.com/v20.0/${meta.phoneId}/messages`;

  // Garante que o telefone possua apenas dígitos e DDI internacional
  const to = telefone.replace(/\D/g, '');

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateNome,
      language: {
        code: idioma,
      },
      components: componentes,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: headersMeta(meta.accessToken!),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Meta API Error (Send Template): ${res.status} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Envia uma mensagem de texto simples para um número de celular.
 */
export async function enviarMensagemTextoMeta(telefone: string, texto: string): Promise<any> {
  const meta = await checkCredentials();
  const url = `https://graph.facebook.com/v20.0/${meta.phoneId}/messages`;

  const to = telefone.replace(/\D/g, '');

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: {
      preview_url: false,
      body: texto,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: headersMeta(meta.accessToken!),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Meta API Error (Send Text): ${res.status} - ${errorText}`);
  }

  return await res.json();
}
