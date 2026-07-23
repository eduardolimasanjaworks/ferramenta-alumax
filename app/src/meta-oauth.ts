import type { FastifyInstance } from 'fastify';
import { config } from './config.js';
import { salvarMetaConfig } from './meta-config.js';

export async function rotasMetaOauth(app: FastifyInstance): Promise<void> {
  app.get('/api/meta/oauth/callback', async (req, reply) => {
    const query = req.query as { code?: string; error?: string; error_description?: string };

    if (query.error) {
      console.error(`[meta-oauth] Erro no callback: ${query.error} - ${query.error_description}`);
      return reply.type('text/html').send(`
        <html><body>
          <h2>Erro na Autenticação</h2>
          <p>${query.error_description || query.error}</p>
          <script>setTimeout(() => window.close(), 5000);</script>
        </body></html>
      `);
    }

    const code = query.code;
    if (!code) {
      return reply.status(400).send('Código de autorização não fornecido.');
    }

    const appId = config.metaAppId;
    const appSecret = config.metaAppSecret;

    if (!appId || !appSecret) {
      console.error('[meta-oauth] META_APP_ID ou META_APP_SECRET não estão configurados.');
      return reply.status(500).send('Erro interno: Credenciais do Aplicativo Meta não configuradas no servidor.');
    }

    try {
      // 1. Trocar o código pelo Access Token
      // A redirect_uri precisa ser exatamente a mesma configurada no painel do Meta
      const redirectUri = encodeURIComponent(`${config.publicUrl}/api/meta/oauth/callback`);
      const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`;
      
      const tokenRes = await fetch(tokenUrl);
      const tokenData = await tokenRes.json() as any;

      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(`Falha ao obter token: ${JSON.stringify(tokenData)}`);
      }

      const accessToken = tokenData.access_token;

      // 2. Tentar descobrir o WABA ID e o Phone ID da conta
      let wabaId = '';
      let phoneId = '';

      // Busca negócios
      const bizRes = await fetch(`https://graph.facebook.com/v20.0/me/businesses?access_token=${accessToken}`);
      const bizData = await bizRes.json() as any;
      
      if (bizData?.data?.length > 0) {
        const businessId = bizData.data[0].id;
        
        // Busca WABAs do negócio
        const wabaRes = await fetch(`https://graph.facebook.com/v20.0/${businessId}/owned_whatsapp_business_accounts?access_token=${accessToken}`);
        const wabaData = await wabaRes.json() as any;

        if (wabaData?.data?.length > 0) {
          wabaId = wabaData.data[0].id;

          // Busca números de telefone do WABA
          const phonesRes = await fetch(`https://graph.facebook.com/v20.0/${wabaId}/phone_numbers?access_token=${accessToken}`);
          const phonesData = await phonesRes.json() as any;

          if (phonesData?.data?.length > 0) {
            phoneId = phonesData.data[0].id;
          }
        }
      }

      // Se não encontrou automaticamente os IDs, vamos salvar apenas o token, o cliente pode preencher os IDs manualmente depois
      await salvarMetaConfig(phoneId, accessToken, wabaId);

      console.log(`[meta-oauth] Sucesso! Token recebido. WABA: ${wabaId || 'N/A'}, Phone: ${phoneId || 'N/A'}`);

      return reply.type('text/html').send(`
        <html><body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #27ae60;">WhatsApp Conectado com Sucesso!</h2>
          <p>O token de acesso foi salvo no sistema de forma segura.</p>
          ${!wabaId || !phoneId ? '<p style="color: #f39c12;">Nota: Não foi possível identificar o ID do WhatsApp automaticamente. Você pode precisar preenchê-lo manualmente no painel.</p>' : ''}
          <p>Você já pode fechar esta janela.</p>
          <script>
            setTimeout(() => {
              if(window.opener) window.close();
            }, 3000);
          </script>
        </body></html>
      `);

    } catch (err) {
      console.error('[meta-oauth] Erro no fluxo OAuth:', err);
      return reply.status(500).type('text/html').send(`
        <html><body>
          <h2 style="color: red;">Erro ao processar autenticação</h2>
          <p>${err instanceof Error ? err.message : String(err)}</p>
        </body></html>
      `);
    }
  });
}
