import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// 1. Carrega as variáveis de ambiente do arquivo .env
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

console.log('🧪 Iniciando Teste de Integração da API Oficial do Meta...');
console.log('META_ACCESS_TOKEN:', process.env.META_ACCESS_TOKEN ? 'Preenchido' : 'Vazio ⚠️');
console.log('META_PHONE_NUMBER_ID:', process.env.META_PHONE_NUMBER_ID || 'Vazio ⚠️');
console.log('META_BUSINESS_ACCOUNT_ID:', process.env.META_BUSINESS_ACCOUNT_ID || 'Vazio ⚠️');

async function test() {
  try {
    const { listarTemplatesMeta } = await import('../app/dist/lib/meta-api.js');
    
    console.log('\n📡 Tentando listar templates cadastrados na conta...');
    const templates = await listarTemplatesMeta();
    console.log(`✅ Sucesso! Encontrados ${templates.length} templates.`);
    console.log(JSON.stringify(templates.slice(0, 3), null, 2));

  } catch (err) {
    console.error('\n❌ Erro durante a execução do teste:', err.message);
  }
}

test();
