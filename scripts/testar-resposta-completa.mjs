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

console.log('\n🤖 Testando geração de resposta completa do agente via OpenRouter/OpenAI...\n');

async function testarAgenteCompleto() {
  try {
    const { gerarRespostaAgente } = await import('../app/dist/agente-minasplaca.js');
    
    console.log('Gerando resposta da IA para 5512982787368...');
    const resposta = await gerarRespostaAgente({
      telefone: '5512982787368',
      mensagem: 'Ola bom dia',
      historico: [],
      pushName: 'Victor Hugo'
    });

    console.log('\n--------------------------------------------------');
    console.log('Resposta Gerada:', resposta);
    console.log('--------------------------------------------------\n');
    console.log('✅ Agente de IA respondeu sem erros!');
  } catch (err) {
    console.error('❌ Erro no agente:', err);
  }
}

testarAgenteCompleto();
