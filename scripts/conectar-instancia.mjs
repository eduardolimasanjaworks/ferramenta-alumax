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

console.log(`\n🔄 Reiniciando/conectando a instância WhatsApp (${instance})...\n`);

async function conectar() {
  try {
    const resConnect = await fetch(`${url}/instance/connect/${instance}`, {
      headers: { 'apikey': apiKey }
    });
    const dataConnect = await resConnect.json();
    console.log('Resultado do Connect:', JSON.stringify(dataConnect, null, 2));
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

conectar();
