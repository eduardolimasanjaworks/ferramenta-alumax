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

console.log(`\n🔍 Verificando informações da instância ${instance} e número 5512982787368...\n`);

async function checarInfo() {
  try {
    const resInst = await fetch(`${url}/instance/fetchInstances?instanceName=${instance}`, {
      headers: { 'apikey': apiKey }
    });
    const instances = await resInst.json();
    console.log('Dados da Instância WhatsApp:', JSON.stringify(instances, null, 2));
  } catch (err) {
    console.error('Erro ao buscar instância:', err.message);
  }
}

checarInfo();
