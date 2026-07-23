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

console.log(`\n📱 Checando status do WhatsApp no servidor Evolution (${instance})...\n`);

async function checarStatus() {
  try {
    const res = await fetch(`${url}/instance/connectionState/${instance}`, {
      headers: { 'apikey': apiKey }
    });
    const data = await res.json();
    console.log('Status da Conexão:', JSON.stringify(data, null, 2));
    
    if (data?.instance?.state === 'open') {
      console.log('\n🟢 O WhatsApp ESTÁ CONECTADO E PRONTO PARA RESPONDER!');
    } else {
      console.log('\n🔴 O WhatsApp está desconectado ou aguardando leitura do QR Code / API Oficial Meta.');
    }
  } catch (err) {
    console.error('❌ Falha ao verificar status:', err.message);
  }
}

checarStatus();
