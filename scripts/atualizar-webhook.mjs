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
const targetWebhookUrl = process.argv[2] || 'https://seven-baths-poke.loca.lt/webhook/evolution';

console.log(`\n🔗 Apontando Webhook da Evolution API diretamente para seu PC Local: ${targetWebhookUrl}...\n`);

async function apontarWebhookLocal() {
  try {
    const resSet = await fetch(`${url}/webhook/set/${instance}`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: targetWebhookUrl,
          byEvents: false,
          base64: true,
          events: [
            'MESSAGES_UPSERT'
          ]
        }
      })
    });

    const dataSet = await resSet.json();
    console.log('Resultado do Apontamento Local:', JSON.stringify(dataSet, null, 2));

  } catch (err) {
    console.error('❌ Erro ao atualizar webhook:', err.message);
  }
}

apontarWebhookLocal();
