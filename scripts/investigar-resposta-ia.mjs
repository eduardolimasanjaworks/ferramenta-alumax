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

console.log(`\n🔍 Investigando por que a IA não respondeu para 5512982787368...\n`);

async function investigar() {
  try {
    // 1. Checa status da pausa no servidor de producao
    console.log('1. Checando se a IA está pausada para 5512982787368...');
    const resPausa = await fetch('https://alumax.ia.sanjaworks.com/api/ia/pausas-ativas');
    const pausas = await resPausa.json();
    console.log('Pausas ativas em Produção:', JSON.stringify(pausas, null, 2));

    const resPausaGlobal = await fetch('https://alumax.ia.sanjaworks.com/api/ia/pausa-global');
    const pausaGlobal = await resPausaGlobal.json();
    console.log('Pausa Global em Produção:', JSON.stringify(pausaGlobal, null, 2));

    // 2. Busca últimas mensagens recebidas do contato na Evolution
    console.log('\n2. Buscando últimas mensagens da instância no Evolution...');
    const resMsgs = await fetch(`${url}/chat/findMessages/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        where: {
          key: {
            remoteJid: '5512982787368@s.whatsapp.net'
          }
        },
        limit: 5
      })
    });
    const msgsData = await resMsgs.json();
    console.log('Últimas Mensagens no Evolution:', JSON.stringify(msgsData, null, 2));

  } catch (err) {
    console.error('❌ Erro durante a investigação:', err.message);
  }
}

investigar();
