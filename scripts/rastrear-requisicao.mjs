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

console.log(`\n🔎 Rastreando requisições e mensagens no Evolution API (${instance})...\n`);

async function rastrear() {
  try {
    // 1. Busca os últimos chats da instância
    console.log('1. Buscando lista de chats na Evolution API...');
    const resChats = await fetch(`${url}/chat/findChats/${instance}`, {
      headers: { 'apikey': apiKey }
    });
    const chats = await resChats.json();
    console.log('Chats encontrados:', Array.isArray(chats) ? chats.length : chats);

    // Filter chat for 5512982787368
    if (Array.isArray(chats)) {
      const chatTarget = chats.find(c => String(c.id).includes('5512982787368'));
      console.log('Chat do 5512982787368:', JSON.stringify(chatTarget, null, 2));
    }

    // 2. Busca últimas 10 mensagens sem filtro
    console.log('\n2. Buscando últimas 10 mensagens recebidas/enviadas na instância...');
    const resMsgs = await fetch(`${url}/chat/findMessages/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        limit: 10
      })
    });
    const msgs = await resMsgs.json();
    console.log('Últimas mensagens registradas no Evolution:', JSON.stringify(msgs, null, 2));

  } catch (err) {
    console.error('❌ Erro no rastreamento:', err.message);
  }
}

rastrear();
