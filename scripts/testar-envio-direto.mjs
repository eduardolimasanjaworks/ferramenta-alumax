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

console.log(`\n📤 Disparando mensagem de teste via Evolution API para ${telefoneTarget}...\n`);

async function enviar() {
  try {
    const res = await fetch(`${url}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        number: telefoneTarget,
        text: '👋 Olá Victor! Teste de envio e resposta da IA Alumax. Por favor, me responda com um "Ola"!'
      })
    });
    const data = await res.json();
    console.log('Resultado do envio direto:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Erro no disparo:', err.message);
  }
}

enviar();
