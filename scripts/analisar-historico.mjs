import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const l = line.trim();
    if (!l || l.startsWith('#')) continue;
    const idx = l.indexOf('=');
    if (idx > 0) {
      const k = l.substring(0, idx).trim();
      const v = l.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const url = process.env.EVOLUTION_URL || 'https://evolution.117.sanjaworks.com';
const apiKey = process.env.EVOLUTION_API_KEY || '4813f30ee3d04216a0f7fc9c901a3646';
const instance = process.env.EVOLUTION_INSTANCE || 'alumax-principal';
const telefoneTarget = '5512982787368';

console.log(`\n📊 Analisando histórico e status do contato ${telefoneTarget}...\n`);

async function analisarHistorico() {
  try {
    // 1. Busca mensagens no Evolution API
    console.log('1. Mensagens trocadas no WhatsApp (Evolution API):');
    const resMsgs = await fetch(`${url}/chat/findMessages/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        where: {
          key: {
            remoteJid: `${telefoneTarget}@s.whatsapp.net`
          }
        },
        limit: 20
      })
    });
    const msgsData = await resMsgs.json();
    const records = msgsData?.messages?.records || msgsData?.records || (Array.isArray(msgsData) ? msgsData : []);
    
    console.log(`Total de mensagens encontradas: ${records.length}`);
    for (const m of records.slice(-10)) {
      const fromMe = m.key?.fromMe;
      const texto = m.message?.conversation || m.message?.extendedTextMessage?.text || (m.messageType || 'outra mídia');
      const dataHora = new Date((m.messageTimestamp || 0) * 1000).toLocaleString('pt-BR');
      console.log(`  [${dataHora}] ${fromMe ? '🤖 IA / Atendente' : '👤 Cliente'}: ${texto}`);
    }

    // 2. Checa se o contato está com a IA pausada no servidor em nuvem
    console.log('\n2. Verificando estado de Pausa da IA no servidor...');
    const resPausas = await fetch(`https://alumax.ia.sanjaworks.com/api/ia/pausas-ativas`);
    const pausasData = await resPausas.json();
    console.log('Pausas ativas no servidor:', JSON.stringify(pausasData, null, 2));

  } catch (err) {
    console.error('❌ Erro na análise:', err.message);
  }
}

analisarHistorico();
